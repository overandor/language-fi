import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"
import { z } from "zod"

const waitlistSchema = z.object({
  email: z.string().email(),
  wallet: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = waitlistSchema.parse(body)
    
    const existing = await prisma.waitlist.findUnique({
      where: { email: validated.email }
    })
    
    if (existing) {
      return NextResponse.json(
        { status: "already_queued", position: existing.id },
        { status: 200 }
      )
    }
    
    const waitlist = await prisma.waitlist.create({
      data: {
        email: validated.email,
        wallet: validated.wallet
      }
    })
    
    return NextResponse.json({ 
      status: "queued",
      position: waitlist.id 
    })
  } catch (error: any) {
    console.error("Waitlist signup error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
