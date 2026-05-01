import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.oracleRun.findUnique({
      where: { id: params.id }
    })

    if (!run) {
      return NextResponse.json(
        { status: "error", message: "Oracle run not found" },
        { status: 404 }
      )
    }

    let inputSnapshot = null
    if (run.inputSnapshot) {
      try {
        inputSnapshot = JSON.parse(run.inputSnapshot)
      } catch (e) {
        inputSnapshot = null
      }
    }

    return NextResponse.json({
      status: "success",
      data: {
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
        notes: run.notes,
        inputSnapshot
      }
    })
  } catch (error: any) {
    console.error("Oracle run detail API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to fetch oracle run"
      },
      { status: 500 }
    )
  }
}
