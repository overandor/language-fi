export async function fetchDexPairs(query = "sol") {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${query}`
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.pairs.map((p: any) => ({
      source: "dexscreener",
      protocol: p.chainId,
      objectType: "pair",
      objectId: p.pairAddress,
      textValue: `${p.baseToken.symbol} ${p.quoteToken.symbol}`,
      observedAt: new Date(),
      windowStart: new Date(),
      windowEnd: new Date()
    }))
  } catch {
    return []
  }
}
