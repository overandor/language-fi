/**
 * Anti-Manipulation Safeguards
 * Prevents gaming of the oracle through spam, bots, and data manipulation
 */

import { countCharacters } from "@languagefi/core";

export interface SourceQuality {
  tier: number; // 1-3, where 1 is highest quality
  weight: number; // 0.0-1.0
  reliability: number; // 0.0-1.0
  requiresVerification: boolean;
}

export interface AnomalyDetection {
  isAnomalous: boolean;
  severity: "low" | "medium" | "high";
  reason: string;
  confidence: number;
}

export interface DeduplicationResult {
  uniqueObservations: string[];
  duplicateCount: number;
  deduplicated: boolean;
}

/**
 * Source quality tiers for anti-manipulation
 */
export const SOURCE_QUALITY_TIERS: Record<string, SourceQuality> = {
  coingecko: {
    tier: 1,
    weight: 0.40,
    reliability: 0.95,
    requiresVerification: true,
  },
  coinmarketcap: {
    tier: 1,
    weight: 0.25,
    reliability: 0.92,
    requiresVerification: true,
  },
  gateio: {
    tier: 2,
    weight: 0.20,
    reliability: 0.85,
    requiresVerification: false,
  },
  binance: {
    tier: 2,
    weight: 0.15,
    reliability: 0.82,
    requiresVerification: false,
  },
  blockchain_hashes: {
    tier: 3,
    weight: 0.05,
    reliability: 0.70,
    requiresVerification: false,
  },
  rss_feeds: {
    tier: 3,
    weight: 0.05,
    reliability: 0.60,
    requiresVerification: false,
  },
};

/**
 * Deduplicate observations by content hash
 */
export function deduplicateObservations(
  observations: Array<{ textValue: string; objectId: string }>
): DeduplicationResult {
  const seen = new Set<string>();
  const uniqueObservations: string[] = [];
  let duplicateCount = 0;

  for (const obs of observations) {
    const hash = `${obs.objectId}:${obs.textValue}`;
    if (seen.has(hash)) {
      duplicateCount++;
      continue;
    }
    seen.add(hash);
    uniqueObservations.push(obs.textValue);
  }

  return {
    uniqueObservations,
    duplicateCount,
    deduplicated: duplicateCount > 0,
  };
}

/**
 * Cross-source duplicate detection
 */
export function detectCrossSourceDuplicates(
  sourceData: Record<string, Array<{ textValue: string; objectId: string }>>
): {
  crossSourceDuplicates: number;
  affectedSources: string[];
} {
  const allHashes = new Map<string, Set<string>>();
  let crossSourceDuplicates = 0;
  const affectedSources = new Set<string>();

  for (const [sourceName, observations] of Object.entries(sourceData)) {
    for (const obs of observations) {
      const hash = `${obs.objectId}:${obs.textValue}`;
      if (!allHashes.has(hash)) {
        allHashes.set(hash, new Set());
      }
      allHashes.get(hash)!.add(sourceName);
    }
  }

  for (const [hash, sources] of allHashes.entries()) {
    if (sources.size > 1) {
      crossSourceDuplicates++;
      sources.forEach((s) => affectedSources.add(s));
    }
  }

  return {
    crossSourceDuplicates,
    affectedSources: Array.from(affectedSources),
  };
}

/**
 * Detect anomalies in character counts using Z-score analysis
 */
