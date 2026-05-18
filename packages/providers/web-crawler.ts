import { createHash } from "crypto"
import { prisma } from "@languagefi/db"

export interface CrawlResult {
  url: string
  domain: string
  title: string
  content: string
  contentHash: string
  primitiveCounts: Record<string, number>
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Language.fi Oracle Crawler 1.0"
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Extract title (simple extraction)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ""
    
    // Extract text content (remove HTML tags)
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    
    // Calculate content hash
    const contentHash = createHash("sha256").update(text).digest("hex")
    
    // Extract primitive counts
    const primitiveCounts: Record<string, number> = {}
    for (const char of text.toUpperCase()) {
      primitiveCounts[char] = (primitiveCounts[char] || 0) + 1
    }
    
    return {
      url,
      domain: new URL(url).hostname,
      title,
      content: text,
      contentHash,
      primitiveCounts
    }
  } catch (error) {
    throw new Error(`Failed to crawl ${url}: ${error}`)
  }
}

export async function saveSnapshot(result: CrawlResult) {
  const snapshot = await prisma.webSnapshot.create({
    data: {
      url: result.url,
      domain: result.domain,
      title: result.title,
      contentHash: result.contentHash,
      content: result.content,
      status: "processed"
    }
  })
  
  // Save primitive counts
  for (const [primitive, count] of Object.entries(result.primitiveCounts)) {
    await prisma.primitiveCountSnapshot.create({
      data: {
        snapshotId: snapshot.id,
        primitive,
        count
      }
    })
  }
  
  return snapshot
}

export async function crawlAndSave(url: string) {
  const result = await crawlUrl(url)
  const snapshot = await saveSnapshot(result)
  return snapshot
}
