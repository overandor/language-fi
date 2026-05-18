"use client"
import { Card } from '../ui/card'

export function MarketFeed() {
  // In production, this would fetch from API
  const trades = [
    { id: 1, primitive: "A", size: 100, price: 0.15, time: "10:30:00" },
    { id: 2, primitive: "B", size: 250, price: 0.08, time: "10:29:45" },
    { id: 3, primitive: "A", size: 50, price: 0.14, time: "10:29:30" },
  ]

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold text-[#ffd21e] mb-4">Market Feed</h3>
      <div className="space-y-2">
        {trades.map((trade) => (
          <div key={trade.id} className="flex justify-between text-sm border-b border-[#1f2937] pb-2">
            <span className="text-[#ffd21e]">{trade.primitive}</span>
            <span>{trade.size}</span>
            <span>{trade.price}</span>
            <span className="text-gray-400">{trade.time}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
