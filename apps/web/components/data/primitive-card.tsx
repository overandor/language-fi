import React from 'react'
import { Card } from '../ui/card'

export function PrimitiveCard({ p }: { p: any }) {
  return (
    <Card className="p-4 hover:scale-105 transition-transform">
      <div className="text-2xl font-mono text-[#ffd21e]">{p.symbol}</div>
      <div className="mt-2 text-lg">
        {p.priceLgu ?? "Unavailable"}
      </div>
      <div className="text-sm text-gray-400">
        Rank #{p.rank ?? "-"}
      </div>
      <div
        className={`text-sm ${
          p.weeklyChange > 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {p.weeklyChange ?? "—"}
      </div>
    </Card>
  )
}
