import { NextResponse } from "next/server"
import { generateStakingReport } from "@languagefi/reports"
import { prisma } from "@languagefi/db"

export async function GET() {
  try {
    const stakes = await prisma.stake.findMany({
      where: { active: true },
      include: { sentence: true },
      orderBy: { stakedAt: "desc" },
      take: 100
    })

    const totalRewards = stakes.reduce((sum, s) => sum + (s.rewards || 0), 0)

    const data = {
      stakes: stakes.map(s => ({
        owner: s.ownerWallet,
        score: s.score || 0,
        stakedAt: s.stakedAt,
        rewards: s.rewards || 0
      })),
      totalRewards,
      generatedAt: new Date()
    }

    const pdf = generateStakingReport(data)

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=language-fi-staking-report.pdf"
      }
    })
  } catch (error: any) {
    console.error("Staking report generation error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
