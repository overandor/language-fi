import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/data/stat-card"

export default function ApiDashboard() {
  return (
    <div className="p-6 bg-[#0b0f19] min-h-screen">
      <h1 className="text-3xl font-bold text-[#ffd21e] mb-6">API Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Requests" value="12,442" />
        <StatCard title="Remaining" value="87,558" />
        <StatCard title="Cost This Month" value="$24.50" />
        <StatCard title="Plan" value="Pro" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-[#ffd21e] mb-4">Usage Over Time</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - integrate Recharts
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-[#ffd21e] mb-4">Top Endpoints</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>/api/primitives</span>
              <span className="text-[#ffd21e]">8,234</span>
            </div>
            <div className="flex justify-between">
              <span>/api/letters</span>
              <span className="text-[#ffd21e]">3,208</span>
            </div>
            <div className="flex justify-between">
              <span>/api/signals</span>
              <span className="text-[#ffd21e]">1,000</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
