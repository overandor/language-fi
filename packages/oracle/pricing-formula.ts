/**
 * Formal Pricing Formula for Linguistic Primitives
 * 
 * This document defines the exact formula used to calculate primitive prices.
 * All calculations are deterministic and reproducible.
 */

export interface PricingInput {
  frequency: number        // Total character occurrences
  velocity: number         // Rate of change (current - previous)
  acceleration: number     // Rate of velocity change
  sourceDiversity: number  // Number of unique sources
  entropy: number          // Shannon entropy of distribution
  correlation: number      // Cross-source correlation score
  rarity: number          // Inverse frequency (1/frequency)
  timeWindow: number      // Time window in seconds
}

export interface PricingWeights {
  frequencyWeight: number
  velocityWeight: number
  accelerationWeight: number
  diversityWeight: number
  entropyWeight: number
  correlationWeight: number
  rarityWeight: number
  decayFactor: number
}

export const DEFAULT_WEIGHTS: PricingWeights = {
  frequencyWeight: 0.3,
  velocityWeight: 0.15,
  accelerationWeight: 0.1,
  diversityWeight: 0.15,
  entropyWeight: 0.1,
  correlationWeight: 0.1,
  rarityWeight: 0.1,
  decayFactor: 0.95 // 5% decay per time window
}

/**
 * Calculate primitive price using the formal formula
 * 
 * Formula:
 * price = (frequency * w_f + velocity * w_v + acceleration * w_a + 
 *          diversity * w_d + entropy * w_e + correlation * w_c + 
 *          rarity * w_r) * decay_factor
 * 
 * Where:
 * - frequency: total occurrences in time window
 * - velocity: rate of change (normalized to [-1, 1])
 * - acceleration: rate of velocity change (normalized to [-1, 1])
 * - diversity: number of unique sources (normalized)
 * - entropy: Shannon entropy (normalized to [0, 1])
 * - correlation: cross-source agreement (normalized to [0, 1])
 * - rarity: 1/frequency (normalized)
 * - decay_factor: time-based decay (default 0.95)
 */
export function calculatePrice(
  input: PricingInput,
  weights: PricingWeights = DEFAULT_WEIGHTS
): number {
  // Normalize inputs to [0, 1] range where applicable
  const normalizedFrequency = Math.min(1, input.frequency / 1000000)
  const normalizedVelocity = Math.max(-1, Math.min(1, input.velocity / 1000))
  const normalizedAcceleration = Math.max(-1, Math.min(1, input.acceleration / 100))
  const normalizedDiversity = Math.min(1, input.sourceDiversity / 10)
  const normalizedEntropy = Math.min(1, input.entropy / 10)
  const normalizedCorrelation = Math.max(0, Math.min(1, input.correlation))
  const normalizedRarity = Math.min(1, input.rarity / 1000)
  
  // Apply formula
  const basePrice = 
    normalizedFrequency * weights.frequencyWeight +
    Math.abs(normalizedVelocity) * weights.velocityWeight +
    Math.abs(normalizedAcceleration) * weights.accelerationWeight +
    normalizedDiversity * weights.diversityWeight +
    normalizedEntropy * weights.entropyWeight +
    normalizedCorrelation * weights.correlationWeight +
    normalizedRarity * weights.rarityWeight
  
  // Apply time decay
  const decayedPrice = basePrice * Math.pow(weights.decayFactor, input.timeWindow / 3600)
  
  // Apply caps and floors
  const MIN_PRICE = 0.0001
  const MAX_PRICE = 1000
  
  return Math.max(MIN_PRICE, Math.min(MAX_PRICE, decayedPrice))
}

/**
 * Calculate Shannon entropy for a distribution
 */
export function calculateEntropy(distribution: Record<string, number>): number {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)
  if (total === 0) return 0
  
  let entropy = 0
  for (const count of Object.values(distribution)) {
    if (count > 0) {
      const probability = count / total
      entropy -= probability * Math.log2(probability)
    }
  }
  
  return entropy
}

/**
 * Calculate cross-source correlation
 */
export function calculateCorrelation(values: number[][]): number {
  if (values.length < 2) return 0
  
  const mean = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length
  
  const correlations: number[] = []
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const meanI = mean(values[i])
      const meanJ = mean(values[j])
      
      let numerator = 0
      let denominatorI = 0
      let denominatorJ = 0
      
      for (let k = 0; k < values[i].length; k++) {
        const diffI = values[i][k] - meanI
        const diffJ = values[j][k] - meanJ
        numerator += diffI * diffJ
        denominatorI += diffI * diffI
        denominatorJ += diffJ * diffJ
      }
      
      const denominator = Math.sqrt(denominatorI * denominatorJ)
      if (denominator > 0) {
        correlations.push(Math.abs(numerator / denominator))
      }
    }
  }
  
  return correlations.length > 0 
    ? correlations.reduce((sum, val) => sum + val, 0) / correlations.length 
    : 0
}
