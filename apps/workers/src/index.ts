/**
 * Ingestion Worker
 * Runs data ingestion and oracle jobs on schedule
 */

import cron from "node-cron";
import { prisma } from "@languagefi/db";
import { fetchCoinGeckoObservations } from "@languagefi/providers";
import { countCharacters } from "@languagefi/core";
import { runOracle } from "@languagefi/oracle";

/**
 * Ingest observations from CoinGecko and store in database
 */
async function ingestObservations() {
  console.log("Starting ingestion...");
  const now = new Date();
  const windowStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 minute window

  try {
    // Fetch observations from CoinGecko
    const observations = await fetchCoinGeckoObservations();
    
    if (!observations.length) {
      console.log("No observations fetched");
      return;
    }

    // Get or create CoinGecko data source
    const source = await prisma.dataSource.upsert({
      where: { name: "CoinGecko" },
      update: {
        healthStatus: "healthy",
        lastSuccessAt: now,
      },
      create: {
        name: "CoinGecko",
        type: "token_list",
        baseUrl: "https://api.coingecko.com/api/v3",
        requiresApiKey: false,
        enabled: true,
        healthStatus: "healthy",
        lastSuccessAt: now,
      },
    });

    // Store observations
    let storedCount = 0;
    for (const obs of observations) {
      // Check for duplicates using hash
      const hash = `${obs.source}-${obs.objectId}-${obs.windowStart.toISOString()}`;
      
      const existing = await prisma.rawObservation.findUnique({
        where: { hash },
      });

      if (existing) continue;

      await prisma.rawObservation.create({
        data: {
          sourceId: source.id,
          protocol: obs.protocol,
          objectType: obs.objectType,
          objectId: obs.objectId,
          textValue: obs.textValue,
          observedAt: obs.observedAt,
          windowStart: obs.windowStart,
          windowEnd: obs.windowEnd,
          hash,
        },
      });

      storedCount++;
    }

    console.log(`Ingested ${storedCount} observations`);

    // Update primitive counts
    await updatePrimitiveCounts(source.id, windowStart, now);

    console.log("Ingestion completed");
  } catch (error) {
    console.error("Ingestion error:", error);
    
    // Update source health status
    await prisma.dataSource.updateMany({
      where: { name: "CoinGecko" },
      data: {
        healthStatus: "degraded",
        lastErrorAt: now,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * Update primitive counts from observations
 */
async function updatePrimitiveCounts(sourceId: string, windowStart: Date, windowEnd: Date) {
  console.log("Updating primitive counts...");

  // Get observations in the window
  const observations = await prisma.rawObservation.findMany({
    where: {
      sourceId,
      windowStart: { gte: windowStart },
      windowEnd: { lte: windowEnd },
    },
  });

  if (!observations.length) {
    console.log("No observations in window");
    return;
  }

  // Count characters
  const counts: Record<string, number> = {};
  const uniqueObjects = new Set<string>();

  for (const obs of observations) {
    const charCounts = countCharacters(obs.textValue);
    uniqueObjects.add(obs.objectId);

    for (const [char, count] of Object.entries(charCounts.counts)) {
      counts[char] = (counts[char] || 0) + count;
    }
  }

  // Get or create primitives
  for (const [symbol, occurrenceCount] of Object.entries(counts)) {
    const primitive = await prisma.primitive.upsert({
      where: { symbol },
      update: {},
      create: {
        symbol,
        displaySymbol: symbol,
        type: /^[A-Z]$/.test(symbol) ? "letter" : /^[0-9]$/.test(symbol) ? "number" : symbol === " " ? "space" : "symbol",
        enabled: true,
      },
    });

    // Create primitive count record
    await prisma.primitiveCount.create({
      data: {
        primitiveId: primitive.id,
        sourceId,
        protocol: "coingecko",
        occurrenceCount,
        uniqueObjectCount: uniqueObjects.size,
        windowStart,
        windowEnd,
      },
    });
  }

  console.log(`Updated ${Object.keys(counts).length} primitives`);
}

/**
 * Run oracle pricing calculation
 */
async function runOracleJob() {
  console.log("Running oracle job...");
  const result = await runOracle();
  console.log("Oracle job completed:", result);
}

/**
 * Main worker function
 */
async function main() {
  console.log("Language.fi Ingestion Worker starting...");

  // Run ingestion every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await ingestObservations();
  });

  // Run oracle every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    await runOracleJob();
  });

  // Run initial ingestion
  await ingestObservations();

  console.log("Worker started. Scheduled jobs running...");
}

main().catch((error) => {
  console.error("Worker error:", error);
  process.exit(1);
});
