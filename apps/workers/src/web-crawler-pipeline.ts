import { crawlAndSave } from "@languagefi/providers/web-crawler"
import { archiveOldSnapshots } from "@languagefi/oracle/snapshot-verification"

const SEED_URLS = [
  "https://example.com",
  "https://github.com",
  "https://reddit.com",
  "https://wikipedia.org"
]

export async function runWebCrawlerPipeline() {
  console.log("Starting web crawler pipeline...")
  
  for (const url of SEED_URLS) {
    try {
      console.log(`Crawling: ${url}`)
      await crawlAndSave(url)
      console.log(`✅ Successfully crawled: ${url}`)
    } catch (error) {
      console.error(`❌ Failed to crawl ${url}:`, error)
    }
  }
  
  console.log("Web crawler pipeline complete")
}

export async function runSnapshotMaintenance() {
  console.log("Running snapshot maintenance...")
  
  const result = await archiveOldSnapshots(30)
  console.log(`Archived ${result.archived} old snapshots`)
}

runWebCrawlerPipeline()
  .then(() => console.log("Web crawler pipeline complete"))
  .catch((err) => console.error("Web crawler pipeline error:", err))
