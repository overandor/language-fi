import { prisma } from "@languagefi/db"

export async function validateApiKey(key: string) {
  const k = await prisma.apiKey.findUnique({ where: { key } })
  if (!k) throw new Error("Invalid key")
  if (k.usage >= k.limit) {
    throw new Error("Rate limit exceeded")
  }
  await prisma.apiKey.update({
    where: { key },
    data: { usage: { increment: 1 } }
  })
  return k
}
