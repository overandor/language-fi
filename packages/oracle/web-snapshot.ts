import { prisma } from "@languagefi/db"

export interface SnapshotSignal {
  primitive: string
  webCount: number
  webWeight: number
  confidence: number
}

export async function getSnapshotSignals(windowStart: Date, windowEnd: Date): Promise<SnapshotSignal[]> {
  const snapshots = await prisma.webSnapshot.findMany({
    where: {
      extractedAt: {
        gte: windowStart,
        lt: windowEnd
      },
      status: "processed"
    },
    include: {
      primitiveCounts: true
    }
  })

  const aggregated: Record<string, number> = {}
  for (const snapshot of snapshots) {
    for (const count of snapshot.primitiveCounts) {
      aggregated[count.primitive] = (aggregated[count.primitive] || 0) + count.count
    }
  }

  const total = Object.values(aggregated).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(aggregated).map(([primitive, webCount]) => ({
    primitive,
    webCount,
    webWeight: total > 0 ? webCount / total : 0,
    confidence: Math.min(1, snapshots.length / 10) // More snapshots = higher confidence
  }))
}

export async function integrateSnapshotIntoOracle(
  basePrice: number,
  snapshotSignal: SnapshotSignal | null
): Promise<number> {
  if (!snapshotSignal) return basePrice
  
  const WEB_SNAPSHOT_WEIGHT = 0.03 // 3% weight for web snapshots
  
  const impact = snapshotSignal.webWeight * snapshotSignal.confidence
  return basePrice + WEB_SNAPSHOT_WEIGHT * impact * basePrice
}
