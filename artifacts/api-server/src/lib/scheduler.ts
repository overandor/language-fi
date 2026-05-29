import { sampleAllSources, getAggregatedLetterCounts, getSampleStats, verifySampleProvenance, sampleSourceById } from "./dataSampler";
import { db, letterCountHistoryTable } from "@workspace/db";
import { logger } from "./logger";

let schedulerInterval: NodeJS.Timeout | null = null;
let dynamicIntervals: NodeJS.Timeout[] = [];

// Data source sampling configuration with different frequencies
const SOURCE_SAMPLING_CONFIG = [
  { id: 1, name: "GitHub Code", frequency: 15000, priority: "high" }, // Every 15s
  { id: 2, name: "Wikipedia Pages", frequency: 30000, priority: "medium" }, // Every 30s
  { id: 3, name: "Hacker News", frequency: 20000, priority: "high" }, // Every 20s
  { id: 4, name: "Reddit", frequency: 25000, priority: "medium" }, // Every 25s
  { id: 5, name: "Binance Token Names", frequency: 10000, priority: "high" }, // Every 10s
  { id: 6, name: "Coinbase Listings", frequency: 35000, priority: "low" }, // Every 35s
  { id: 7, name: "NPM Packages", frequency: 40000, priority: "low" }, // Every 40s
  { id: 8, name: "Kraken Listings", frequency: 12000, priority: "high" }, // Every 12s
  { id: 9, name: "OKX Listings", frequency: 18000, priority: "high" }, // Every 18s
  { id: 10, name: "Stack Overflow", frequency: 22000, priority: "high" }, // Every 22s
  { id: 11, name: "GitHub Repos", frequency: 16000, priority: "high" }, // Every 16s
  { id: 12, name: "Docker Hub", frequency: 28000, priority: "medium" }, // Every 28s
  { id: 13, name: "PyPI Packages", frequency: 32000, priority: "medium" }, // Every 32s
  { id: 14, name: "Medium Articles", frequency: 45000, priority: "low" }, // Every 45s
  { id: 15, name: "Dev.to Posts", frequency: 38000, priority: "low" }, // Every 38s
];

// Random selection of sources for each sampling round
function getRandomSourceSubset(count: number = 3): number[] {
  const shuffled = [...SOURCE_SAMPLING_CONFIG].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(s => s.id);
}

// Add randomness to sampling frequency
function getRandomizedFrequency(baseFrequency: number): number {
  const variance = baseFrequency * 0.3; // 30% variance
  return baseFrequency + (Math.random() * variance * 2 - variance);
}

export async function runScheduledScrape() {
  try {
    logger.info("Running scheduled data scrape...");
    
    // Randomly select subset of sources for this round
    const selectedSourceIds = getRandomSourceSubset(Math.floor(Math.random() * 3) + 2); // 2-4 sources
    logger.info(`Randomly selected sources: ${selectedSourceIds.join(", ")}`);
    
    // Sample selected sources
    const results = [];
    for (const sourceId of selectedSourceIds) {
      try {
        const result = await sampleSourceById(sourceId);
        results.push(result);
        logger.info(`Sampled ${result.source}`);
      } catch (error) {
        logger.error(`Failed to sample source ${sourceId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Get aggregated letter counts
    const aggregatedCounts = getAggregatedLetterCounts();
    const stats = getSampleStats();
    
    logger.info(`Aggregated letter counts: ${JSON.stringify(aggregatedCounts)}`);
    logger.info(`Sample stats: ${JSON.stringify(stats)}`);
    
    // Store in database if available
    if (db) {
      for (const result of results) {
        try {
          // Verify provenance before storing
          const isValid = verifySampleProvenance(result);
          if (!isValid) {
            logger.error(`Provenance verification failed for ${result.source}`);
            continue;
          }
          
          await db.insert(letterCountHistoryTable).values({
            source: result.source,
            letter_counts: result.letterCounts,
            total_chars: result.totalChars,
            sample_size: result.sampleSize,
            sampled_at: result.sampledAt,
            content_hash: result.contentHash,
            signature: result.signature,
            sampler_public_key: result.samplerPublicKey,
            attestation_hash: result.attestationHash,
            merkle_root: result.merkleRoot,
            previous_hash: result.previousHash,
          });
          logger.info(`Stored letter count history for ${result.source} with provenance`);
        } catch (error) {
          logger.error(`Failed to store letter count history for ${result.source}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    return {
      success: true,
      sourcesSampled: results.length,
      aggregatedCounts,
      stats,
      merkleRoot: results[0]?.merkleRoot,
    };
  } catch (error) {
    logger.error(`Scheduled scrape failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Dynamic sampling for individual sources
function startDynamicSampling() {
  logger.info("Starting dynamic source sampling with randomized frequencies");
  
  SOURCE_SAMPLING_CONFIG.forEach(config => {
    const randomizedFreq = getRandomizedFrequency(config.frequency);
    logger.info(`Setting up ${config.name} sampling at ${Math.round(randomizedFreq / 1000)}s interval`);
    
    const interval = setInterval(async () => {
      try {
        // 70% chance to actually sample this round (adds more randomness)
        if (Math.random() > 0.3) {
          const result = await sampleSourceById(config.id);
          logger.info(`Dynamic sample: ${result.source} (${config.priority} priority)`);
          
          // Store if database available
          if (db) {
            const isValid = verifySampleProvenance(result);
            if (isValid) {
              await db.insert(letterCountHistoryTable).values({
                source: result.source,
                letter_counts: result.letterCounts,
                total_chars: result.totalChars,
                sample_size: result.sampleSize,
                sampled_at: result.sampledAt,
                content_hash: result.contentHash,
                signature: result.signature,
                sampler_public_key: result.samplerPublicKey,
                attestation_hash: result.attestationHash,
                merkle_root: result.merkleRoot,
                previous_hash: result.previousHash,
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Dynamic sampling failed for ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, randomizedFreq);
    
    dynamicIntervals.push(interval);
  });
}

export function startScheduler(intervalMs: number = 30000) {
  if (schedulerInterval) {
    logger.warn("Scheduler already running, stopping previous instance");
    stopScheduler();
  }
  
  logger.info(`Starting scheduler with ${intervalMs}ms interval`);
  
  // Start dynamic sampling for individual sources
  startDynamicSampling();
  
  // Run main batch sampling immediately
  runScheduledScrape();
  
  // Then run batch sampling at the specified interval
  schedulerInterval = setInterval(() => {
    runScheduledScrape();
  }, intervalMs);
  
  return schedulerInterval;
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Main scheduler stopped");
  }
  
  // Stop all dynamic intervals
  dynamicIntervals.forEach(interval => clearInterval(interval));
  dynamicIntervals = [];
  logger.info("Dynamic sampling stopped");
}

export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
