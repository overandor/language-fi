import { LPPosition, FeeAccrual } from "./engine";

export class PositionTracker {
  private positions: Map<string, LPPosition> = new Map();
  private accruals: Map<string, FeeAccrual> = new Map();
  
  addPosition(position: LPPosition): void {
    this.positions.set(position.id, position);
    this.accruals.set(position.id, {
      positionId: position.id,
      token0Fees: 0n,
      token1Fees: 0n,
      lastUpdate: Date.now()
    });
  }
  
  removePosition(positionId: string): void {
    this.positions.delete(positionId);
    this.accruals.delete(positionId);
  }
  
  getPosition(positionId: string): LPPosition | undefined {
    return this.positions.get(positionId);
  }
  
  getAccrual(positionId: string): FeeAccrual | undefined {
    return this.accruals.get(positionId);
  }
  
  updateAccrual(
    positionId: string,
    token0Fees: bigint,
    token1Fees: bigint
  ): void {
    const accrual = this.accruals.get(positionId);
    if (!accrual) return;
    
    accrual.token0Fees += token0Fees;
    accrual.token1Fees += token1Fees;
    accrual.lastUpdate = Date.now();
  }
  
  getAllPositions(): LPPosition[] {
    return Array.from(this.positions.values());
  }
  
  getAllAccruals(): FeeAccrual[] {
    return Array.from(this.accruals.values());
  }
  
  getPositionsByOwner(owner: string): LPPosition[] {
    return Array.from(this.positions.values()).filter(p => p.owner === owner);
  }
  
  getPositionsByPool(pool: string): LPPosition[] {
    return Array.from(this.positions.values()).filter(p => p.pool === pool);
  }
}
