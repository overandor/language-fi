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
    const normalized = validated.sentence.toUpperCase().trim().replace(/\s+/g, " ")
    for (const char of normalized) {
      primitives[char] = (primitives[char] || 0) + 1
    }

    const totalCharacters = Object.values(primitives).reduce((sum, count) => sum + count, 0)
    const uniqueCharacters = Object.keys(primitives).length
    const spaces = primitives[" "] || 0
    const letters = Object.entries(primitives).filter(([char]) => /^[A-Z]$/.test(char)).length
    const repetitionPenalty = Object.values(primitives).some((count) => count >= 4) ? 0.18 : 0
    const density = totalCharacters > 0 ? uniqueCharacters / totalCharacters : 0
    const compositionScore = Math.max(0, Math.min(100, Math.round((density * 75 + letters * 1.5 + spaces * 2 - repetitionPenalty * 100))))
    const estimatedValue = Object.values(primitives).reduce((sum, count) => sum + count * 0.0123, 0)
    const topCharacters = Object.entries(primitives)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([char, count]) => `${char === " " ? "SPACE" : char}:${count}`)

    const narrative = [
      `${uniqueCharacters} unique glyphs observed across ${totalCharacters} priced characters.`,
      spaces > 0 ? `Whitespace is present with ${spaces} units of routing friction.` : "No whitespace drag detected.",
      `Top signal buckets: ${topCharacters.join(", ") || "none"}.`,
      `Composition score ${compositionScore}/100 implies ${compositionScore > 70 ? "strong" : compositionScore > 45 ? "balanced" : "fragile"} semantic liquidity.`,
    ].join(" ")

    return NextResponse.json({
      primitives,
      estimatedValue: estimatedValue.toFixed(6),
      characterCount: totalCharacters,
      uniqueCharacters,
      compositionScore,
      density: Number(density.toFixed(4)),
      narrative,
      kpis: {
        whitespaceShare: totalCharacters > 0 ? Number((spaces / totalCharacters).toFixed(4)) : 0,
        repetitionPenalty: Number(repetitionPenalty.toFixed(4)),
        semanticLoad: Number((density * compositionScore).toFixed(4)),
      }
    })
  } catch (error) {
    console.error("LLM analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze sentence" }, { status: 500 })
  }
}
