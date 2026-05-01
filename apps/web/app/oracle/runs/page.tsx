"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function OracleRunsPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/oracle/runs")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setRuns(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold">Language.fi</Link>
            <div className="flex space-x-4">
              <Link href="/oracle/runs" className="px-4 py-2 bg-blue-600 rounded">
                Oracle Runs
              </Link>
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">Oracle Runs</h1>
        <p className="text-gray-400 mb-8">
          Historical oracle runs with cryptographic verification
        </p>

        {loading ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">Loading oracle runs...</p>
            </div>
          </div>
        ) : runs.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center py-12">
              <p className="text-gray-400">No oracle runs yet. Run the oracle to generate pricing data.</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Run ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Formula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Primitives</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Verified</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/oracle/runs/${run.id}`} className="text-blue-400 hover:text-blue-300">
                        {run.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        run.status === "completed" ? "bg-green-900 text-green-300" :
                        run.status === "running" ? "bg-yellow-900 text-yellow-300" :
                        "bg-red-900 text-red-300"
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {run.formulaVersion || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {run.primitiveCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {run.signature ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
