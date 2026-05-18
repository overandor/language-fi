import React from 'react'
import { Card } from '../ui/card'

export function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-6">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-3xl font-bold text-[#ffd21e]">{value}</div>
    </Card>
  )
}
