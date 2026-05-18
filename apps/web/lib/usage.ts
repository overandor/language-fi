import { prisma } from "@languagefi/db"

export async function trackUsage(apiKeyId: string, endpoint: string, cost: number) {
  await prisma.apiUsage.create({
    data: {
      apiKeyId,
      endpoint,
      cost
    }
  })
}
