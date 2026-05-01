"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function OracleRunDetailPage({
  params
}: {
  params: { id: string }
}) {
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verification, setVerification] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/oracle/runs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setRun(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const verifyRun = async () => {
    setVerifying(true)
    try {
      const res = await fetch(`/api/oracle/runs/${params.id}/verify`, {
        method: "POST"
      })
      const data = await res.json()
      setVerification(data.data)
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold">Language.fi</Link>
            <div className="flex space-x-4">
              <Link href="/oracle/runs" className="px-4 py-2 text-gray-300 hover:text-white">
                All Runs
              </Link>
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">Oracle Run Detail</h1>
        
        {loading ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">Loading oracle run details...</p>
            </div>
          </div>
        ) : !run ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">Oracle run not found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Run ID</p>
                  <p className="font-mono text-sm">{run.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    run.status === "completed" ? "bg-green-900 text-green-300" :
                    run.status === "running" ? "bg-yellow-900 text-yellow-300" :
                    "bg-red-900 text-red-300"
                  }`}>
                    {run.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Started At</p>
                  <p>{new Date(run.startedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Completed At</p>
                  <p>{run.completedAt ? new Date(run.completedAt).toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Formula Version</p>
                  <p>{run.formulaVersion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Run Hash</p>
                  <p className="font-mono text-sm">{run.runHash || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Previous Run Hash</p>
                  <p className="font-mono text-sm">{run.previousRunHash || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Signature</p>
                  <p className="font-mono text-sm">{run.signature ? "Present" : "None"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Source Count</p>
                  <p>{run.sourceCount}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Observation Count</p>
                  <p>{run.observationCount}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Primitive Count</p>
                  <p>{run.primitiveCount}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Error Count</p>
                  <p>{run.errorCount}</p>
                </div>
              </div>
            </div>

            {run.inputSnapshot && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Input Snapshot</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Source Data Hash</p>
                    <p className="font-mono text-sm">{run.inputSnapshot.sourceDataHash || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Timestamp</p>
                    <p>{run.inputSnapshot.timestamp || "N/A"}</p>
                  </div>
                </div>
                {run.inputSnapshot.sourceWeights && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm mb-2">Source Weights</p>
                    <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto max-h-40">
                      {JSON.stringify(run.inputSnapshot.sourceWeights, null, 2)}
                    </pre>
                  </div>
                )}
                {run.inputSnapshot.primitiveCounts && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm mb-2">Primitive Counts</p>
                    <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto max-h-40">
                      {JSON.stringify(run.inputSnapshot.primitiveCounts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Verification</h2>
              <button
                onClick={verifyRun}
                disabled={verifying}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {verifying ? "Verifying..." : "Verify Run"}
              </button>
              {verification && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Verified</p>
                    <p className={verification.verified ? "text-green-400" : "text-red-400"}>
                      {verification.verified ? "✓ Valid" : "✗ Invalid"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Hash Valid</p>
                    <p className={verification.hashValid ? "text-green-400" : "text-red-400"}>
                      {verification.hashValid ? "✓ Valid" : "✗ Invalid"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Signature Valid</p>
                    <p className={verification.signatureValid ? "text-green-400" : "text-red-400"}>
                      {verification.signatureValid ? "✓ Valid" : "✗ Invalid"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Verification Time</p>
                    <p>{new Date(verification.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {run.notes && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <p className="text-gray-300">{run.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
