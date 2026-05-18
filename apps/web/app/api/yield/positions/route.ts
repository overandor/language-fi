import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const owner = searchParams.get("owner")
    
    if (!owner) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }
    
    const positions = await prisma.lPPosition.findMany({
      where: { owner },
      include: { pool: true },
      orderBy: { depositedAt: "desc" }
    })
    
    return NextResponse.json({ positions })
  } catch (error: any) {
    console.error("Position fetch error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
