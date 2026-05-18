"use client"
import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

export function TradePanel() {
  const [side, setSide] = useState<"long"|"short">("long")
  const [primitive, setPrimitive] = useState("A")
  const [size, setSize] = useState(10)
  const [price, setPrice] = useState(0.12)

  async function submit() {
    await fetch("/api/markets/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primitive,
        side,
        size,
        price
      })
    })
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold text-[#ffd21e] mb-4">Trade Panel</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-2">Side</label>
          <div className="flex gap-2">
            <Button 
              variant={side === "long" ? "primary" : "secondary"}
              onClick={() => setSide("long")}
              className="flex-1"
            >
              Long
            </Button>
            <Button 
              variant={side === "short" ? "primary" : "secondary"}
              onClick={() => setSide("short")}
              className="flex-1"
            >
              Short
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">Primitive</label>
          <input
            type="text"
            value={primitive}
            onChange={(e) => setPrimitive(e.target.value)}
            className="w-full bg-[#121826] border border-[#1f2937] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">Size</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full bg-[#121826] border border-[#1f2937] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full bg-[#121826] border border-[#1f2937] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <Button onClick={submit} className="w-full">
          Submit Order
        </Button>
      </div>
    </Card>
  )
}
