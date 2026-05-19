import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex")
}

function merkleRoot(leaves: string[]) {
  if (!leaves.length) return sha256("empty-attestation-set")

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

export async function GET() {
  try {
    const [latestPrices, latestRuns] = await Promise.all([
      prisma.primitivePrice.findMany({
        orderBy: { calculatedAt: "desc" },
        take: 64,
        include: { primitive: true },
      }),
      prisma.oracleRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 16,
      }),
    ])

    const leaves = latestPrices.map((price: {
      primitive: { symbol: string; type: string };
      priceLgu: number;
      calculatedAt: Date;
      rank: number | null;
      currentWeekUsage: number | null;
    }) =>
      `${price.primitive.symbol}:${price.priceLgu}:${price.calculatedAt.toISOString()}:${price.rank ?? 0}:${price.currentWeekUsage ?? 0}`
    )
    const root = merkleRoot(leaves)
    const latestRun = latestRuns[0] || null
    const sourceNames = new Set(latestPrices.map((price: { primitive: { type: string } }) => price.primitive.type))

    return NextResponse.json({
      status: "success",
      data: {
        root,
        leafCount: leaves.length,
        sourceCount: sourceNames.size,
        anchorTarget: "solana-devnet",
        anchorReady: leaves.length > 0,
        network: "solana-devnet",
        ledgerHash: latestRun?.runHash || root,
        runHash: latestRun?.runHash || null,
        lastRunAt: latestRun?.startedAt || null,
        supportedSources: [
          "CoinGecko",
          "Gate.io",
          "DexScreener",
          "Solana RPC",
          "Web snapshots",
          "Oracle ledger",
        ],
        latestLeaves: leaves.slice(0, 8),
        attestedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Attestation API error:", error)
    return NextResponse.json(
      { status: "error", error: error.message || "Failed to build attestation" },
      { status: 500 }
    )
  }
}
