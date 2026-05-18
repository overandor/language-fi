import { prisma } from "@languagefi/db"

export async function validateApiKey(req: Request) {
  const key = req.headers.get("x-api-key")
  if (!key) throw new Error("Missing API key")
  const apiKey = await prisma.apiKey.findUnique({
    where: { key }
  })
  if (!apiKey) throw new Error("Invalid API key")
  return apiKey
}
