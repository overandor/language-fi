import { prisma } from "@languagefi/db"

export async function validateApiKey(key: string) {
  if (!key) {
    throw new Error("API key required")
  }
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { key }
  })
  
  if (!apiKey) {
    throw new Error("Invalid API key")
  }
  
  if (!apiKey.active) {
    throw new Error("API key inactive")
  }
  
  if (apiKey.usage >= apiKey.limit) {
    throw new Error("Rate limit exceeded")
  }
  
  await prisma.apiKey.update({
    where: { key },
    data: { usage: { increment: 1 } }
  })
  
  return apiKey
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
