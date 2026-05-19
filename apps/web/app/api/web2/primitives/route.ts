import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET(req: NextRequest) {
  try {
    const signals = await prisma.web2Signal.findMany({
      orderBy: { usage: "desc" },
      take: 100
    })

    return NextResponse.json({
      status: "success",
      data: signals.map((s: {
        primitive: string;
        usage: number;
        change: number | null;
        confidence: number | null;
        windowStart: Date;
        windowEnd: Date;
        createdAt: Date;
      }) => ({
        primitive: s.primitive,
        usage: s.usage,
        change: s.change,
        confidence: s.confidence,
        windowStart: s.windowStart,
        windowEnd: s.windowEnd,
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    console.error("Web2 signals fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch Web2 signals" }, { status: 500 })
  }
}
