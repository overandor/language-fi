/**
 * Sentence Quote API Route
 * Calculates value of a sentence based on primitive prices
 */

import { prisma } from "@languagefi/db";
import { countCharacters } from "@languagefi/core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text?.toUpperCase();

    if (!text) {
      return NextResponse.json(
        { error: "Invalid input: text is required" },
        { status: 400 }
      );
    }

    const counts = countCharacters(text);
    let total = 0;
    const breakdown: Array<{
      char: string;
      count: number;
      status?: string;
      unitPrice?: number;
      total?: number;
    }> = [];

    for (const [char, count] of Object.entries(counts.counts)) {
      const primitive = await prisma.primitive.findUnique({
        where: { symbol: char },
      });

      if (!primitive) {
        breakdown.push({
          char,
          count,
          status: "unavailable",
        });
        continue;
      }

      const price = await prisma.primitivePrice.findFirst({
        where: { primitiveId: primitive.id },
        orderBy: { calculatedAt: "desc" },
      });

      if (!price) {
        breakdown.push({
          char,
          count,
          status: "no_price",
        });
        continue;
      }

      const value = price.priceLgu * count;
      total += value;

      breakdown.push({
        char,
        count,
        unitPrice: price.priceLgu,
        total: value,
      });
    }

    return NextResponse.json({
      total,
      breakdown,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Sentence quote API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate sentence quote" },
      { status: 500 }
    );
  }
}
