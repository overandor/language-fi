import { FeeAccrual } from "./engine";

export interface FeeDistributionConfig {
  protocolFeeRate: number; // e.g., 0.002 for 0.2%
  lpFeeRate: number; // e.g., 0.998 for 99.8%
  treasuryAddress: string;
}

export class FeeDistributor {
  private config: FeeDistributionConfig;
  
  constructor(config: FeeDistributionConfig) {
    this.config = config;
  }
  
  calculateFeeSplit(tradeVolume: bigint): {
    protocolFee: bigint;
    lpFee: bigint;
  } {
    const protocolFee = (tradeVolume * BigInt(Math.floor(this.config.protocolFeeRate * 1e18))) / 1_000_000_000_000_000_000n;
    const lpFee = (tradeVolume * BigInt(Math.floor(this.config.lpFeeRate * 1e18))) / 1_000_000_000_000_000_000n;
    
    return { protocolFee, lpFee };
  }
  
  distributeToLPs(
    lpFee: bigint,
    accruals: FeeAccrual[]
  ): Map<string, bigint> {
    const distribution = new Map<string, bigint>();
    const totalFees = accruals.reduce((sum, a) => sum + a.token0Fees + a.token1Fees, 0n);
    
    if (totalFees === 0n) return distribution;
    
    for (const accrual of accruals) {
      const positionFees = accrual.token0Fees + accrual.token1Fees;
      const share = Number(positionFees) / Number(totalFees);
      const distributionAmount = (lpFee * BigInt(Math.floor(share * 1e18))) / 1_000_000_000_000_000_000n;
      distribution.set(accrual.positionId, distributionAmount);
    }
    
    return distribution;
  }
  
  async sendToTreasury(protocolFee: bigint): Promise<void> {
    // TODO: Implement treasury transfer logic
    console.log(`Sending ${protocolFee} to treasury at ${this.config.treasuryAddress}`);
  }
}
