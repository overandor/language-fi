import { ArbOpportunity } from "./engine";

const MIN_DEPTH = 10000; // $10k minimum liquidity
const MAX_TRADE_SIZE = 5000; // $5k max per trade
const SPREAD_THRESHOLD = 0.03; // 3% threshold

export async function executeArb(op: ArbOpportunity, oracleAge: number, poolDepth: number) {
  // Safeguards
  if (oracleAge > 60_000) {
    console.log("Oracle too old:", oracleAge);
    return { success: false, reason: "stale_oracle" };
  }
  
  if (poolDepth < MIN_DEPTH) {
    console.log("Insufficient liquidity:", poolDepth);
    return { success: false, reason: "insufficient_liquidity" };
  }
  
  if (Math.abs(op.spread) < SPREAD_THRESHOLD) {
    console.log("Spread below threshold:", op.spread);
    return { success: false, reason: "insufficient_spread" };
  }

  // Execute based on direction
  if (op.spread > 0) {
    // AMM overpriced → sell primitive → buy LGU
    return await executeSellArb(op, poolDepth);
  } else {
    // AMM underpriced → buy primitive → sell later
    return await executeBuyArb(op, poolDepth);
  }
}

async function executeSellArb(op: ArbOpportunity, poolDepth: number) {
  const tradeSize = Math.min(MAX_TRADE_SIZE, poolDepth * 0.1); // 10% of pool depth
  
  // TODO: Implement actual AMM swap logic
  console.log(`SELL ${op.symbol}: ${tradeSize} units at ${op.ammPrice}`);
  
  return {
    success: true,
    direction: "sell",
    size: tradeSize,
    expectedProfit: Math.abs(op.spread) * tradeSize
  };
}

async function executeBuyArb(op: ArbOpportunity, poolDepth: number) {
  const tradeSize = Math.min(MAX_TRADE_SIZE, poolDepth * 0.1);
  
  // TODO: Implement actual AMM swap logic
  console.log(`BUY ${op.symbol}: ${tradeSize} units at ${op.ammPrice}`);
  
  return {
    success: true,
    direction: "buy",
    size: tradeSize,
    expectedProfit: Math.abs(op.spread) * tradeSize
  };
}
