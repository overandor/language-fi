"use client"
import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

export function LPDashboard() {
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  async function fetchPositions() {
    setLoading(true)
    try {
      const res = await fetch("/api/yield/positions?owner=0x...")
      const data = await res.json()
      setPositions(data.positions || [])
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }
  
  async function claimFees(positionId: string) {
    try {
      const res = await fetch("/api/yield/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId })
      })
      const data = await res.json()
      if (data.success) {
        await fetchPositions()
      }
    } catch (error) {
      console.error("Claim error:", error)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#ffd21e]">LP Dashboard</h2>
        <Button onClick={fetchPositions} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      
      {positions.length === 0 ? (
        <Card className="p-6 text-center text-gray-400">
          No active positions
        </Card>
      ) : (
        <div className="space-y-4">
          {positions.map((pos) => (
            <Card key={pos.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-[#ffd21e]">{pos.pool?.name}</h3>
                  <p className="text-sm text-gray-400">Liquidity: {pos.liquidity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Pending Fees</p>
                  <p className="text-lg font-bold text-[#ffd21e]">{pos.pendingFees || 0} LGU</p>
                </div>
              </div>
              <Button 
                onClick={() => claimFees(pos.id)}
                disabled={!pos.pendingFees}
                className="w-full"
              >
                Claim Fees
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
