import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET() {
  try {
    const runs = await prisma.oracleRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50
    })

    return NextResponse.json({
      status: "success",
      data: runs.map(run => ({
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        formulaVersion: run.formulaVersion,
        runHash: run.runHash,
        previousRunHash: run.previousRunHash,
        signature: run.signature,
        sourceCount: run.sourceCount,
        observationCount: run.observationCount,
        primitiveCount: run.primitiveCount,
        errorCount: run.errorCount,
        notes: run.notes
      }))
    })
  } catch (error: any) {
    console.error("Oracle runs API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to fetch oracle runs",
        data: []
      },
      { status: 500 }
    )
  }
}
