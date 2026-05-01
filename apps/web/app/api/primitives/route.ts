/**
 * Primitives API Route
 * Returns current primitive prices from oracle
 * With API key validation and usage tracking
 */

import { prisma } from "@languagefi/db";
import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { trackUsage } from "@/lib/usage";
import { calculateCost, getPlanLimits } from "@languagefi/core/pricing";

export async function GET(req: Request) {
  try {
    // Validate API key
    const apiKey = await validateApiKey(req);
    
    // Check rate limits
    const planLimits = getPlanLimits(apiKey.plan as any);
    const currentUsage = await prisma.apiUsage.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (currentUsage >= planLimits.limit) {
      return NextResponse.json(
        {
          status: "error",
          message: "Rate limit exceeded. Upgrade your plan.",
        },
        { status: 429 }
      );
    }

    const data = await prisma.primitivePrice.findMany({
      orderBy: { priceLgu: "desc" },
      include: {
        primitive: true,
      },
      take: 100,
    });

    if (!data.length) {
      return NextResponse.json({
        status: "empty",
        message: "No primitive prices calculated yet. Configure data sources and run oracle.",
      });
    }

    // Track usage
    const cost = calculateCost(1, apiKey.plan as any);
    await trackUsage(apiKey.id, "/api/primitives", cost);

    return NextResponse.json({
      status: "success",
      data: data.map((p) => ({
        id: p.id,
        symbol: p.primitive.symbol,
        displaySymbol: p.primitive.displaySymbol,
        type: p.primitive.type,
        priceLgu: p.priceLgu,
        change24h: p.change24h,
        currentWeekUsage: p.currentWeekUsage,
        rank: p.rank,
        calculatedAt: p.calculatedAt,
      })),
      usage: {
        current: currentUsage + 1,
        limit: planLimits.limit,
        remaining: planLimits.limit - currentUsage - 1
      }
    });
  } catch (error: any) {
    console.error("Primitives API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to fetch primitive prices",
      },
      { status: error.message?.includes("API key") ? 401 : 500 }
    );
  }
}
