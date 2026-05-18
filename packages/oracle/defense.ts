export function detectAnomaly({
  spike,
  sourceDiversity,
  entropy
}: {
  spike: number
  sourceDiversity: number
  entropy: number
}) {
  if (spike > 5 && sourceDiversity < 2) {
    return "manipulation_risk"
  }
  if (entropy < 0.2) {
    return "low_distribution"
  }
  return "normal"
}
