import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const analyzeSchema = z.object({
  sentence: z.string().min(1)
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = analyzeSchema.parse(body)

    const primitives: Record<string, number> = {}
    for (const char of validated.sentence.toUpperCase()) {
      primitives[char] = (primitives[char] || 0) + 1
    }

    const estimatedValue = Object.values(primitives).reduce((sum, count) => sum + count * 0.0123, 0)

    return NextResponse.json({
      primitives,
      estimatedValue: estimatedValue.toFixed(6),
      characterCount: validated.sentence.length
    })
  } catch (error) {
    console.error("LLM analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze sentence" }, { status: 500 })
  }
}
