import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const primitive = await prisma.primitive.findUnique({
      where: { symbol: params.symbol.toUpperCase() }
    })

    if (!primitive) {
      return NextResponse.json(
        { status: "error", message: "Primitive not found" },
        { status: 404 }
      )
    }

    const latestPrice = await prisma.primitivePrice.findFirst({
      where: { primitiveId: primitive.id },
      orderBy: { calculatedAt: "desc" }
    })

    if (!latestPrice) {
      return NextResponse.json({
        status: "unavailable",
        message: "No price data available for this primitive",
        data: null
      })
    }

    const latestRun = await prisma.oracleRun.findFirst({
      orderBy: { startedAt: "desc" },
      take: 1
    })

    const runNotes = latestRun ? JSON.parse(latestRun.notes || "{}") : {}

    return NextResponse.json({
      status: "success",
      data: {
        symbol: primitive.symbol,
        displaySymbol: primitive.displaySymbol,
        type: primitive.type,
        latestPrice: {
          priceLgu: latestPrice.priceLgu,
          change24h: latestPrice.change24h,
          currentWeekUsage: latestPrice.currentWeekUsage,
          rank: latestPrice.rank,
          calculatedAt: latestPrice.calculatedAt
        },
        linkedOracleRun: latestRun ? {
          id: latestRun.id,
          startedAt: latestRun.startedAt,
          inputHash: runNotes.inputHash,
          outputHash: runNotes.outputHash,
          policyVersion: runNotes.policyVersion
        } : null,
        sourceWeights: runNotes.sourceWeights || {},
        priceComponents: {
          frequency: latestPrice.currentWeekUsage,
          velocity: latestPrice.change24h,
          oracleConfidence: latestPrice.oracleConfidence
        },
        confidenceScore: latestPrice.oracleConfidence || 0,
        excludedObservations: runNotes.excludedObservations || 0,
        anomalyFlags: runNotes.anomalyFlags || [],
        quarantineStatus: runNotes.quarantinedSources || []
      }
    })
  } catch (error: any) {
    console.error("Primitive provenance API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to fetch primitive provenance"
      },
      { status: 500 }
    )
  }
}
