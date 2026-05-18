export function normalizeDemand(raw: number, uniqueSessions: number) {
  const logScaled = Math.log(1 + raw)
  const sessionFactor = Math.log(1 + uniqueSessions)
  const entropyFactor = Math.min(1, uniqueSessions / 100)
  return logScaled * sessionFactor * entropyFactor
}

export function computeChange(current: number, previous: number) {
  if (previous === 0) return 0
  return (current - previous) / previous
}
