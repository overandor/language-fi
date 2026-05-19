import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    
    const snapshots = await prisma.webSnapshot.findMany({
      orderBy: { extractedAt: "desc" },
      take: limit,
      include: {
        primitiveCounts: true
      }
    })

    return NextResponse.json({
      status: "success",
      data: snapshots.map((s: {
        id: string;
        url: string;
        domain: string;
        title: string | null;
        contentHash: string;
        extractedAt: Date;
        status: string;
        primitiveCounts: Array<unknown>;
      }) => ({
        id: s.id,
        url: s.url,
        domain: s.domain,
        title: s.title,
        contentHash: s.contentHash,
        extractedAt: s.extractedAt,
        status: s.status,
        primitiveCount: s.primitiveCounts.length
      }))
    })
  } catch (error) {
    console.error("Snapshots fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const { crawlAndSave } = await import("@languagefi/providers/web-crawler")
    const snapshot = await crawlAndSave(url)

    return NextResponse.json({
      status: "success",
      data: {
        id: snapshot.id,
        url: snapshot.url,
        domain: snapshot.domain,
        extractedAt: snapshot.extractedAt
      }
    })
  } catch (error) {
    console.error("Snapshot creation error:", error)
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 })
  }
}
