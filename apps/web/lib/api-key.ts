export async function validateApiKey(key: string) {
  if (!key) {
    throw new Error("API key required")
  }
  // Stub: apiKey model not yet in schema
  return { key, active: true, usage: 0, limit: 10000 }
}

export function requireApiKey(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const key = req.headers.get("x-api-key")

    try {
      await validateApiKey(key || "")
      return handler(req)
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }
  }
}
