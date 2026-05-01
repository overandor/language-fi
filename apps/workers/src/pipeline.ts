import { prisma } from "@languagefi/db"
import { fetchGateTokens } from "@languagefi/providers/gateio.provider"
import { fetchDexPairs } from "@languagefi/providers/dexscreener.provider"
import { fetchSolanaSlots } from "@languagefi/providers/solana.provider"
import { persistSignal } from "@languagefi/oracle/signals"

async function runOracle() {
  // Oracle pricing logic would go here
  // This is a placeholder for the actual oracle calculation
  console.log("Running oracle...")
}

async function pipeline() {
  const gate = await fetchGateTokens()
  const dex = await fetchDexPairs()
  const sol = await fetchSolanaSlots()
  const all = [...gate, ...dex, ...sol]
  
  for (const o of all) {
    await prisma.rawObservation.create({ data: o })
  }
  
  await runOracle()
  
  const prices = await prisma.primitivePrice.findMany()
  for (const p of prices) {
    await persistSignal(p.primitiveId, [p.priceLgu])
  }
}

pipeline()
  .then(() => console.log("Pipeline complete"))
  .catch((err) => console.error("Pipeline error:", err))
