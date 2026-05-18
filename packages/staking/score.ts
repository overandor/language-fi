import { differenceInDays } from "date-fns"

export function calculateStillnessMultiplier(lastMovedAt: Date) {
  const days = differenceInDays(new Date(), lastMovedAt)
  if (days <= 7) return 1.0
  if (days <= 30) return 1.1
  if (days <= 90) return 1.25
  if (days <= 180) return 1.5
  if (days <= 365) return 2.0
  return 3.0
}

export function calculateDiversityMultiplier(counts: Record<string, number>) {
  const unique = Object.keys(counts).length
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return 1
  const ratio = unique / total
  return 1 + ratio // 1.0 → 2.0 max
}

export function calculateAntiSpamScore(text: string) {
  const length = text.length
  if (length < 3) return 0.2
  if (length < 6) return 0.5
  const repetition = /(.)\1{3,}/.test(text)
  if (repetition) return 0.3
  return 1.0
}

export function calculateStakingScore(params: {
  baseValue: number
  counts: Record<string, number>
  text: string
  lastMovedAt: Date
}) {
  const stillness = calculateStillnessMultiplier(params.lastMovedAt)
  const diversity = calculateDiversityMultiplier(params.counts)
  const antiSpam = calculateAntiSpamScore(params.text)
  const score =
    params.baseValue *
    stillness *
    diversity *
    antiSpam
  return {
    score,
    stillness,
    diversity,
    antiSpam
  }
}
