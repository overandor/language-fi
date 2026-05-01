import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold">Language.fi</h1>
            <div className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-white">
                Dashboard
              </Link>
              <Link href="/markets" className="text-gray-300 hover:text-white">
                Markets
              </Link>
              <Link href="/waitlist" className="text-gray-300 hover:text-white">
                Waitlist
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">
            Protocol-Grade Symbolic Asset Oracle
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Deterministic pricing from real data sources
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Real Data Ingestion</h3>
              <p className="text-gray-400">
                10,000+ cryptocurrencies from CoinGecko, Gate.io, and DEX sources
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Deterministic Pricing</h3>
              <p className="text-gray-400">
                Multi-factor formula with entropy, velocity, and correlation
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Oracle Engine</h3>
              <p className="text-gray-400">
                Audit trail with reproducible calculations
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
