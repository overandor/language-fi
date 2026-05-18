export function detectManipulation({
  current,
  previous,
  sourceDiversity
}: {
  current: number
  previous: number
  sourceDiversity: number
}) {
  const change = Math.abs(current - previous) / (previous || 1)
  if (change > 5 && sourceDiversity < 2) {
    return {
      flagged: true,
      reason: "Single-source spike"
    }
  }
  if (change > 10) {
    return {
      flagged: true,
      reason: "Extreme volatility"
    }
  }
  return { flagged: false }
}
