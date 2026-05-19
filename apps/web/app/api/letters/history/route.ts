import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex")
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const letter = (searchParams.get("letter") || "A").toUpperCase()
    const limit = Math.max(1, Math.min(Number(searchParams.get("limit") || 30), 180))

    if (!/^[A-Z0-9 ]$/.test(letter)) {
      return NextResponse.json({ error: "A single letter, number, or space is required" }, { status: 400 })
    }

    const primitive = await prisma.primitive.findUnique({
      where: { symbol: letter },
    })

    if (!primitive) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 })
    }

    const rows = await prisma.primitivePrice.findMany({
      where: { primitiveId: primitive.id },
      orderBy: { calculatedAt: "asc" },
      take: limit,
    })

    const history = rows.map((row: {
      priceLgu: number;
      change24h: number | null;
      calculatedAt: Date;
      rank: number | null;
      currentWeekUsage: number | null;
      volatility: string | null;
      oracleConfidence: number | null;
    }, index: number) => {
      const previous = rows[index - 1] as typeof row | undefined
      const derivedChange = previous && previous.priceLgu > 0
        ? ((row.priceLgu - previous.priceLgu) / previous.priceLgu) * 100
        : row.change24h ?? null

      return {
        at: row.calculatedAt,
        priceLgu: row.priceLgu,
        change24h: derivedChange,
        rank: row.rank,
        currentWeekUsage: row.currentWeekUsage,
        volatility: row.volatility,
        oracleConfidence: row.oracleConfidence,
        rowHash: sha256(`${primitive.symbol}:${row.priceLgu}:${row.calculatedAt.toISOString()}`),
      }
    })

    const seriesHash = sha256(
      history
        .map((point: { at: Date | string; priceLgu: number }) => `${point.at instanceof Date ? point.at.toISOString() : new Date(point.at).toISOString()}:${point.priceLgu}`)
        .join("|") || `${primitive.symbol}:empty`
    )

    return NextResponse.json({
      status: "success",
      letter,
      primitive: {
        id: primitive.id,
        symbol: primitive.symbol,
        displaySymbol: primitive.displaySymbol,
        type: primitive.type,
      },
      seriesHash,
      history,
      latest: history.at(-1) || null,
      sourceCount: history.length,
    })
  } catch (error: any) {
    console.error("Letter history error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch letter history" },
      { status: 500 }
    )
  }
}
