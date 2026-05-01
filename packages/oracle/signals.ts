export function computeSignal(prices: number[]) {
  if (prices.length < 3) return null
  const velocity = prices[prices.length - 1] - prices[prices.length - 2]
  const acceleration =
    velocity - (prices[prices.length - 2] - prices[prices.length - 3])
  let side = "neutral"
  if (velocity > 0 && acceleration > 0) side = "long"
  if (velocity < 0 && acceleration < 0) side = "short"
  return { velocity, acceleration, side }
}

import { prisma } from "@languagefi/db"

export async function persistSignal(symbol: string, values: number[]) {
  const s = computeSignal(values)
  if (!s) return
  await prisma.signal.create({
    data: {
      symbol,
      source: "oracle",
      value: values[values.length - 1],
      velocity: s.velocity,
      acceleration: s.acceleration,
      confidence: Math.min(1, Math.abs(s.velocity))
    }
  })
}
