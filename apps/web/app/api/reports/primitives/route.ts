import { NextResponse } from "next/server"
import { generatePrimitiveReport } from "@languagefi/reports"
import { prisma } from "@languagefi/db"

export async function GET() {
  try {
    const primitives = await prisma.primitivePrice.findMany({
      include: { primitive: true },
      orderBy: { priceLgu: "desc" },
      take: 100
    })

    const data = {
      primitives: primitives.map(p => ({
        symbol: p.primitive.symbol,
        price: p.priceLgu,
        change: p.change24h || 0,
        volume: p.currentWeekUsage || 0,
        rank: p.rank || 0
      })),
      generatedAt: new Date(),
      period: "Last 24 Hours"
    }

    const pdf = generatePrimitiveReport(data)

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=language-fi-primitives-report.pdf"
      }
    })
  } catch (error: any) {
    console.error("Report generation error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
