import { fetchGateTokens } from "@languagefi/providers"
import { fetchDexPairs } from "@languagefi/providers"
import { fetchSolanaSlots } from "@languagefi/providers"
import { persistSignal } from "@languagefi/oracle"
import { prisma } from "@languagefi/db"

export async function runDataPipeline() {
  console.log("Starting data pipeline...")
  
  try {
    // Fetch from all providers
    const [gate, dex, sol] = await Promise.all([
      fetchGateTokens(),
      fetchDexPairs(),
      fetchSolanaSlots()
    ])
    
    const allObservations = [...gate, ...dex, ...sol]
    console.log(`Fetched ${allObservations.length} observations`)
    
    // Store raw observations
    for (const obs of allObservations) {
      await prisma.rawObservation.create({
        data: {
          ...obs,
          hash: Buffer.from(JSON.stringify(obs)).toString("base64")
        }
      })
    }
    
    // Run oracle to calculate prices
    await runOracle()
    
    // Persist signals for all primitives
    const prices = await prisma.primitivePrice.findMany({
      include: { primitive: true }
    })
    
    for (const price of prices) {
      const history = await prisma.primitivePrice.findMany({
        where: { primitiveId: price.primitiveId },
        orderBy: { calculatedAt: "desc" },
        take: 3
      })
      
      if (history.length >= 3) {
        const values = history.map(p => p.priceLgu)
        await persistSignal(price.primitive.symbol, values)
      }
    }
    
    console.log("Data pipeline completed successfully")
  } catch (error) {
    console.error("Data pipeline error:", error)
    throw error
  }
}

async function runOracle() {
  // TODO: Implement oracle pricing logic
  console.log("Running oracle...")
  // This would integrate with the oracle package to calculate primitive prices
}
