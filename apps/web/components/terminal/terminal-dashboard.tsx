"use client"

import type { ChangeEvent, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type PrimitiveRow = {
  id: string
  symbol: string
  displaySymbol: string
  type: string
  priceLgu: number
  change24h?: number | null
  currentWeekUsage?: number | null
  rank?: number | null
  calculatedAt?: string | Date
}

type OracleRun = {
  id: string
  status: string
  startedAt: string | Date
  completedAt?: string | Date | null
  formulaVersion?: string | null
  runHash?: string | null
  previousRunHash?: string | null
  signature?: string | null
  sourceCount?: number | null
  observationCount?: number | null
  primitiveCount?: number | null
  errorCount?: number | null
  notes?: string | null
}

type LedgerEntry = {
  runId: string
  timestamp: string
  completedAt?: string | null
  status: string
  formulaVersion?: string | null
  sourceCount: number
  observationCount: number
  primitiveCount: number
  errorCount: number
  notes?: string | null
  previousRunHash?: string | null
  runHash?: string | null
  signature?: string | null
  primitivePrices: Array<{
    symbol: string
    displaySymbol: string
    type: string
    priceLgu: number
    rank?: number | null
    currentWeekUsage?: number | null
  }>
}

type HistoryPoint = {
  at: string | Date
  priceLgu: number
  change24h?: number | null
  rank?: number | null
  currentWeekUsage?: number | null
}

type QuoteBreakdown = {
  char: string
  count: number
  status?: string
  unitPrice?: number
  total?: number
}

type SentenceQuote = {
  total?: number
  breakdown?: QuoteBreakdown[]
  timestamp?: string | Date
}

type StakeResult = SentenceQuote & {
  sentence: string
  sentenceHash: string
  merkleRoot: string
  wallet?: string | null
  ownerWallet?: string | null
  status?: string
  anchorTarget?: string
  anchorReady?: boolean
}

type AttestationResult = {
  root: string
  leafCount: number
  sourceCount: number
  anchorTarget: string
  anchorReady: boolean
  ledgerHash: string
  network: string
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })
const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatMoney(value: number | null | undefined) {
  return money.format(Number.isFinite(Number(value)) ? Number(value) : 0)
}

function formatPercent(value: number | null | undefined) {
  const num = Number(value ?? 0)
  return `${num >= 0 ? "+" : ""}${percent.format(num)}%`
}

