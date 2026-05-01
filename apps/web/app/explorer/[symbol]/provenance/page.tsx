import Link from "next/link"

export default function PrimitiveProvenancePage({
  params
}: {
  params: { symbol: string }
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold">Language.fi</Link>
            <div className="flex space-x-4">
              <Link href="/explorer" className="px-4 py-2 text-gray-300 hover:text-white">
                Explorer
              </Link>
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">
          Primitive Provenance: {params.symbol.toUpperCase()}
        </h1>
        <p className="text-gray-400 mb-8">
          Traceability and verification for this primitive
        </p>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-gray-400">Loading provenance data...</p>
          </div>
        </div>
      </main>
    </div>
  )
}
