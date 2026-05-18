import { SOURCE_WEIGHTS } from "./weights"

export function computeWeightedPrice(
  counts: Record<string, number>,
  weights: Record<string, number> = SOURCE_WEIGHTS
) {
  let weighted = 0
  let totalWeight = 0
  for (const [source, value] of Object.entries(counts)) {
    const w = weights[source] || 0
    weighted += value * w
    totalWeight += w
  }
  if (totalWeight === 0) return null
  return weighted / totalWeight
}
