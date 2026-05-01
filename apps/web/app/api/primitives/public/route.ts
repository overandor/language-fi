import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET() {
  try {
    const data = await prisma.primitivePrice.findMany({
      orderBy: { priceLgu: "desc" },
      include: {
        primitive: true,
      },
      take: 100,
    })

    if (!data.length) {
      return NextResponse.json({
        status: "empty",
        message: "No primitive prices calculated yet. Configure data sources and run oracle.",
        data: []
      })
    }

    return NextResponse.json({
      status: "success",
      data: data.map((p) => ({
        id: p.id,
        symbol: p.primitive.symbol,
        displaySymbol: p.primitive.displaySymbol,
        type: p.primitive.type,
        priceLgu: p.priceLgu,
        change24h: p.change24h,
        currentWeekUsage: p.currentWeekUsage,
        rank: p.rank,
        calculatedAt: p.calculatedAt,
      }))
    })
  } catch (error: any) {
    console.error("Public primitives API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to fetch primitive prices",
        data: []
      },
      { status: 500 }
    )
  }
}
