/**
 * Oracle Ledger API
 * Public ledger of historical oracle runs with verification data
 */

import { prisma } from "@languagefi/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get historical oracle runs with verification data
    const runs = await prisma.oracleRun.findMany({
      where: { status: "completed" },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        sourceCount: true,
        observationCount: true,
        primitiveCount: true,
        errorCount: true,
        notes: true,
        formulaVersion: true,
        previousRunHash: true,
        runHash: true,
        inputSnapshot: true,
        signature: true,
      },
    });

    // Get primitive prices for each run
    const ledger = await Promise.all(
      runs.map(async (run: {
        id: string;
        startedAt: Date;
        completedAt: Date | null;
        status: string;
        formulaVersion: string | null;
        sourceCount: number | null;
        observationCount: number | null;
        primitiveCount: number | null;
        errorCount: number | null;
        notes: string | null;
        previousRunHash: string | null;
        runHash: string | null;
        inputSnapshot: string | null;
        signature: string | null;
      }) => {
        const prices = await prisma.primitivePrice.findMany({
          where: {
            calculatedAt: {
              gte: run.startedAt,
              lte: run.completedAt || new Date(),
            },
          },
          include: {
            primitive: true,
          },
          orderBy: { rank: "asc" },
        });

        return {
          runId: run.id,
          timestamp: run.startedAt.toISOString(),
          completedAt: run.completedAt?.toISOString() ?? null,
          status: run.status,
          formulaVersion: run.formulaVersion,
          sourceCount: run.sourceCount,
          observationCount: run.observationCount,
          primitiveCount: run.primitiveCount,
          errorCount: run.errorCount,
          notes: run.notes,
          previousRunHash: run.previousRunHash,
          runHash: run.runHash,
          inputSnapshot: run.inputSnapshot ? JSON.parse(run.inputSnapshot) : null,
          signature: run.signature,
          primitivePrices: prices.map((p: {
            primitive: { symbol: string; displaySymbol: string; type: string };
            priceLgu: number;
            rank: number | null;
            currentWeekUsage: number | null;
          }) => ({
            symbol: p.primitive.symbol,
            displaySymbol: p.primitive.displaySymbol,
            type: p.primitive.type,
            priceLgu: p.priceLgu,
            rank: p.rank,
            currentWeekUsage: p.currentWeekUsage,
          })),
        };
      })
    );

    // Get total count for pagination
    const totalCount = await prisma.oracleRun.count({
      where: { status: "completed" },
    });

    return NextResponse.json({
      ledger,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Oracle ledger API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch oracle ledger" },
      { status: 500 }
    );
  }
}
