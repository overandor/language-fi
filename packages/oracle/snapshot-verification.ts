import { prisma } from "@languagefi/db"
import { createHash } from "crypto"

export async function verifySnapshotIntegrity(snapshotId: string): Promise<boolean> {
  const snapshot = await prisma.webSnapshot.findUnique({
    where: { id: snapshotId },
    include: { primitiveCounts: true }
  })
  
  if (!snapshot) return false
  
  // Recalculate content hash
  const recalculatedHash = createHash("sha256").update(snapshot.content).digest("hex")
  
  return recalculatedHash === snapshot.contentHash
}

export async function archiveOldSnapshots(daysToKeep: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  
  const oldSnapshots = await prisma.webSnapshot.findMany({
    where: {
      extractedAt: {
        lt: cutoffDate
      }
    }
  })
  
  // Archive by marking as archived (could implement actual archiving to cold storage)
  for (const snapshot of oldSnapshots) {
    await prisma.webSnapshot.update({
      where: { id: snapshot.id },
      data: { status: "archived" }
    })
  }
  
  return { archived: oldSnapshots.length }
}

export async function getSnapshotVerificationReport() {
  const snapshots = await prisma.webSnapshot.findMany({
    where: { status: "processed" },
    take: 100
  })
  
  let verified = 0
  let failed = 0
  
  for (const snapshot of snapshots) {
    const isValid = await verifySnapshotIntegrity(snapshot.id)
    if (isValid) {
      verified++
    } else {
      failed++
    }
  }
  
  return {
    total: snapshots.length,
    verified,
    failed,
    integrityRate: snapshots.length > 0 ? verified / snapshots.length : 0
  }
}
