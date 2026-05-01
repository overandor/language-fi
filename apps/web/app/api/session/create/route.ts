import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const sessionId = randomUUID()
    const userAgent = req.headers.get("user-agent") || undefined

    const session = await prisma.session.create({
      data: {
        sessionId,
        userAgent
      }
    })

    const response = NextResponse.json({ sessionId: session.sessionId })
    
    response.cookies.set("sessionId", session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
