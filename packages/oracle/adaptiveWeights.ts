export function adjustWeights(weights: Record<string, number>, performance: Record<string, number>) {
  const updated = { ...weights }
  for (const k in weights) {
    if (performance[k] !== undefined) {
      updated[k] = weights[k] * (1 + performance[k])
    }
  }
  const sum = Object.values(updated).reduce((a, b) => a + b, 0)
  if (sum === 0) return weights
  for (const k in updated) {
    updated[k] /= sum
  }
  return updated
}
