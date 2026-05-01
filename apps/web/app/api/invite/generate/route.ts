import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function POST(req: Request) {
  try {
    const code = `LGU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    
    await prisma.inviteCode.create({
      data: {
        code,
        used: false
      }
    })
    
    return NextResponse.json({ code })
  } catch (error: any) {
    console.error("Invite generation error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
