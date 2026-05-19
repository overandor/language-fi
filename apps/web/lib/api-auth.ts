export async function validateApiKey(req: Request) {
  const key = req.headers.get("x-api-key")
  if (!key) throw new Error("Missing API key")
  // Stub: apiKey model not yet in schema
  return { id: "stub", key, plan: "free", limit: 1000, usage: 0 }
}
