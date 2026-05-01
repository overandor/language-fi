"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function PrimitiveProvenancePage({
  params
}: {
  params: { symbol: string }
}) {
  const [provenance, setProvenance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/explorer/${params.symbol}/provenance`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setProvenance(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [params.symbol])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold">Language.fi</Link>
            <div className="flex space-x-4">
              <Link href="/explorer" className="px-4 py-2 text-gray-300 hover:text-white">
                Explorer
              </Link>
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">
          Primitive Provenance: {params.symbol.toUpperCase()}
        </h1>
        <p className="text-gray-400 mb-8">
          Traceability and verification for this primitive
        </p>

        {loading ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">Loading provenance data...</p>
            </div>
          </div>
        ) : !provenance ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">No provenance data available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Primitive Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Symbol</p>
                  <p className="font-bold">{provenance.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Display Symbol</p>
                  <p className="font-bold">{provenance.displaySymbol}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p>{provenance.type}</p>
                </div>
              </div>
            </div>

            {provenance.latestPrice && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Latest Price</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Price (LGU)</p>
                    <p className="text-2xl font-bold text-green-400">{provenance.latestPrice.priceLgu?.toFixed(6) || "0.000000"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">24h Change</p>
                    <p className={provenance.latestPrice.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                      {provenance.latestPrice.change24h >= 0 ? "+" : ""}{provenance.latestPrice.change24h?.toFixed(2) || "0.00"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Weekly Usage</p>
                    <p>{provenance.latestPrice.currentWeekUsage?.toLocaleString() || "0"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Rank</p>
                    <p>#{provenance.latestPrice.rank || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Calculated At</p>
                    <p>{provenance.latestPrice.calculatedAt ? new Date(provenance.latestPrice.calculatedAt).toLocaleString() : "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {provenance.linkedOracleRun && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Linked Oracle Run</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Run ID</p>
                    <p className="font-mono text-sm">{provenance.linkedOracleRun.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Started At</p>
                    <p>{new Date(provenance.linkedOracleRun.startedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Formula Version</p>
                    <p>{provenance.linkedOracleRun.formulaVersion || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Run Hash</p>
                    <p className="font-mono text-sm">{provenance.linkedOracleRun.runHash || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Previous Run Hash</p>
                    <p className="font-mono text-sm">{provenance.linkedOracleRun.previousRunHash || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Signature</p>
                    <p>{provenance.linkedOracleRun.signature ? "Present" : "None"}</p>
                  </div>
                </div>
              </div>
            )}

            {provenance.sourceWeights && Object.keys(provenance.sourceWeights).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Source Weights</h2>
                <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(provenance.sourceWeights, null, 2)}
                </pre>
              </div>
            )}

            {provenance.priceComponents && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Price Components</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Frequency</p>
                    <p>{provenance.priceComponents.frequency?.toLocaleString() || "0"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Velocity</p>
                    <p>{provenance.priceComponents.velocity?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Oracle Confidence</p>
                    <p>{(provenance.priceComponents.oracleConfidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Confidence Score</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Overall Confidence</p>
                  <p className="text-2xl font-bold">{(provenance.confidenceScore * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Excluded Observations</p>
                  <p>{provenance.excludedObservations}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Anomaly Flags</p>
                  <p>{provenance.anomalyFlags.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
