"use client"
import { Card } from '../ui/card'

export function OrderBook() {
  // In production, this would fetch from API
  const data = {
    bids: [
      { price: 0.15, size: 100 },
      { price: 0.14, size: 250 },
      { price: 0.13, size: 500 },
    ],
    asks: [
      { price: 0.16, size: 200 },
      { price: 0.17, size: 300 },
      { price: 0.18, size: 400 },
    ]
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold text-[#ffd21e] mb-4">Order Book</h3>
      <div className="space-y-2">
        <div className="text-sm text-gray-400 mb-2">Bids (Long)</div>
        {data.bids.map((b, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-green-400">{b.price}</span>
            <span>{b.size}</span>
          </div>
        ))}
        <div className="text-sm text-gray-400 mt-4 mb-2">Asks (Short)</div>
        {data.asks.map((a, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-red-400">{a.price}</span>
            <span>{a.size}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
