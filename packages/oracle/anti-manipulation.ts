/**
 * Anti-Manipulation Safeguards for Oracle
 * 
 * This module implements protections against data manipulation attempts:
 * - Source quality tiers and weighting
 * - Duplicate detection
 * - Anomaly detection
 * - Single-source influence caps
 * - Time-weighted smoothing
 * - Manual quarantine mode
 */

export interface SourceQuality {
  source: string
  tier: "trusted" | "standard" | "untrusted"
  weight: number
  lastVerification: number
  anomalyCount: number
}

export interface Observation {
  source: string
  objectId: string
  value: number
  timestamp: number
  hash: string
}

export interface ManipulationDetectionResult {
  isManipulated: boolean
  reasons: string[]
  adjustedWeight: number
  shouldQuarantine: boolean
}

// Source quality tiers
export const SOURCE_TIERS: Record<string, SourceQuality> = {
  "coingecko": {
    source: "coingecko",
    tier: "trusted",
    weight: 1.0,
    lastVerification: Date.now(),
    anomalyCount: 0
  },
  "gateio": {
    source: "gateio",
    tier: "standard",
    weight: 0.8,
    lastVerification: Date.now(),
    anomalyCount: 0
  },
  "dexscreener": {
    source: "dexscreener",
    tier: "standard",
    weight: 0.7,
    lastVerification: Date.now(),
    anomalyCount: 0
  },
  "solana": {
    source: "solana",
    tier: "standard",
    weight: 0.6,
    lastVerification: Date.now(),
    anomalyCount: 0
  }
}

// Configuration
const MAX_SINGLE_SOURCE_INFLUENCE = 0.4 // 40% max from any single source
const ANOMALY_THRESHOLD = 3.0 // Standard deviations
const DUPLICATE_WINDOW_MS = 60000 // 1 minute
const QUARANTINE_THRESHOLD = 5 // Anomalies before quarantine
const SMOOTHING_FACTOR = 0.7 // 70% weight to recent, 30% to historical

/**
 * Detect duplicate observations within time window
 */
export function detectDuplicates(
  observations: Observation[],
  windowMs: number = DUPLICATE_WINDOW_MS
): Map<string, Observation[]> {
  const duplicates = new Map<string, Observation[]>()
  
  for (const obs of observations) {
    const key = `${obs.source}:${obs.objectId}`
    if (!duplicates.has(key)) {
      duplicates.set(key, [])
    }
    duplicates.get(key)!.push(obs)
  }
  
  // Filter by time window
  for (const [key, obs] of duplicates.entries()) {
    const validObs = obs.filter(o => {
      const timeDiff = Math.abs(o.timestamp - obs[0].timestamp)
      return timeDiff <= windowMs
    })
    if (validObs.length > 1) {
      duplicates.set(key, validObs)
    } else {
      duplicates.delete(key)
    }
  }
  
  return duplicates
}

/**
 * Detect anomalies using statistical methods
 */
export function detectAnomalies(
  values: number[],
  threshold: number = ANOMALY_THRESHOLD
): number[] {
  if (values.length < 3) return []
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev === 0) return []
  
  return values
    .map((val, idx) => ({ val, idx, zScore: Math.abs((val - mean) / stdDev) }))
    .filter(({ zScore }) => zScore > threshold)
    .map(({ idx }) => idx)
}

/**
 * Calculate adjusted weight based on source quality and anomaly history
 */
export function calculateAdjustedWeight(
  source: string,
  anomalyCount: number
): number {
  const quality = SOURCE_TIERS[source]
  if (!quality) return 0
  
  // Reduce weight based on anomaly count
  const anomalyPenalty = Math.pow(0.9, anomalyCount)
  return quality.weight * anomalyPenalty
}

/**
 * Apply single-source influence cap
 */
