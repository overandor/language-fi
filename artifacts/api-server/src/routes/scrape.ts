import { Router } from "express";
import { sampleAllSources, getAggregatedLetterCounts, getSampleStats, verifySampleProvenance, getSamplerPublicKey, sampleSourceById, cache } from "../lib/dataSampler";
import { runScheduledScrape, isSchedulerRunning } from "../lib/scheduler";

const router = Router();

// Trigger a manual scrape
router.post("/scrape", async (_req, res) => {
  try {
    const result = await runScheduledScrape();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get current aggregated letter counts
router.get("/letter-counts", (_req, res) => {
  try {
    const counts = getAggregatedLetterCounts();
    const stats = getSampleStats();
    res.json({
      success: true,
      letterCounts: counts,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get scheduler status
router.get("/scheduler/status", (_req, res) => {
  res.json({
    running: isSchedulerRunning(),
  });
});

// Get sampler public key for verification
router.get("/provenance/public-key", (_req, res) => {
  try {
    const publicKey = getSamplerPublicKey();
    res.json({
      success: true,
      publicKey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Verify sample provenance
router.post("/provenance/verify", (req, res) => {
  try {
    const { sample } = req.body;
    if (!sample) {
      return res.status(400).json({
        success: false,
        error: "Sample data required",
      });
    }
    
    const isValid = verifySampleProvenance(sample);
    res.json({
      success: true,
      valid: isValid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Sample all data sources (for frontend compatibility)
router.post("/sample-data", async (_req, res) => {
  try {
    const results = await sampleAllSources();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get sample stats (for frontend compatibility)
router.get("/sample-stats", (_req, res) => {
  try {
    const counts = getAggregatedLetterCounts();
    const stats = getSampleStats();
    res.json({
      success: true,
      aggregatedLetterCounts: counts,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Sample a specific source by ID (for frontend compatibility)
router.post("/sample-source/:id", async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    const result = await sampleSourceById(sourceId);
    // Convert Date to string for JSON serialization
    const serializedResult = {
      ...result,
      sampledAt: result.sampledAt.toISOString(),
    };
    res.json(serializedResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all cached sample data from all sources (real-time streaming)
router.get("/live-samples", (_req, res) => {
  try {
    const samples = Array.from(cache.entries()).map(([source, data]) => ({
      source,
      letterCounts: data.letterCounts,
      totalChars: data.totalChars,
      sampleSize: data.sampleSize,
      sampledAt: data.sampledAt.toISOString(),
      urls: data.urls,
      contentHash: data.contentHash,
      signature: data.signature,
      attestationHash: data.attestationHash,
      previousHash: data.previousHash,
      merkleRoot: data.merkleRoot,
      samplerPublicKey: data.samplerPublicKey,
    }));
    
    res.json({
      success: true,
      samples,
      totalSources: samples.length,
      lastUpdated: samples.length > 0 ? samples.map(s => s.sampledAt).sort().reverse()[0] : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get raw sample data with differences between sources
router.get("/raw-samples", (_req, res) => {
  try {
    const samples = Array.from(cache.entries()).map(([source, data]) => ({
      source,
      rawData: data.rawData,
      urls: data.urls,
      letterCounts: data.letterCounts,
      totalChars: data.totalChars,
      sampleSize: data.sampleSize,
      sampledAt: data.sampledAt.toISOString(),
      contentHash: data.contentHash,
    }));
    
    // Calculate differences between sources
    const differences = samples.map(sample => {
      const topLetters = Object.entries(sample.letterCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([letter, count]) => ({ letter, count, percentage: ((count / sample.totalChars) * 100).toFixed(2) }));
      
      return {
        source: sample.source,
        topLetters,
        uniqueChars: sample.totalChars,
        sampleSize: sample.sampleSize,
        avgCharsPerSample: (sample.totalChars / sample.sampleSize).toFixed(2),
      };
    });
    
    res.json({
      success: true,
      samples: samples.map(s => ({
        source: s.source,
        rawData: s.rawData,
        urls: s.urls,
        letterCounts: s.letterCounts,
        totalChars: s.totalChars,
        sampleSize: s.sampleSize,
        sampledAt: s.sampledAt,
        contentHash: s.contentHash,
      })),
      differences,
      totalSources: samples.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
