export function computeConfidence({
  sourceCount,
  variance,
  agreement
}: {
  sourceCount: number
  variance: number
  agreement: number
}) {
  let score = 0
  score += Math.min(sourceCount / 10, 1) * 0.4
  score += (1 - variance) * 0.3
  score += agreement * 0.3
  return score
}
