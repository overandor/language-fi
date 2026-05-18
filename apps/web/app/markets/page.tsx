import { OrderBook } from "@/components/trading/order-book"
import { TradePanel } from "@/components/trading/trade-panel"
import { MarketFeed } from "@/components/trading/market-feed"

export default function Markets() {
  return (
    <div className="p-6 bg-[#0b0f19] min-h-screen">
      <h1 className="text-3xl font-bold text-[#ffd21e] mb-6">Primitive Markets</h1>
      <div className="grid grid-cols-3 gap-6">
        <OrderBook />
        <TradePanel />
        <MarketFeed />
      </div>
    </div>
  )
}
