import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { z } from "zod"

const eventSchema = z.object({
  type: z.enum(["quote", "explore", "search", "stake_preview"]),
  payload: z.record(z.any())
})

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("sessionId")?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 400 })
    }

    const body = await req.json()
    const validated = eventSchema.parse(body)

    const session = await prisma.session.findUnique({
      where: { sessionId }
    })

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 404 })
    }

    const event = await prisma.event.create({
      data: {
        sessionId: session.id,
        type: validated.type,
        payload: validated.payload
      }
    })

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    })

    return NextResponse.json({ eventId: event.id })
  } catch (error) {
    console.error("Event tracking error:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
