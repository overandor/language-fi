import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ""
})

export async function enqueue(job: string, payload: any) {
  await redis.lpush(`queue:${job}`, JSON.stringify(payload))
}

export async function dequeue(job: string) {
  const item = await redis.rpop(`queue:${job}`)
  return item ? JSON.parse(item) : null
}

export async function getQueueLength(job: string) {
  return await redis.llen(`queue:${job}`)
}
