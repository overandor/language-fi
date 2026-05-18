import { z } from "zod"

const Env = z.object({
  GATEIO_API_BASE: z.string().default("https://api.gateio.ws/api/v4")
})

export async function fetchGateTokens() {
  try {
    const { GATEIO_API_BASE } = Env.parse(process.env)
    const res = await fetch(`${GATEIO_API_BASE}/spot/currencies`)
    if (!res.ok) throw new Error("Gate fetch failed")
    const data = await res.json()
    return data.map((c: any) => ({
      source: "gateio",
      protocol: "exchange",
      objectType: "token",
      objectId: c.currency,
      textValue: c.currency,
      observedAt: new Date(),
      windowStart: new Date(),
      windowEnd: new Date()
    }))
  } catch (e) {
    console.error("gate error", e)
    return []
  }
}
