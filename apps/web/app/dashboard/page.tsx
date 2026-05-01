/**
 * Dashboard Page
 * Displays primitive prices with clean empty states
 */

import { prisma } from "@languagefi/db";

async function getPrimitives() {
  const data = await prisma.primitivePrice.findMany({
    orderBy: { priceLgu: "desc" },
    include: {
      primitive: true,
    },
    take: 100,
  });

  if (!data.length) {
    return { status: "empty", message: "No primitive prices calculated" };
  }

  return {
    status: "success",
    data: data.map((p) => ({
      id: p.id,
      symbol: p.primitive.symbol,
      displaySymbol: p.primitive.displaySymbol,
      type: p.primitive.type,
      priceLgu: p.priceLgu,
      change24h: p.change24h,
      currentWeekUsage: p.currentWeekUsage,
      rank: p.rank,
      calculatedAt: p.calculatedAt,
    })),
  };
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-6xl mb-4">📊</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default async function Dashboard() {
  const result = await getPrimitives();

  if (result.status === "empty") {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No primitive prices calculated"
          description="Configure data sources to begin ingestion and run the oracle to calculate prices."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Language.fi Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.data.map((p: any) => (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">{p.displaySymbol}</span>
              <span className="text-sm text-gray-500">#{p.rank}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Price (LGU)</span>
                <span className="font-semibold">{p.priceLgu.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">24h Change</span>
                <span className={p.change24h && p.change24h >= 0 ? "text-green-600" : "text-red-600"}>
                  {p.change24h ? `${p.change24h.toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Usage</span>
                <span className="font-semibold">{p.currentWeekUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="text-sm capitalize">{p.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
