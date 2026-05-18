import crypto from "crypto"
import { prisma } from "@languagefi/db"

export interface OracleRunInput {
  timestamp: number
  sources: string[]
  observations: any[]
  policyVersion: string
}

export interface OracleRunOutput {
  runId: string
  timestamp: number
  inputHash: string
  outputHash: string
  previousRunHash: string | null
  sources: string[]
  observationCount: number
  primitiveCount: number
  prices: Record<string, number>
  signature: string
}

export function computeInputHash(input: OracleRunInput): string {
  const data = JSON.stringify({
    timestamp: input.timestamp,
    sources: input.sources.sort(),
    observationCount: input.observations.length,
    policyVersion: input.policyVersion
  })
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function computeOutputHash(prices: Record<string, number>): string {
  const sortedPrices = Object.entries(prices)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, price]) => `${symbol}:${price.toFixed(8)}`)
    .join("|")
  return crypto.createHash("sha256").update(sortedPrices).digest("hex")
}

export async function getPreviousRunHash(): Promise<string | null> {
  const lastRun = await prisma.oracleRun.findFirst({
    orderBy: { startedAt: "desc" }
  })
  return lastRun ? lastRun.id : null
}

export async function recordOracleRun(
  input: OracleRunInput,
  prices: Record<string, number>,
  signature: string
): Promise<OracleRunOutput> {
  const inputHash = computeInputHash(input)
  const outputHash = computeOutputHash(prices)
  const previousRunHash = await getPreviousRunHash()
  
  const run = await prisma.oracleRun.create({
    data: {
      status: "completed",
      startedAt: new Date(input.timestamp),
      completedAt: new Date(),
      sourceCount: input.sources.length,
      observationCount: input.observations.length,
      primitiveCount: Object.keys(prices).length,
      notes: JSON.stringify({
        inputHash,
        outputHash,
        previousRunHash,
        sources: input.sources,
        policyVersion: input.policyVersion,
        signature
      })
    }
  })
  
  return {
    runId: run.id,
    timestamp: input.timestamp,
    inputHash,
    outputHash,
    previousRunHash,
    sources: input.sources,
    observationCount: input.observations.length,
    primitiveCount: Object.keys(prices).length,
    prices,
    signature
  }
}

export async function verifyOracleRun(runId: string): Promise<boolean> {
  const run = await prisma.oracleRun.findUnique({
    where: { id: runId }
  })
  
  if (!run || run.status !== "completed") {
    return false
  }
  
  const notes = JSON.parse(run.notes || "{}")
  
  // Verify chain of hashes
  if (notes.previousRunHash) {
    const previousRun = await prisma.oracleRun.findFirst({
      where: { id: notes.previousRunHash }
    })
    if (!previousRun) return false
  }
  
  return true
}
