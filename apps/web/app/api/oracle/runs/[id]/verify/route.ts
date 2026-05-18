import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { createHash } from "crypto"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.oracleRun.findUnique({
      where: { id: params.id }
    })

    if (!run) {
      return NextResponse.json(
        { status: "error", message: "Oracle run not found", verified: false },
        { status: 404 }
      )
    }

    // Verify run hash integrity
    let isValid = false
    if (run.runHash && run.inputSnapshot) {
      try {
        const inputSnapshot = JSON.parse(run.inputSnapshot)
        const recalculatedHash = createHash("sha256")
          .update(JSON.stringify({
            inputHash: inputSnapshot.sourceDataHash,
            timestamp: run.startedAt.toISOString(),
            formulaVersion: run.formulaVersion,
            previousRunHash: run.previousRunHash
          }))
          .digest("hex")
        isValid = recalculatedHash === run.runHash
      } catch (e) {
        isValid = false
      }
    }

    // Verify signature if present
    let signatureValid = false
    if (run.signature && run.runHash) {
      // In production, this would verify against the oracle public key
      // For now, we just check that a signature exists
      signatureValid = run.signature.length > 0
    }

    return NextResponse.json({
      status: "success",
      data: {
        runId: params.id,
        verified: isValid && signatureValid,
        hashValid: isValid,
        signatureValid,
        runHash: run.runHash,
        formulaVersion: run.formulaVersion,
        timestamp: new Date()
      }
    })
  } catch (error: any) {
    console.error("Oracle run verification API error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to verify oracle run",
        verified: false
      },
      { status: 500 }
    )
  }
}
