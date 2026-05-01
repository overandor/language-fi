import { prisma } from "@languagefi/db"
import crypto from "crypto"

export function hashSentence(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex")
}

export async function registerSentence(text: string, wallet: string) {
  const normalized = text.toUpperCase()
  const hash = hashSentence(normalized)
  return prisma.sentence.create({
    data: {
      sentenceHash: hash,
      normalizedText: normalized,
      ownerWallet: wallet,
      status: "active"
    }
  })
}

export async function transferSentence(
  sentenceId: string,
  from: string,
  to: string,
  txHash: string
) {
  const sentence = await prisma.sentence.findUnique({
    where: { id: sentenceId }
  })
  if (!sentence) throw new Error("Not found")
  if (sentence.ownerWallet !== from) {
    throw new Error("Not owner")
  }
  await prisma.registryTransfer.create({
    data: {
      sentenceId,
      fromWallet: from,
      toWallet: to,
      txHash,
      transferredAt: new Date(),
      transferStatus: "confirmed"
    }
  })
  return prisma.sentence.update({
    where: { id: sentenceId },
    data: {
      ownerWallet: to,
      lastMovedAt: new Date()
    }
  })
}
