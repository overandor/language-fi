import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { z } from "zod"

const linkWalletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
})

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("sessionId")?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 400 })
    }

    const body = await req.json()
    const validated = linkWalletSchema.parse(body)

    const session = await prisma.session.findUnique({
      where: { sessionId }
    })

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 404 })
    }

    if (session.walletAddress) {
      return NextResponse.json({ error: "Wallet already linked" }, { status: 400 })
    }

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { walletAddress: validated.wallet }
    })

    return NextResponse.json({ success: true, walletAddress: updated.walletAddress })
  } catch (error) {
    console.error("Wallet linking error:", error)
    return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 })
  }
}
