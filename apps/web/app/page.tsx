"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"landing" | "llm" | "registry" | "snapshots">("landing")
  const [sentence, setSentence] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [primitives, setPrimitives] = useState<any[]>([])
  const [loadingPrimitives, setLoadingPrimitives] = useState(false)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [loadingSnapshots, setLoadingSnapshots] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState("")
  const [creatingSnapshot, setCreatingSnapshot] = useState(false)

  const analyzeSentence = async () => {
    if (!sentence.trim()) return
    setAnalyzing(true)
    try {
      const response = await fetch("/api/llm/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Analysis error:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const fetchPrimitives = async () => {
    setLoadingPrimitives(true)
    try {
      const response = await fetch("/api/primitives/public")
      const data = await response.json()
      setPrimitives(data.data || [])
    } catch (error) {
      console.error("Primitives fetch error:", error)
    } finally {
      setLoadingPrimitives(false)
    }
  }

  useEffect(() => {
    if (activeTab === "registry") {
      fetchPrimitives()
    }
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold">Language.fi</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("landing")}
                className={`px-4 py-2 rounded ${activeTab === "landing" ? "bg-blue-600" : "text-gray-300 hover:text-white"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("llm")}
                className={`px-4 py-2 rounded ${activeTab === "llm" ? "bg-blue-600" : "text-gray-300 hover:text-white"}`}
              >
                AI Analysis
              </button>
              <button
                onClick={() => setActiveTab("registry")}
                className={`px-4 py-2 rounded ${activeTab === "registry" ? "bg-blue-600" : "text-gray-300 hover:text-white"}`}
              >
                Registry
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === "landing" && (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Linguistic Primitive Oracle
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Pricing 43 linguistic primitives from real usage data with reproducible oracle runs
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Real Data Ingestion</h3>
                <p className="text-gray-400">
                  Multiple data sources: Gate.io, DexScreener, Solana RPC
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Deterministic Pricing</h3>
                <p className="text-gray-400">
                  Published formula with cryptographic verification
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Reproducible Oracle</h3>
                <p className="text-gray-400">
                  Same input always produces same output with verifiable hash
                </p>
              </div>
            </div>
            
            <div className="mt-12">
              <button
                onClick={() => setActiveTab("llm")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold mr-4"
              >
                Try AI Analysis
              </button>
              <button
                onClick={() => setActiveTab("registry")}
                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Browse Registry
              </button>
            </div>
          </div>
        )}

        {activeTab === "llm" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">AI Sentence Analysis</h2>
            <p className="text-gray-400 mb-8">
              Analyze sentences using AI to understand primitive composition and estimated value
            </p>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Enter a sentence to analyze..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white resize-none h-32"
              />
              <button
                onClick={analyzeSentence}
                disabled={analyzing || !sentence.trim()}
                className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {analyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {result && (
              <div className="mt-6 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400">Primitive Composition:</p>
                    <pre className="mt-2 text-sm bg-gray-900 p-4 rounded overflow-auto">
                      {JSON.stringify(result.primitives, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-gray-400">Estimated Value:</p>
                    <p className="text-2xl font-bold text-green-400">{result.estimatedValue} LGU</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "registry" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Primitive Registry</h2>
            <p className="text-gray-400 mb-8">
              Browse and explore the 43 linguistic primitives with current pricing
            </p>
            
            {loadingPrimitives ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading primitives...</p>
              </div>
            ) : primitives.length > 0 ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {primitives.map((primitive) => (
                    <div key={primitive.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">
                          {primitive.displaySymbol === " " ? "SPACE" : primitive.displaySymbol}
                        </span>
                        <span className="text-green-400 font-semibold">
                          {primitive.priceLgu ? primitive.priceLgu.toFixed(6) : "0.000000"} LGU
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>Type: {primitive.type}</div>
                        <div>Usage: {primitive.currentWeekUsage || 0}</div>
                        {primitive.change24h && (
                          <div className={primitive.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                            Change: {primitive.change24h >= 0 ? "+" : ""}{primitive.change24h.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No primitives found. Run the oracle to generate pricing.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
