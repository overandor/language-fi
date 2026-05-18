import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { z } from "zod"

const redeemSchema = z.object({
  code: z.string()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = redeemSchema.parse(body)
    
    const invite = await prisma.inviteCode.findUnique({
      where: { code: validated.code }
    })
    
    if (!invite || invite.used) {
      return NextResponse.json(
        { error: "Invalid or used invite code" },
        { status: 400 }
      )
    }
    
    await prisma.inviteCode.update({
      where: { code: validated.code },
      data: { used: true }
    })
    
    return NextResponse.json({ 
      status: "redeemed",
      success: true
    })
  } catch (error: any) {
    console.error("Invite redemption error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
