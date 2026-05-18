"use client"
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function joinWaitlist() {
    setStatus("loading")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.status === "queued" || data.status === "already_queued") {
        setStatus("success")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-[#ffd21e] mb-4">Language.fi Private Beta</h1>
        <p className="text-gray-400 mb-6">
          Join the waitlist for early access to the primitive derivatives protocol.
        </p>
        
        {status === "success" ? (
          <div className="text-center">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-400 mb-2">You're on the list!</h3>
            <p className="text-gray-400">We'll send you an invite code when it's your turn.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#121826] border border-[#1f2937] rounded-lg px-4 py-3 text-white"
            />
            <Button 
              onClick={joinWaitlist}
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? "Joining..." : "Join Waitlist"}
            </Button>
            {status === "error" && (
              <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
