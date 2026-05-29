import { Router } from "express";

const router = Router();

const DATA_SOURCES = [
  { id: 1, name: "GitHub Repos", category: "Dev/Social", url: "https://api.github.com", access: "public", weight: 0.20, description: "Repository names and descriptions", latency_ms: 200, freshness_s: 60, status: "live" as const },
  { id: 2, name: "Wikipedia Pages", category: "Reference", url: "https://en.wikipedia.org", access: "public", weight: 0.15, description: "Article titles and content", latency_ms: 300, freshness_s: 60, status: "live" as const },
  { id: 3, name: "Hacker News", category: "Social", url: "https://hacker-news.firebaseio.com", access: "public", weight: 0.15, description: "Story titles and metadata", latency_ms: 250, freshness_s: 60, status: "live" as const },
  { id: 4, name: "Reddit", category: "Social", url: "https://www.reddit.com", access: "public", weight: 0.15, description: "Post titles and metadata", latency_ms: 250, freshness_s: 60, status: "live" as const },
  { id: 5, name: "Binance Token Names", category: "Exchange", url: "https://api.binance.com", access: "public", weight: 0.15, description: "Exchange trading pairs", latency_ms: 120, freshness_s: 60, status: "live" as const },
  { id: 6, name: "Coinbase Listings", category: "Exchange", url: "https://api.coinbase.com", access: "public", weight: 0.10, description: "Exchange token listings", latency_ms: 150, freshness_s: 60, status: "live" as const },
  { id: 7, name: "NPM Packages", category: "Dev/Social", url: "https://registry.npmjs.org", access: "public", weight: 0.10, description: "Package names and descriptions", latency_ms: 180, freshness_s: 60, status: "live" as const },
];

// Export the data directly for use in other routes
export { DATA_SOURCES };

router.get("/sources", (_req, res) => {
  res.json({ sources: DATA_SOURCES });
});

export default router;
