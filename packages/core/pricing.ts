export const PRICING = {
  free: {
    limit: 1000,
    costPerCall: 0
  },
  pro: {
    limit: 100000,
    costPerCall: 0.0005
  },
  enterprise: {
    limit: Infinity,
    costPerCall: 0.0002
  }
}

export function calculateCost(calls: number, plan: keyof typeof PRICING): number {
  const pricing = PRICING[plan]
  if (calls <= pricing.limit) return 0
  const overage = calls - pricing.limit
  return overage * pricing.costPerCall
}

export function getPlanLimits(plan: keyof typeof PRICING) {
  return PRICING[plan]
}
