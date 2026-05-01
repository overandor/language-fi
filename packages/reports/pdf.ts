import PDFDocument from "pdfkit"

export interface PrimitiveReportData {
  primitives: Array<{
    symbol: string
    price: number
    change: number
    volume: number
    rank: number
  }>
  generatedAt: Date
  period: string
}

export function generatePrimitiveReport(data: PrimitiveReportData): Buffer {
  const doc = new PDFDocument()
  const chunks: Buffer[] = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {})

  doc.fontSize(24).text("Language.fi Market Report", { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`Period: ${data.period}`, { align: 'center' })
  doc.fontSize(12).text(`Generated: ${data.generatedAt.toISOString()}`, { align: 'center' })
  doc.moveDown(2)

  doc.fontSize(18).text("Primitive Market Overview", { underline: true })
  doc.moveDown()

  data.primitives.forEach((p, i) => {
    doc.fontSize(12).text(
      `${i + 1}. ${p.symbol} | Price: $${p.price.toFixed(4)} | 24h Change: ${(p.change * 100).toFixed(2)}% | Volume: ${p.volume.toLocaleString()} | Rank: #${p.rank}`
    )
    doc.moveDown(0.5)
  })

  doc.moveDown(2)
  doc.fontSize(10).text("© 2026 Language.fi. All rights reserved.", { align: 'center' })
  doc.end()

  return Buffer.concat(chunks)
}

export interface StakingReportData {
  stakes: Array<{
    owner: string
    score: number
    stakedAt: Date
    rewards: number
  }>
  totalRewards: number
  generatedAt: Date
}

export function generateStakingReport(data: StakingReportData): Buffer {
  const doc = new PDFDocument()
  const chunks: Buffer[] = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {})

  doc.fontSize(24).text("Language.fi Staking Report", { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`Total Rewards Distributed: ${data.totalRewards.toFixed(2)} LGU`, { align: 'center' })
  doc.fontSize(12).text(`Generated: ${data.generatedAt.toISOString()}`, { align: 'center' })
  doc.moveDown(2)

  doc.fontSize(18).text("Active Stakes", { underline: true })
  doc.moveDown()

  data.stakes.forEach((s, i) => {
    doc.fontSize(12).text(
      `${i + 1}. Owner: ${s.owner.slice(0, 10)}... | Score: ${s.score.toFixed(2)} | Staked: ${s.stakedAt.toISOString()} | Rewards: ${s.rewards.toFixed(2)} LGU`
    )
    doc.moveDown(0.5)
  })

  doc.moveDown(2)
  doc.fontSize(10).text("© 2026 Language.fi. All rights reserved.", { align: 'center' })
  doc.end()

  return Buffer.concat(chunks)
}
