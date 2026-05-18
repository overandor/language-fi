import cron from "node-cron"
import { fetchGateTokens } from "@languagefi/providers/gateio.provider"
import { fetchDexPairs } from "@languagefi/providers/dexscreener.provider"
import { fetchSolanaRecent } from "@languagefi/providers/solana.provider"
import { prisma } from "@languagefi/db"

async function ingest() {
  console.log("Ingestion started")
  
  const observations = []
  
  // Fetch from all providers
  const gateTokens = await fetchGateTokens()
  observations.push(...gateTokens)
  
  const dexPairs = await fetchDexPairs()
  observations.push(...dexPairs)
  
  const solanaData = await fetchSolanaRecent()
  observations.push(...solanaData)
  
  // Store observations
  for (const obs of observations) {
    await prisma.rawObservation.create({
      data: {
        ...obs,
        hash: `${obs.objectId}-${obs.observedAt.toISOString()}`
      }
    })
  }
  
  console.log("Ingestion complete:", observations.length)
}

// every 5 minutes
cron.schedule("*/5 * * * *", ingest)

console.log("Worker started")
