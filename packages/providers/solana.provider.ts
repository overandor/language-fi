export async function fetchSolanaSlots() {
  try {
    const res = await fetch(process.env.SOLANA_RPC_URL!, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSlot"
      })
    })
    const json = await res.json()
    return [{
      source: "solana",
      protocol: "rpc",
      objectType: "slot",
      objectId: String(json.result),
      textValue: String(json.result),
      observedAt: new Date(),
      windowStart: new Date(),
      windowEnd: new Date()
    }]
  } catch {
    return []
  }
}
