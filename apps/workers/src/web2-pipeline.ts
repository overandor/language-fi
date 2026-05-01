import { prisma } from "@languagefi/db"

export async function fetchEvents(windowStart: Date, windowEnd: Date) {
  return prisma.event.findMany({
    where: {
      createdAt: {
        gte: windowStart,
        lt: windowEnd
      },
      type: {
        in: ["quote", "search", "explore"]
      }
    }
  })
}

function extractDemand(text: string) {
  const counts: Record<string, number> = {}
  for (const c of text.toUpperCase()) {
    if (!counts[c]) counts[c] = 0
    counts[c]++
  }
  return counts
}

export async function aggregateDemand(events: any[]) {
  const primitiveMap: Record<string, {
    raw: number,
    sessions: Set<string>
  }> = {}
  for (const e of events) {
    const text = e.payload?.text || ""
    const demand = extractDemand(text)
    for (const p in demand) {
      if (!primitiveMap[p]) {
        primitiveMap[p] = {
          raw: 0,
          sessions: new Set()
        }
      }
      primitiveMap[p].raw += demand[p]
      primitiveMap[p].sessions.add(e.sessionId)
    }
  }
  return primitiveMap
}

function passesAntiManipulation(raw: number, uniqueSessions: number): boolean {
  if (uniqueSessions < 5) return false
  if (raw / uniqueSessions > 100) return false
  return true
}

export async function runWeb2Pipeline() {
  const now = new Date()
  const windowEnd = now
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const prevStart = new Date(windowStart.getTime() - 24 * 60 * 60 * 1000)
  const prevEnd = windowStart
  
  const events = await fetchEvents(windowStart, windowEnd)
  const prevEvents = await fetchEvents(prevStart, prevEnd)
  
  const currentAgg = await aggregateDemand(events)
  const prevAgg = await aggregateDemand(prevEvents)
  
  for (const primitive in currentAgg) {
    const raw = currentAgg[primitive].raw
    const sessions = currentAgg[primitive].sessions.size
    
    if (!passesAntiManipulation(raw, sessions)) {
      console.log(`Skipping ${primitive}: failed anti-manipulation checks`)
      continue
    }
    
    const prevRaw = prevAgg[primitive]?.raw || 0
    const prevSessions = prevAgg[primitive]?.sessions?.size || 0
    
    const normalized = normalizeDemand(raw, sessions)
    const prevNorm = normalizeDemand(prevRaw, prevSessions)
    const change = computeChange(normalized, prevNorm)
    
    await prisma.web2PrimitiveDemand.create({
      data: {
        primitive,
        windowStart,
        windowEnd,
        rawCount: raw,
        uniqueSessions: sessions,
        normalizedScore: normalized,
        changePercent: change
      }
    })
  }
}

function normalizeDemand(raw: number, uniqueSessions: number) {
  const logScaled = Math.log(1 + raw)
  const sessionFactor = Math.log(1 + uniqueSessions)
  const entropyFactor = Math.min(1, uniqueSessions / 100)
  return logScaled * sessionFactor * entropyFactor
}

function computeChange(current: number, previous: number) {
  if (previous === 0) return 0
  return (current - previous) / previous
}

runWeb2Pipeline()
  .then(() => console.log("Web2 pipeline complete"))
  .catch((err) => console.error("Web2 pipeline error:", err))
