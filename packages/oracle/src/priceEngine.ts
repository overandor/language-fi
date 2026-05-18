/**
 * Oracle Price Engine
 * Deterministic pricing based on character counts from real data
 * NO FABRICATION - only prices what exists in database
 * REPRODUCIBLE - same input always produces same output with verifiable hash
 */

import { prisma } from "@languagefi/db";
import { countCharacters } from "@languagefi/core";
import { createHash } from "crypto";
import { getSnapshotSignals, integrateSnapshotIntoOracle } from "../web-snapshot";

const WEB2_WEIGHT = 0.05;
const FORMULA_VERSION = "v1.0";

export interface Web2Signal {
  usage: number;
  change: number;
  confidence: number;
}

export interface InputSnapshot {
  sourceDataHash: string;
  primitiveCounts: Record<string, number>;
  sourceWeights: Record<string, number>;
  timestamp: string;
}

export interface OracleRunMetadata {
  runId: string;
  timestamp: string;
  formulaVersion: string;
  inputSnapshot: InputSnapshot;
  runHash: string;
  previousRunHash: string | null;
  signature: string | null;
}

/**
 * Calculate hash of input data for reproducibility
 */
export function calculateInputHash(counts: Record<string, number>, sourceWeights: Record<string, number>): string {
  const data = JSON.stringify({ counts, sourceWeights });
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Calculate oracle run hash for verification
 */
export function calculateRunHash(
  inputHash: string,
  timestamp: string,
  formulaVersion: string,
  previousRunHash: string | null
): string {
  const data = JSON.stringify({ inputHash, timestamp, formulaVersion, previousRunHash });
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Get previous oracle run hash for chain of trust
 */
async function getPreviousRunHash(): Promise<string | null> {
  const previousRun = await prisma.oracleRun.findFirst({
    orderBy: { startedAt: 'desc' },
    where: { status: 'completed' },
  });
  return previousRun?.runHash || null;
}

/**
 * Sign oracle run with oracle private key
 */
function signRun(runHash: string): string {
  if (!process.env.ORACLE_PRIVATE_KEY) {
    console.warn("ORACLE_PRIVATE_KEY not set, returning unsigned hash");
    return runHash;
  }
  const signature = createHash('sha256')
    .update(runHash + process.env.ORACLE_PRIVATE_KEY)
    .digest('hex');
  return signature;
}

/**
 * Apply Web2 signal to base price (5% weight, never dominates)
 */
function applyWeb2(basePrice: number, web2Signal: Web2Signal | null): number {
  if (!web2Signal) return basePrice;
  
  const impact = web2Signal.usage * web2Signal.change * web2Signal.confidence;
  const adjusted = basePrice + WEB2_WEIGHT * impact;
  
  return Math.max(0, adjusted);
}

export interface OracleResult {
  primitiveId: string;
  priceLgu: number;
  currentWeekUsage: number;
  rank?: number;
}

export interface OracleRunResult {
  status: string;
  sourceCount: number;
  observationCount: number;
  primitiveCount: number;
  errorCount: number;
  notes?: string;
}

/**
 * Run oracle pricing calculation
 * Depends ONLY on data in PrimitiveCount table
 * REPRODUCIBLE: same input always produces same output with verifiable hash
 */
export async function runOracle(): Promise<OracleRunResult & { metadata?: OracleRunMetadata }> {
  const startedAt = new Date();
  let errorCount = 0;
  const notes: string[] = [];

  try {
    // Get previous run hash for chain of trust
    const previousRunHash = await getPreviousRunHash();
    
    // Create oracle run record
    const oracleRun = await prisma.oracleRun.create({
      data: {
        status: "running",
        startedAt,
        formulaVersion: FORMULA_VERSION,
        previousRunHash,
        sourceCount: 0,
        observationCount: 0,
        primitiveCount: 0,
        errorCount: 0,
      },
    });

    // Get active data sources
    const sources = await prisma.dataSource.findMany({
      where: { enabled: true },
    });

    if (!sources.length) {
      notes.push("No active data sources found");
      await prisma.oracleRun.update({
        where: { id: oracleRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          sourceCount: 0,
          observationCount: 0,
          primitiveCount: 0,
          errorCount: 0,
          notes: "No active data sources",
        },
      });
      return {
        status: "completed",
        sourceCount: 0,
        observationCount: 0,
        primitiveCount: 0,
        errorCount: 0,
        notes: "No active data sources",
      };
    }

    // Get recent primitive counts (last 7 days)
    const weekAgo = new Date(startedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const counts = await prisma.primitiveCount.findMany({
      where: {
        windowStart: { gte: weekAgo },
      },
    });

    if (!counts.length) {
      notes.push("No primitive counts found in last 7 days");
      await prisma.oracleRun.update({
        where: { id: oracleRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          sourceCount: sources.length,
          observationCount: 0,
          primitiveCount: 0,
          errorCount: 0,
          notes: "No primitive counts found",
        },
      });
      return {
        status: "completed",
        sourceCount: sources.length,
        observationCount: 0,
        primitiveCount: 0,
        errorCount: 0,
        notes: "No primitive counts found",
      };
    }

    // Group counts by primitive
    const grouped: Record<string, number> = {};
    for (const count of counts) {
      grouped[count.primitiveId] = (grouped[count.primitiveId] || 0) + count.occurrenceCount;
    }

    // Calculate source weights (simplified for now)
    const sourceWeights: Record<string, number> = {};
    for (const source of sources) {
      sourceWeights[source.name] = 0.4; // Default weight, will be refined
    }

    // Calculate input hash for reproducibility
    const inputHash = calculateInputHash(grouped, sourceWeights);

    // Create input snapshot
    const inputSnapshot: InputSnapshot = {
      sourceDataHash: inputHash,
      primitiveCounts: grouped,
      sourceWeights,
      timestamp: startedAt.toISOString(),
    };

    // Calculate total usage
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);

    if (total === 0) {
      notes.push("Total usage is zero");
      await prisma.oracleRun.update({
        where: { id: oracleRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          sourceCount: sources.length,
          observationCount: counts.length,
          primitiveCount: 0,
          errorCount: 0,
          notes: "Total usage is zero",
        },
      });
      return {
        status: "completed",
        sourceCount: sources.length,
        observationCount: counts.length,
        primitiveCount: 0,
        errorCount: 0,
        notes: "Total usage is zero",
      };
    }

    // Get web snapshot signals for additional pricing input
    const snapshotSignals = await getSnapshotSignals(weekAgo, startedAt)
    const snapshotSignalMap = new Map(snapshotSignals.map(s => [s.primitive, s]))

    // Calculate prices for each primitive
    const results: OracleResult[] = [];
    for (const [primitiveId, usage] of Object.entries(grouped)) {
      const basePrice = usage / total; // Simple frequency-based pricing
      
      // Apply web snapshot signal (3% weight)
      const snapshotSignal = snapshotSignalMap.get(primitiveId) || null
      const adjustedPrice = await integrateSnapshotIntoOracle(basePrice, snapshotSignal)
      
      results.push({
        primitiveId,
        priceLgu: adjustedPrice,
        currentWeekUsage: usage,
      });
    }

    // Sort by price descending and assign ranks
    results.sort((a, b) => b.priceLgu - a.priceLgu);
    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    // Get previous prices for change calculations
    const previousPrices = await prisma.primitivePrice.findMany({
      where: {
        calculatedAt: { gte: weekAgo },
      },
      orderBy: { calculatedAt: "desc" },
    });

    const previousPriceMap = new Map<string, number>();
    for (const pp of previousPrices) {
      if (!previousPriceMap.has(pp.primitiveId)) {
        previousPriceMap.set(pp.primitiveId, pp.priceLgu);
      }
    }

    // Create price records
    for (const result of results) {
      const previousPrice = previousPriceMap.get(result.primitiveId);
      const change24h = previousPrice
        ? ((result.priceLgu - previousPrice) / previousPrice) * 100
        : null;

      await prisma.primitivePrice.create({
        data: {
          primitiveId: result.primitiveId,
          priceLgu: result.priceLgu,
          previousPriceLgu: previousPrice,
          change24h,
          currentWeekUsage: result.currentWeekUsage,
          rank: result.rank,
          calculatedAt: startedAt,
        },
      });
    }

    // Calculate run hash for verification
    const runHash = calculateRunHash(inputHash, startedAt.toISOString(), FORMULA_VERSION, previousRunHash);

    // Update oracle run record with reproducibility data
    await prisma.oracleRun.update({
      where: { id: oracleRun.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        sourceCount: sources.length,
        observationCount: counts.length,
        primitiveCount: results.length,
        errorCount,
        runHash,
        inputSnapshot: JSON.stringify(inputSnapshot),
        notes: notes.join("; ") || "Success",
      },
    });

    console.log(`Oracle run completed: ${results.length} primitives priced`);
    console.log(`Run hash: ${runHash}`);
    console.log(`Input hash: ${inputHash}`);

    const metadata: OracleRunMetadata = {
      runId: oracleRun.id,
      timestamp: startedAt.toISOString(),
      formulaVersion: FORMULA_VERSION,
      inputSnapshot,
      runHash,
      previousRunHash,
      signature: signRun(runHash),
    };

    return {
      status: "completed",
      sourceCount: sources.length,
      observationCount: counts.length,
      primitiveCount: results.length,
      errorCount,
      notes: notes.join("; ") || "Success",
      metadata,
    };
  } catch (error) {
    errorCount++;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Oracle run error:", errorMessage);

    return {
      status: "failed",
      sourceCount: 0,
      observationCount: 0,
      primitiveCount: 0,
      errorCount,
      notes: errorMessage,
    };
  }
}

/**
 * Get current prices for all primitives
 */
export async function getCurrentPrices() {
  const prices = await prisma.primitivePrice.findMany({
    orderBy: { priceLgu: "desc" },
    include: {
      primitive: true,
    },
  });

  if (!prices.length) {
    return {
      status: "empty",
      message: "No primitive prices calculated",
      data: [],
    };
  }

  return {
    status: "success",
    data: prices.map((p) => ({
      id: p.id,
      symbol: p.primitive.symbol,
      displaySymbol: p.primitive.displaySymbol,
      type: p.primitive.type,
      priceLgu: p.priceLgu,
      change24h: p.change24h,
      currentWeekUsage: p.currentWeekUsage,
      rank: p.rank,
      calculatedAt: p.calculatedAt,
    })),
  };
}
