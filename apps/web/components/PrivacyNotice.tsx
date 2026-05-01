export function PrivacyNotice() {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-300 mb-2">
            We collect anonymous usage data to improve the protocol. Wallet connection is optional and only used to link activity when you choose to connect.
          </p>
          <div className="flex gap-2">
            <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
              Accept
            </button>
            <button className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
