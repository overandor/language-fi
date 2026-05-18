import { prisma } from "@languagefi/db"

export function computeWeb2Signal(normalized: number, change: number) {
  const usage = normalized
  const confidence =
    Math.min(1,
      0.5 * Math.tanh(usage / 100) +
      0.5 * Math.abs(change)
    )
  return {
    usage,
    change,
    confidence
  }
}

export async function persistSignals() {
  const latest = await prisma.web2PrimitiveDemand.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  })
  
  for (const d of latest) {
    const signal = computeWeb2Signal(d.normalizedScore, d.changePercent || 0)
    await prisma.web2Signal.create({
      data: {
        primitive: d.primitive,
        usage: signal.usage,
        change: signal.change,
        confidence: signal.confidence,
        windowStart: d.windowStart,
        windowEnd: d.windowEnd
      }
    })
  }
}
