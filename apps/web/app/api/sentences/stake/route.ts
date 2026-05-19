import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { countCharacters } from "@languagefi/core"
import { prisma } from "@languagefi/db"

const stakeSchema = z.object({
  sentence: z.string().min(1),
  wallet: z.string().optional(),
})

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex")
}

type QuoteRow = {
  char: string
  count: number
  status?: string
  unitPrice?: number
  total?: number
}

function merkleRoot(leaves: string[]) {
  if (!leaves.length) return sha256("empty-sentence")

  let layer = leaves.map((leaf) => sha256(leaf))
  while (layer.length > 1) {
    if (layer.length % 2 === 1) {
      layer.push(layer[layer.length - 1])
    }

    const nextLayer: string[] = []
    for (let index = 0; index < layer.length; index += 2) {
      nextLayer.push(sha256(`${layer[index]}|${layer[index + 1]}`))
    }
    layer = nextLayer
  }

  return layer[0]
}

async function buildQuote(sentence: string) {
  const normalized = sentence.toUpperCase().trim().replace(/\s+/g, " ")
  const counts = countCharacters(normalized)
  const breakdown: QuoteRow[] = []

  let total = 0

  for (const [char, count] of Object.entries(counts.counts)) {
    const countValue = Number(count)
    const primitive = await prisma.primitive.findUnique({ where: { symbol: char } })
    if (!primitive) {
      breakdown.push({ char, count: countValue, status: "unavailable" })
      continue
    }

    const price = await prisma.primitivePrice.findFirst({
      where: { primitiveId: primitive.id },
      orderBy: { calculatedAt: "desc" },
    })

    if (!price) {
      breakdown.push({ char, count: countValue, status: "no_price" })
      continue
    }

    const totalForChar = price.priceLgu * countValue
    total += totalForChar
    breakdown.push({
      char,
      count: countValue,
      unitPrice: price.priceLgu,
      total: totalForChar,
    })
  }

  return {
    normalized,
    counts,
    total,
    breakdown,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = stakeSchema.parse(body)

    const quote = await buildQuote(validated.sentence)
    const sentenceHash = sha256(quote.normalized)
    const merkleLeaves = quote.breakdown.map((item) => `${item.char}:${item.count}:${item.unitPrice ?? 0}:${item.total ?? 0}`)
    const merkleRootValue = merkleRoot([sentenceHash, ...merkleLeaves])
    const diversity = quote.counts.totalCount > 0 ? quote.counts.uniqueCharacters / quote.counts.totalCount : 0
    const walletLinked = Boolean(validated.wallet)
    const appraisalScore = Math.max(0, Math.min(100, Math.round(quote.total * 8 + diversity * 25 - merkleLeaves.length * 0.5)))
    const topChars = quote.breakdown
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => `${item.char}:${item.count}`)

    const sentenceRecord = await prisma.sentence.upsert({
      where: { sentenceHash },
      update: {
        normalizedText: quote.normalized,
        ownerWallet: validated.wallet || null,
        baseValueLgu: quote.total,
        status: walletLinked ? "staked" : "available",
      },
      create: {
        sentenceHash,
        normalizedText: quote.normalized,
        ownerWallet: validated.wallet || null,
        baseValueLgu: quote.total,
        status: walletLinked ? "staked" : "available",
      },
    })

    const appraisalText = [
      `${quote.counts.uniqueCharacters} unique characters priced at ${quote.total.toFixed(4)} LGU.`,
      `Top character clusters: ${topChars.join(", ") || "none"}.`,
      `Diversity ${(diversity * 100).toFixed(1)}% with appraisal score ${appraisalScore}/100.`,
    ].join(" ")

    const response = {
      status: "success",
      sentence: quote.normalized,
      sentenceHash,
      merkleRoot: merkleRootValue,
      wallet: validated.wallet || null,
      ownerWallet: sentenceRecord.ownerWallet,
      sentenceId: sentenceRecord.id,
      quote: {
        total: quote.total,
        breakdown: quote.breakdown,
        uniqueCharacters: quote.counts.uniqueCharacters,
        totalCharacters: quote.counts.totalCount,
      },
      appraisal: {
        diversity,
        anchorTarget: "solana-devnet",
        anchorReady: walletLinked,
        baseValueLgu: quote.total,
        status: sentenceRecord.status,
        score: appraisalScore,
        narrative: appraisalText,
      },
      attestation: {
        root: merkleRootValue,
        leafCount: merkleLeaves.length + 1,
        sourceCount: quote.breakdown.length,
        anchorTarget: "solana-devnet",
        anchorReady: true,
        ledgerHash: merkleRootValue,
        network: "solana-devnet",
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Sentence stake error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to stake sentence" },
      { status: 400 }
    )
  }
}
