import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { z } from "zod"

const claimSchema = z.object({
  positionId: z.string()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = claimSchema.parse(body)
    
    const position = await prisma.lPPosition.findUnique({
      where: { id: validated.positionId }
    })
    
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }
    
    // TODO: Execute onchain claim transaction
    const claimTx = "0x..." // Placeholder
    
    await prisma.lPPosition.update({
      where: { id: validated.positionId },
      data: {
        lastClaimAt: new Date(),
        totalClaimed: { increment: position.pendingFees || 0 },
        pendingFees: 0
      }
    })
    
    return NextResponse.json({ 
      success: true,
      transactionHash: claimTx
    })
  } catch (error: any) {
    console.error("Claim error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
