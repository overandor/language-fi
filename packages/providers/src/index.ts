/**
 * Language.fi Providers Package
 * External data ingestion providers
 */

export * from './coingecko.provider';
export { fetchCoinGeckoObservations } from "./coingecko.provider";
export {
  SOURCE_QUALITY_TIERS,
  deduplicateObservations,
  detectCrossSourceDuplicates,
  detectAnomalies,
  detectUsageSpikes,
  applySourceWeightCaps,
  applyTimeWeightedSmoothing,
  calculateSourceDiversity,
  runAntiManipulationChecks,
} from "./antiManipulation";
export type {
  SourceQuality,
  AnomalyDetection,
  DeduplicationResult,
} from "./antiManipulation";
