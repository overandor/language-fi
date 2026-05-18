import { FeeDistributor } from "@languagefi/yield"
import { prisma } from "@languagefi/db"

const distributor = new FeeDistributor({
  protocolFeeRate: 0.002,
  lpFeeRate: 0.998,
  treasuryAddress: process.env.TREASURY_ADDRESS!
})

export async function collectAndDistributeFees() {
  try {
    // Fetch all active LP positions
    const positions = await prisma.lPPosition.findMany({
      where: { active: true },
      include: { pool: true }
    })
    
    // Group by pool
    const poolGroups = new Map<string, any[]>()
    for (const pos of positions) {
      if (!poolGroups.has(pos.poolId)) {
        poolGroups.set(pos.poolId, [])
      }
      poolGroups.get(pos.poolId)!.push(pos)
    }
    
    // Process each pool
    for (const [poolId, poolPositions] of poolGroups.entries()) {
      const pool = await prisma.pool.findUnique({ where: { id: poolId } })
      if (!pool) continue
      
      // Calculate total fees collected (from AMM trades)
      const feesCollected = await calculatePoolFees(poolId)
      if (feesCollected === 0n) continue
      
      // Split fees between protocol and LPs
      const { protocolFee, lpFee } = distributor.calculateFeeSplit(feesCollected)
      
      // Send protocol fee to treasury
      await distributor.sendToTreasury(protocolFee)
      
      // Calculate LP shares and distribute
      const totalLiquidity = poolPositions.reduce((sum, p) => sum + p.liquidity, 0n)
      const distribution = distributor.distributeToLPs(lpFee, poolPositions.map(p => ({
        positionId: p.id,
        token0Fees: p.pendingFees || 0n,
        token1Fees: 0n,
        lastUpdate: Date.now()
      })))
      
      // Update pending fees for each position
      for (const [positionId, feeShare] of distribution.entries()) {
        await prisma.lPPosition.update({
          where: { id: positionId },
          data: { pendingFees: { increment: feeShare } }
        })
      }
      
      // Update pool metrics
      await prisma.pool.update({
        where: { id: poolId },
        data: {
          totalFeesCollected: { increment: feesCollected },
          lastFeeCollection: new Date()
        }
      })
    }
    
    console.log("Fee collection and distribution completed")
  } catch (error) {
    console.error("Fee collection error:", error)
  }
}

async function calculatePoolFees(poolId: string): Promise<bigint> {
  // TODO: Calculate fees from AMM trade volume
  // This would query the AMM contract for recent trades
  return 0n
}

// Run every hour
setInterval(collectAndDistributeFees, 60 * 60 * 1000)
