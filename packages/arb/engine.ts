export type ArbOpportunity = {
  symbol: string;
  ammPrice: number;
  oraclePrice: number;
  spread: number;
};

export function detectArb(pools: any[], oracle: any[]): ArbOpportunity[] {
  return pools.map(p => {
    const o = oracle.find(x => x.symbol === p.symbol);
    if (!o) return null;
    const spread = (p.price - o.priceLgu) / o.priceLgu;
    return {
      symbol: p.symbol,
      ammPrice: p.price,
      oraclePrice: o.priceLgu,
      spread
    };
  }).filter(Boolean) as ArbOpportunity[];
}

export function filterArb(opportunities: ArbOpportunity[], config: {
  minSpread: number;
  maxSpread: number;
  minLiquidity: number;
}): ArbOpportunity[] {
  return opportunities.filter(op => {
    const absSpread = Math.abs(op.spread);
    return absSpread >= config.minSpread && 
           absSpread <= config.maxSpread;
  });
}