function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function truncate(value: string, start = 8, end = 6) {
  if (!value) return "—"
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

function buildPolyline(values: number[], width = 180, height = 64, padding = 6) {
  if (!values.length) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
      const y = height - padding - ((value - min) / span) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")
}

function Sparkline({ values }: { values: number[] }) {
  const points = buildPolyline(values)
  if (!points) {
    return <div className="spark-empty">No history yet</div>
  }

  return (
    <svg className="sparkline" viewBox="0 0 180 64" preserveAspectRatio="none">
      <polyline points={points} />
    </svg>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {hint ? <div className="metric-hint">{hint}</div> : null}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <div className="panel-title">{title}</div>
          {subtitle ? <div className="panel-subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function TerminalDashboard() {
  const [primitives, setPrimitives] = useState<PrimitiveRow[]>([])
  const [runs, setRuns] = useState<OracleRun[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState("A")
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [walletStatus, setWalletStatus] = useState<"idle" | "connecting" | "linked" | "error">("idle")
  const [walletMessage, setWalletMessage] = useState("Connect a wallet to link sentence ownership and investor access.")
  const [sentence, setSentence] = useState("THE MARKET IS A LANGUAGE MACHINE")
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [quote, setQuote] = useState<SentenceQuote | null>(null)
  const [stakeResult, setStakeResult] = useState<StakeResult | null>(null)
  const [attestation, setAttestation] = useState<AttestationResult | null>(null)
  const [stripeTier, setStripeTier] = useState<"starter" | "pro" | "fund" | null>(null)
  const [busy, setBusy] = useState(false)

  const selectedPrimitive = useMemo<PrimitiveRow | undefined>(
    () => primitives.find((item: PrimitiveRow) => item.symbol === selectedSymbol || item.displaySymbol === selectedSymbol),
    [primitives, selectedSymbol]
  )

  const topPrimitives = useMemo<PrimitiveRow[]>(
    () => [...primitives].sort((a: PrimitiveRow, b: PrimitiveRow) => Number(b.priceLgu || 0) - Number(a.priceLgu || 0)).slice(0, 12),
    [primitives]
  )

  const derivedKpis = useMemo<Array<{ label: string; value: string; hint: string }>>(() => {
    const total = primitives.length || 1
    const positive = primitives.filter((p: PrimitiveRow) => Number(p.change24h || 0) > 0).length
    const avgPrice = primitives.reduce((sum: number, p: PrimitiveRow) => sum + Number(p.priceLgu || 0), 0) / total
    const momentum = primitives.reduce((sum: number, p: PrimitiveRow) => sum + Number(p.change24h || 0), 0) / total
    const topFive = [...primitives]
      .sort((a: PrimitiveRow, b: PrimitiveRow) => Number(b.priceLgu || 0) - Number(a.priceLgu || 0))
      .slice(0, 5)
      .reduce((sum: number, p: PrimitiveRow) => sum + Number(p.priceLgu || 0), 0)
    const totalPrice = primitives.reduce((sum: number, p: PrimitiveRow) => sum + Number(p.priceLgu || 0), 0) || 1
    const concentration = (topFive / totalPrice) * 100
    const breadth = (positive / total) * 100
    const narrativeScore = clamp((breadth * 0.42 + (momentum + 10) * 4 + (100 - concentration) * 0.2) / 2, 0, 100)

    return [
      { label: "Breadth", value: `${breadth.toFixed(1)}%`, hint: "Positive closes across tokenized letters" },
      { label: "Momentum", value: formatPercent(momentum), hint: "Average 24h change across the board" },
      { label: "Concentration", value: `${concentration.toFixed(1)}%`, hint: "Top-5 price share" },
      { label: "Narrative Score", value: `${narrativeScore.toFixed(0)} / 100`, hint: "Auto-appraised every refresh" },
      { label: "Avg Price", value: formatMoney(avgPrice), hint: "Normalized LGU basket value" },
    ]
  }, [primitives])

  const selectedHistoryValues = useMemo(() => history.map((point: HistoryPoint) => Number(point.priceLgu || 0)), [history])
  const topQuotes = useMemo<QuoteBreakdown[]>(() => (quote?.breakdown || []).slice(0, 8), [quote])

  async function refreshDashboard() {
    setLoading(true)
    try {
      const [primitivesRes, runsRes, ledgerRes, attestationRes] = await Promise.allSettled([
        fetch("/api/primitives/public").then((res) => res.json()),
        fetch("/api/oracle/runs").then((res) => res.json()),
        fetch("/api/oracle/ledger?limit=10").then((res) => res.json()),
        fetch("/api/attestations").then((res) => res.json()),
      ])

      if (primitivesRes.status === "fulfilled") {
        setPrimitives(primitivesRes.value.data || [])
        const first = (primitivesRes.value.data || [])[0]
        if (!selectedSymbol && first) setSelectedSymbol(first.symbol)
      }

      if (runsRes.status === "fulfilled") {
        setRuns(runsRes.value.data || [])
      }

      if (ledgerRes.status === "fulfilled") {
        setLedger(ledgerRes.value.ledger || [])
      }

      if (attestationRes.status === "fulfilled") {
        setAttestation(attestationRes.value.data || attestationRes.value)
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory(symbol: string) {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/letters/history?letter=${encodeURIComponent(symbol)}&limit=30`)
      const data = await response.json()
      setHistory(data.history || [])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function connectWallet() {
    const ethereum = (window as Window & { ethereum?: any }).ethereum
    if (!ethereum) {
      setWalletStatus("error")
      setWalletMessage("No injected wallet found. Install a Solana/EVM wallet extension to link ownership.")
      return
    }

    setWalletStatus("connecting")
    setWalletMessage("Requesting wallet access and creating a session…")

    try {
      const [address] = await ethereum.request({ method: "eth_requestAccounts" })
      const sessionResponse = await fetch("/api/session/create", {
        method: "POST",
        credentials: "include",
      })
      const sessionData = await sessionResponse.json()
      const linkResponse = await fetch("/api/session/link-wallet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      })
      const linkData = await linkResponse.json()

      setWalletAddress(address)
      setSessionId(sessionData.sessionId || "")
      setWalletStatus("linked")
      setWalletMessage(linkData.walletAddress ? "Wallet linked to the terminal session." : "Wallet connected.")
    } catch (error) {
      setWalletStatus("error")
      setWalletMessage("Wallet connection failed. Check wallet permissions and try again.")
    }
  }

  async function analyzeSentence() {
    if (!sentence.trim()) return
    setBusy(true)
    try {
      const [analysisResponse, quoteResponse] = await Promise.all([
        fetch("/api/llm/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentence }),
        }).then((res) => res.json()),
        fetch("/api/sentences/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence }),
        }).then((res) => res.json()),
      ])
      setAnalysis(analysisResponse)
      setQuote(quoteResponse)
    } catch (err: any) {
      setAnalysis({ narrative: `Analysis failed: ${err?.message || "Unknown error"}` })
    } finally {
      setBusy(false)
    }
  }

  async function stakeSentence() {
    if (!sentence.trim()) return
    setBusy(true)
    try {
      const response = await fetch("/api/sentences/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, wallet: walletAddress || undefined }),
      })
      const data = await response.json()
      if (data.error) {
        alert(`Stake failed: ${data.error}`)
        return
      }
      setStakeResult(data)
      setQuote(data.quote || quote)
      setAttestation((current: AttestationResult | null) =>
        data.attestation ? {
          root: data.attestation.root,
          leafCount: data.attestation.leafCount,
          sourceCount: data.attestation.sourceCount,
          anchorTarget: data.attestation.anchorTarget,
          anchorReady: data.attestation.anchorReady,
          ledgerHash: data.attestation.ledgerHash,
          network: data.attestation.network,
        } : current
      )
    } catch (err: any) {
      alert(`Stake failed: ${err?.message || "Unknown error"}`)
    } finally {
      setBusy(false)
    }
  }

  async function startCheckout(tier: "starter" | "pro" | "fund") {
    setStripeTier(tier)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await response.json()
      if (data?.url) {
        window.location.href = data.url
      } else if (data?.error) {
        alert(`Checkout error: ${data.error}`)
      }
    } finally {
      setStripeTier(null)
    }
  }

  useEffect(() => {
    refreshDashboard()
    const timer = window.setInterval(refreshDashboard, 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (selectedSymbol) {
      loadHistory(selectedSymbol)
    }
  }, [selectedSymbol])

  return (
    <div className="terminal-shell">
      <header className="terminal-topbar">
        <div>
          <div className="eyebrow">LANGUAGE.FI // SEMANTIC LIQUIDITY TERMINAL</div>
          <h1>Bloomberg-grade appraisal for tokenized letters</h1>
          <p>
            LLM-first oracle, sentence staking, historical letter pricing, attested Merkle roots, and investor-grade market telemetry.
          </p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={refreshDashboard} disabled={loading}>
            {loading ? "SYNCING" : "REFRESH"}
          </button>
          <Link className="btn btn-secondary" href="/oracle/runs">
            RUNS
          </Link>
          <Link className="btn btn-secondary" href="/markets">
            MARKET DEPTH
          </Link>
        </div>
      </header>

      <div className="metric-grid">
        {derivedKpis.map((metric: { label: string; value: string; hint: string }) => (
          <div key={metric.label}>
            <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
          </div>
        ))}
      </div>

      <div className="terminal-grid terminal-grid-main">
        <Panel
          title="Letter Atlas"
          subtitle="Tokenized letters with real-time appraisal, ranks, and momentum"
          actions={<span className="badge">{primitives.length} assets</span>}
        >
          <div className="letter-grid">
            {LETTERS.map((letter: string) => {
              const item = primitives.find((row: PrimitiveRow) => row.symbol === letter)
              const active = selectedSymbol === letter
              return (
                <button
                  key={letter}
                  className={`letter-tile ${active ? "active" : ""}`}
                  onClick={() => setSelectedSymbol(letter)}
                  title={`Inspect ${letter}`}
                >
                  <span className="letter-symbol">{letter}</span>
                  <span className="letter-price">{item ? formatMoney(item.priceLgu) : "—"}</span>
                  <span className={`letter-change ${Number(item?.change24h || 0) >= 0 ? "positive" : "negative"}`}>
                    {item ? formatPercent(item.change24h) : "No price"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="selected-letter-card">
            <div className="selected-letter-head">
              <div>
                <div className="eyebrow">SELECTED LETTER</div>
                <h3>{selectedPrimitive?.symbol || selectedSymbol}</h3>
                <p>
                  {selectedPrimitive?.type || "letter"} • rank {selectedPrimitive?.rank ?? "—"} • usage {selectedPrimitive?.currentWeekUsage ?? 0}
                </p>
              </div>
              <div className="selected-letter-price">
                <span>LGU</span>
                <strong>{selectedPrimitive ? formatMoney(selectedPrimitive.priceLgu) : "—"}</strong>
              </div>
            </div>

            <div className="sparkline-frame">
              <Sparkline values={selectedHistoryValues.length ? selectedHistoryValues : [0]} />
            </div>

            <div className="mini-stats">
              <div>
                <span>Latest close</span>
                <strong>{selectedPrimitive ? formatMoney(selectedPrimitive.priceLgu) : "—"}</strong>
              </div>
              <div>
                <span>24h move</span>
                <strong className={Number(selectedPrimitive?.change24h || 0) >= 0 ? "positive" : "negative"}>
                  {selectedPrimitive ? formatPercent(selectedPrimitive.change24h) : "—"}
                </strong>
              </div>
              <div>
                <span>Last update</span>
                <strong>{selectedPrimitive ? formatTime(selectedPrimitive.calculatedAt) : "—"}</strong>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Sentence Lab"
          subtitle="Quote, stake, and appraise narratives with deterministic letter pricing"
          actions={<span className="badge">LLM + ORACLE</span>}
        >
          <textarea
            className="textarea"
            value={sentence}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSentence(event.target.value.toUpperCase())}
            placeholder="Enter a sentence to price and stake…"
          />

          <div className="action-row">
            <button className="btn btn-primary" onClick={analyzeSentence} disabled={busy}>
              {busy ? "PROCESSING" : "APPRAISE"}
            </button>
            <button className="btn btn-secondary" onClick={stakeSentence} disabled={busy}>
              STAKE SENTENCE
            </button>
          </div>

          <div className="narrative-box">
            <div className="narrative-title">LLM appraisal</div>
            <p>{(analysis?.narrative as string) || "Appraisal will appear here after analysis."}</p>
          </div>

          <div className="quote-grid">
            <div className="quote-card">
              <span>Quoted value</span>
              <strong>{quote?.total != null ? `${formatMoney(Number(quote.total))} LGU` : "—"}</strong>
            </div>
            <div className="quote-card">
              <span>Sentence hash</span>
              <strong>{stakeResult?.sentenceHash ? truncate(stakeResult.sentenceHash) : "—"}</strong>
            </div>
            <div className="quote-card">
              <span>Merkle root</span>
              <strong>{stakeResult?.merkleRoot ? truncate(stakeResult.merkleRoot) : attestation?.root ? truncate(attestation.root) : "—"}</strong>
            </div>
          </div>

          <div className="breakdown-table-wrap">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Char</th>
                  <th>Count</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote?.breakdown || []).map((item: QuoteBreakdown) => (
                  <tr key={`${item.char}-${item.count}`}>
                    <td>{item.char}</td>
                    <td>{item.count}</td>
                    <td>{item.unitPrice != null ? formatMoney(item.unitPrice) : item.status || "—"}</td>
                    <td>{item.total != null ? formatMoney(item.total) : "—"}</td>
                  </tr>
                ))}
                {!quote?.breakdown?.length ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      No quote yet. Run appraisal to see the pricing breakdown.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="breakdown-list">
            {topQuotes.map((item: QuoteBreakdown) => (
              <div key={`${item.char}-${item.count}`} className="breakdown-pill">
                <span>{item.char}</span>
                <strong>{item.unitPrice != null ? formatMoney(item.unitPrice) : item.status || "—"}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Wallet, Stripe & Attestation"
          subtitle="Session linking, investor access, and Solana-devnet-ready receipts"
          actions={<span className={`badge ${walletStatus === "linked" ? "badge-success" : ""}`}>{walletStatus.toUpperCase()}</span>}
        >
          <div className="wallet-card">
            <div className="wallet-line">
              <span>Wallet</span>
              <strong>{walletAddress ? truncate(walletAddress) : "Not linked"}</strong>
            </div>
            <div className="wallet-line">
              <span>Session</span>
              <strong>{sessionId ? truncate(sessionId) : "No session"}</strong>
            </div>
            <div className="wallet-note">{walletMessage}</div>
            <button className="btn btn-primary full-width" onClick={connectWallet} disabled={walletStatus === "connecting"}>
              {walletStatus === "connecting" ? "CONNECTING" : "CONNECT WALLET"}
            </button>
          </div>

          <div className="investor-grid">
            <button className="investor-tier" onClick={() => startCheckout("starter")} disabled={stripeTier !== null}>
              <span>Starter</span>
              <strong>API access + terminal preview</strong>
              <small>Stripe checkout ready</small>
            </button>
            <button className="investor-tier" onClick={() => startCheckout("pro")} disabled={stripeTier !== null}>
              <span>Pro</span>
              <strong>Historical prices + oracle ledger</strong>
              <small>For active analysts</small>
            </button>
            <button className="investor-tier" onClick={() => startCheckout("fund")} disabled={stripeTier !== null}>
              <span>Fund</span>
              <strong>White-glove onboarding</strong>
              <small>Investor capture CTA</small>
            </button>
          </div>

          <div className="attestation-card">
            <div className="attestation-line">
              <span>Network</span>
              <strong>{attestation?.network || "solana-devnet"}</strong>
            </div>
            <div className="attestation-line">
              <span>Merkle root</span>
              <strong>{attestation?.root ? truncate(attestation.root) : "Pending"}</strong>
            </div>
            <div className="attestation-line">
              <span>Leaf count</span>
              <strong>{attestation?.leafCount ?? 0}</strong>
            </div>
            <div className="attestation-line">
              <span>Anchor ready</span>
              <strong>{attestation?.anchorReady ? "YES" : "PREVIEW"}</strong>
            </div>
          </div>
        </Panel>
      </div>

      <div className="terminal-grid terminal-grid-secondary">
        <Panel
          title="Market Depth"
          subtitle="Order-book style view of the highest-priced primitives"
          actions={<span className="badge">TOP {topPrimitives.length}</span>}
        >
          <div className="market-depth-list">
            {topPrimitives.map((primitive: PrimitiveRow, index: number) => {
              const width = clamp((Number(primitive.priceLgu || 0) / Math.max(topPrimitives[0]?.priceLgu || 1, 1)) * 100, 12, 100)
              return (
                <button key={primitive.id} className="market-depth-row" onClick={() => setSelectedSymbol(primitive.symbol)}>
                  <span className="depth-rank">#{primitive.rank ?? index + 1}</span>
                  <span className="depth-symbol">{primitive.symbol}</span>
                  <span className="depth-bar"><i style={{ width: `${width}%` }} /></span>
                  <span className="depth-price">{formatMoney(primitive.priceLgu)}</span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel
          title="Oracle Runs"
          subtitle="Historical pricing checkpoints with hashes and signatures"
          actions={<Link className="badge badge-link" href="/oracle/runs">OPEN LEDGER</Link>}
        >
          <div className="runs-list">
            {runs.slice(0, 5).map((run: OracleRun) => (
              <div key={run.id} className="run-row">
                <div>
                  <strong>{truncate(run.id, 10, 5)}</strong>
                  <span>{formatTime(run.startedAt)}</span>
                </div>
                <div>
                  <strong>{run.status}</strong>
                  <span>{run.primitiveCount ?? 0} primitives</span>
                </div>
                <div>
                  <strong>{truncate(run.runHash || "")}</strong>
                  <span>{run.signature ? "SIGNED" : "PENDING"}</span>
                </div>
              </div>
            ))}
            {!runs.length ? <div className="empty-state">No oracle runs yet.</div> : null}
          </div>
        </Panel>
      </div>

      <div className="terminal-grid terminal-grid-secondary">
        <Panel
          title="Historical Price Ledger"
          subtitle="Latest public oracle ledger entries with primitive snapshots"
          actions={<Link className="badge badge-link" href="/dashboard">OPEN DASHBOARD</Link>}
        >
          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Primitives</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 6).map((entry: LedgerEntry) => (
                  <tr key={entry.runId}>
                    <td>{truncate(entry.runId, 10, 5)}</td>
                    <td>{entry.status}</td>
                    <td>{formatTime(entry.timestamp)}</td>
                    <td>{entry.primitiveCount}</td>
                    <td>{truncate(entry.runHash || "")}</td>
                  </tr>
                ))}
                {!ledger.length ? (
                  <tr>
                    <td className="empty-state" colSpan={5}>
                      No ledger entries yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Selected Letter History"
          subtitle={`Historical pricing for ${selectedSymbol}`}
          actions={<span className="badge">{historyLoading ? "SYNCING" : history.length ? `${history.length} points` : "NO DATA"}</span>}
        >
          <Sparkline values={selectedHistoryValues.length ? selectedHistoryValues : [0]} />
          <div className="history-grid">
            {history.slice(-6).reverse().map((point: HistoryPoint) => (
              <div key={`${point.at}`} className="history-row">
                <span>{formatTime(point.at)}</span>
                <strong>{formatMoney(point.priceLgu)}</strong>
                <em>{formatPercent(point.change24h)}</em>
              </div>
            ))}
            {!history.length ? <div className="empty-state">Tap a letter to see its historical price path.</div> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
