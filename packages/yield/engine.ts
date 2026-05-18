export interface LPPosition {
  id: string;
  owner: string;
  pool: string;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  depositedAt: number;
}

export interface FeeAccrual {
  positionId: string;
  token0Fees: bigint;
  token1Fees: bigint;
  lastUpdate: number;
}

export interface YieldMetrics {
  apr: number;
  dailyYield: number;
  weeklyYield: number;
  totalFeesCollected: bigint;
  totalLiquidity: bigint;
}

export function calculateYieldMetrics(
  feesCollected: bigint,
  liquidity: bigint,
  periodDays: number
): YieldMetrics {
  if (liquidity === 0n) {
    return {
      apr: 0,
      dailyYield: 0,
      weeklyYield: 0,
      totalFeesCollected: 0n,
      totalLiquidity: 0n
    };
  }

  const totalFees = Number(feesCollected) / 1e18;
  const totalLiq = Number(liquidity) / 1e18;
  
  const dailyYield = totalFees / periodDays;
  const weeklyYield = dailyYield * 7;
  const apr = (weeklyYield * 52 / totalLiq) * 100;

  return {
    apr,
    dailyYield,
    weeklyYield,
    totalFeesCollected: feesCollected,
    totalLiquidity: liquidity
  };
}

export function calculatePositionShare(
  positionLiquidity: bigint,
  poolLiquidity: bigint
): number {
  if (poolLiquidity === 0n) return 0;
  return Number(positionLiquidity) / Number(poolLiquidity);
}

export function distributeFees(
  totalFees: bigint,
  positions: LPPosition[],
  poolLiquidity: bigint
): Map<string, bigint> {
  const distribution = new Map<string, bigint>();
  
  for (const position of positions) {
    const share = calculatePositionShare(position.liquidity, poolLiquidity);
    const feeShare = (totalFees * BigInt(Math.floor(share * 1e18))) / 1_000_000_000_000_000_000n;
    distribution.set(position.id, feeShare);
  }
  
  return distribution;
}
