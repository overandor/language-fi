import { NextResponse } from "next/server"
import { prisma } from "@languagefi/db"

export const dynamic = "force-dynamic"

const requiredEnvironment = ["DATABASE_URL", "NEXT_PUBLIC_APP_URL"]

export async function GET() {
  const startedAt = Date.now()
  const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key])
  let databaseStatus: "ok" | "error" = "ok"
  let databaseLatencyMs: number | null = null

  try {
    const dbStartedAt = Date.now()
    await prisma.$queryRaw`SELECT 1`
    databaseLatencyMs = Date.now() - dbStartedAt
  } catch (error) {
    databaseStatus = "error"
    console.error("Health check database failure:", error)
  }

  const ready = missingEnvironment.length === 0 && databaseStatus === "ok"

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      service: "language-fi-web",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      checks: {
        environment: {
          status: missingEnvironment.length === 0 ? "ok" : "missing",
          missing: missingEnvironment,
        },
        database: {
          status: databaseStatus,
          latencyMs: databaseLatencyMs,
        },
      },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