export function detectAnomalies(
  counts: Record<string, number>
): AnomalyDetection {
  const values = Object.values(counts);
  if (values.length < 10) {
    return {
      isAnomalous: false,
      severity: "low",
      reason: "Insufficient data for anomaly detection",
      confidence: 0,
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Check for values > 3 standard deviations from mean
  const anomalies: Array<{ char: string; zScore: number }> = [];
  for (const [char, count] of Object.entries(counts)) {
    const zScore = Math.abs((count - mean) / stdDev);
    if (zScore > 3) {
      anomalies.push({ char, zScore });
    }
  }

  if (anomalies.length === 0) {
    return {
      isAnomalous: false,
      severity: "low",
      reason: "No anomalies detected",
      confidence: 0.95,
    };
  }

  const maxZScore = Math.max(...anomalies.map((a) => a.zScore));
  const severity = maxZScore > 5 ? "high" : maxZScore > 4 ? "medium" : "low";

  return {
    isAnomalous: true,
    severity,
    reason: `Detected ${anomalies.length} anomalies with max Z-score of ${maxZScore.toFixed(2)}`,
    confidence: Math.min(0.99, maxZScore / 5),
  };
}

/**
 * Detect sudden usage spikes (>200% increase)
 */
export function detectUsageSpikes(
  currentCounts: Record<string, number>,
  previousCounts: Record<string, number>
): AnomalyDetection {
  const spikes: Array<{ char: string; increase: number }> = [];

  for (const [char, current] of Object.entries(currentCounts)) {
    const previous = previousCounts[char] || 0;
    if (previous === 0 && current > 1000) {
      spikes.push({ char, increase: Infinity });
    } else if (previous > 0) {
      const increase = ((current - previous) / previous) * 100;
      if (increase > 200) {
        spikes.push({ char, increase });
      }
    }
  }

  if (spikes.length === 0) {
    return {
      isAnomalous: false,
      severity: "low",
      reason: "No usage spikes detected",
      confidence: 0.95,
    };
  }

  const maxIncrease = Math.max(...spikes.map((s) => s.increase));
  const severity = maxIncrease > 500 ? "high" : maxIncrease > 300 ? "medium" : "low";

  return {
    isAnomalous: true,
    severity,
    reason: `Detected ${spikes.length} usage spikes with max increase of ${maxIncrease.toFixed(0)}%`,
    confidence: Math.min(0.99, maxIncrease / 500),
  };
}

/**
 * Apply source weight caps to prevent single-source dominance
 */
export function applySourceWeightCaps(
  sourceWeights: Record<string, number>
): Record<string, number> {
  const maxSingleSourceWeight = 0.5; // Maximum 50% from single source
  const adjustedWeights: Record<string, number> = {};

  const totalWeight = Object.values(sourceWeights).reduce((a, b) => a + b, 0);

  for (const [source, weight] of Object.entries(sourceWeights)) {
    const cappedWeight = Math.min(weight, maxSingleSourceWeight);
    adjustedWeights[source] = cappedWeight;
  }

  // Renormalize to maintain total weight
  const cappedTotal = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  const normalizationFactor = totalWeight / cappedTotal;

  for (const source in adjustedWeights) {
    adjustedWeights[source] *= normalizationFactor;
  }

  return adjustedWeights;
}

/**
 * Apply time-weighted smoothing to reduce noise
 */
export function applyTimeWeightedSmoothing(
  currentCounts: Record<string, number>,
  historicalCounts: Array<Record<string, number>>,
  smoothingFactor: number = 0.3
): Record<string, number> {
  const smoothed: Record<string, number> = { ...currentCounts };

  if (historicalCounts.length === 0) {
    return smoothed;
  }

  for (const char of Object.keys(currentCounts)) {
    const historicalValues = historicalCounts
      .map((h) => h[char] || 0)
      .reverse(); // Most recent first

    let weightedSum = currentCounts[char] * smoothingFactor;
    let weightSum = smoothingFactor;

    for (let i = 0; i < historicalValues.length; i++) {
      const weight = smoothingFactor * Math.pow(1 - smoothingFactor, i + 1);
      weightedSum += historicalValues[i] * weight;
      weightSum += weight;
    }

    smoothed[char] = weightedSum / weightSum;
  }

  return smoothed;
}

/**
 * Calculate source diversity score (entropy across sources)
 */
export function calculateSourceDiversity(
  sourceCounts: Record<string, number>
): number {
  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of Object.values(sourceCounts)) {
    const probability = count / total;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }

  const maxEntropy = Math.log2(Object.keys(sourceCounts).length);
  return entropy / maxEntropy; // Normalized 0-1
}

/**
 * Comprehensive anti-manipulation check
 */
export async function runAntiManipulationChecks(
  observations: Array<{ textValue: string; objectId: string; source: string }>,
  historicalCounts: Array<Record<string, number>> = []
): Promise<{
  passed: boolean;
  checks: {
    deduplication: DeduplicationResult;
    crossSourceDuplicates: { crossSourceDuplicates: number; affectedSources: string[] };
    anomalyDetection: AnomalyDetection;
    sourceDiversity: number;
    usageSpikes: AnomalyDetection;
  };
  recommendations: string[];
}> {
  const recommendations: string[] = [];

  // 1. Deduplication
  const deduplication = deduplicateObservations(observations);

  // 2. Cross-source duplicate detection
  const sourceData: Record<string, Array<{ textValue: string; objectId: string }>> = {};
  for (const obs of observations) {
    if (!sourceData[obs.source]) {
      sourceData[obs.source] = [];
    }
    sourceData[obs.source].push(obs);
  }
  const crossSourceDuplicates = detectCrossSourceDuplicates(sourceData);

  // 3. Anomaly detection
  const counts = countCharacters(
    deduplication.uniqueObservations.join(" ")
  ).counts;
  const anomalyDetection = detectAnomalies(counts);

  // 4. Source diversity
  const sourceCounts: Record<string, number> = {};
  for (const obs of observations) {
    sourceCounts[obs.source] = (sourceCounts[obs.source] || 0) + 1;
  }
  const sourceDiversity = calculateSourceDiversity(sourceCounts);

  // 5. Usage spikes
  const usageSpikes =
    historicalCounts.length > 0
      ? detectUsageSpikes(counts, historicalCounts[historicalCounts.length - 1])
      : { isAnomalous: false, severity: "low" as const, reason: "No historical data", confidence: 0 };

  // Generate recommendations
  if (deduplication.deduplicated) {
    recommendations.push(
      `${deduplication.duplicateCount} duplicate observations removed`
    );
  }

  if (crossSourceDuplicates.crossSourceDuplicates > 10) {
    recommendations.push(
      `High cross-source duplication detected: ${crossSourceDuplicates.crossSourceDuplicates} items`
    );
  }

  if (anomalyDetection.isAnomalous) {
    recommendations.push(
      `Anomaly detected: ${anomalyDetection.reason}. Manual review recommended.`
    );
  }

  if (sourceDiversity < 0.3) {
    recommendations.push(
      `Low source diversity (${(sourceDiversity * 100).toFixed(0)}%). Consider adding more sources.`
    );
  }

  if (usageSpikes.isAnomalous) {
    recommendations.push(
      `Usage spike detected: ${usageSpikes.reason}. Manual review recommended.`
    );
  }

  // Overall pass/fail
  const criticalFailures = [
    anomalyDetection.isAnomalous && anomalyDetection.severity === "high",
    usageSpikes.isAnomalous && usageSpikes.severity === "high",
  ].filter(Boolean).length;

  const passed = criticalFailures === 0;

  return {
    passed,
    checks: {
      deduplication,
      crossSourceDuplicates,
      anomalyDetection,
      sourceDiversity,
      usageSpikes,
    },
    recommendations,
  };
}