export function applySourceCap(
  weights: Record<string, number>,
  maxInfluence: number = MAX_SINGLE_SOURCE_INFLUENCE
): Record<string, number> {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  
  if (totalWeight === 0) return weights
  
  // Check if any source exceeds cap
  const adjusted = { ...weights }
  for (const [source, weight] of Object.entries(adjusted)) {
    const influence = weight / totalWeight
    if (influence > maxInfluence) {
      adjusted[source] = weight * (maxInfluence / influence)
    }
  }
  
  return adjusted
}

/**
 * Apply time-weighted smoothing
 */
export function applySmoothing(
  currentValue: number,
  historicalValue: number,
  factor: number = SMOOTHING_FACTOR
): number {
  return currentValue * factor + historicalValue * (1 - factor)
}

/**
 * Check if source should be quarantined
 */
export function shouldQuarantine(source: string, anomalyCount: number): boolean {
  const quality = SOURCE_TIERS[source]
  if (!quality) return true
  
  return anomalyCount >= QUARANTINE_THRESHOLD
}

/**
 * Comprehensive manipulation detection
 */
export function detectManipulation(
  observations: Observation[],
  historicalValues: Record<string, number>
): ManipulationDetectionResult {
  const reasons: string[] = []
  let adjustedWeight = 1.0
  let shouldQuarantine = false
  
  // Check for duplicates
  const duplicates = detectDuplicates(observations)
  if (duplicates.size > 0) {
    reasons.push(`Found ${duplicates.size} duplicate observation groups`)
    adjustedWeight *= 0.5
  }
  
  // Group by source
  const bySource = new Map<string, number[]>()
  for (const obs of observations) {
    if (!bySource.has(obs.source)) {
      bySource.set(obs.source, [])
    }
    bySource.get(obs.source)!.push(obs.value)
  }
  
  // Check for anomalies per source
  for (const [source, values] of bySource.entries()) {
    const anomalies = detectAnomalies(values)
    if (anomalies.length > 0) {
      reasons.push(`Source ${source} has ${anomalies.length} anomalous values`)
      adjustedWeight *= 0.8
      
      const quality = SOURCE_TIERS[source]
      if (quality) {
        quality.anomalyCount += anomalies.length
        if (shouldQuarantine(source, quality.anomalyCount)) {
          shouldQuarantine = true
          reasons.push(`Source ${source} exceeds quarantine threshold`)
        }
      }
    }
  }
  
  // Check single-source dominance
  const sourceCounts = new Map<string, number>()
  for (const obs of observations) {
    sourceCounts.set(obs.source, (sourceCounts.get(obs.source) || 0) + 1)
  }
  
  const totalObs = observations.length
  for (const [source, count] of sourceCounts.entries()) {
    const influence = count / totalObs
    if (influence > MAX_SINGLE_SOURCE_INFLUENCE) {
      reasons.push(`Source ${source} exceeds ${MAX_SINGLE_SOURCE_INFLUENCE * 100}% influence cap`)
      adjustedWeight *= 0.7
    }
  }
  
  return {
    isManipulated: reasons.length > 0,
    reasons,
    adjustedWeight,
    shouldQuarantine
  }
}

/**
 * Manual quarantine mode for emergency situations
 */
export class QuarantineMode {
  private enabled: boolean = false
  private allowedSources: Set<string> = new Set()
  private reason: string = ""
  
  enable(reason: string, allowedSources?: string[]) {
    this.enabled = true
    this.reason = reason
    if (allowedSources) {
      this.allowedSources = new Set(allowedSources)
    }
  }
  
  disable() {
    this.enabled = false
    this.reason = ""
    this.allowedSources.clear()
  }
  
  isEnabled(): boolean {
    return this.enabled
  }
  
  isSourceAllowed(source: string): boolean {
    if (!this.enabled) return true
    return this.allowedSources.has(source)
  }
  
  getStatus(): { enabled: boolean; reason: string; allowedSources: string[] } {
    return {
      enabled: this.enabled,
      reason: this.reason,
      allowedSources: Array.from(this.allowedSources)
    }
  }
}

export const quarantineMode = new QuarantineMode()
