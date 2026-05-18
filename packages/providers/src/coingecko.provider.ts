/**
 * CoinGecko Provider
 * Real API integration for token data
 * NO MOCKS - returns empty array on failure
 */

import { z } from "zod";

const envSchema = z.object({
  COINGECKO_API_BASE: z.string().default("https://api.coingecko.com/api/v3"),
  COINGECKO_API_KEY: z.string().optional(),
});

export interface Observation {
  source: string;
  protocol: string;
  objectType: string;
  objectId: string;
  textValue: string;
  observedAt: Date;
  windowStart: Date;
  windowEnd: Date;
}

/**
 * Fetch observations from CoinGecko API
 * Returns empty array on error (never fake data)
 */
export async function fetchCoinGeckoObservations(): Promise<Observation[]> {
  const env = envSchema.parse(process.env);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 minute window

  try {
    const headers: HeadersInit = {
      "Accept": "application/json",
    };

    if (env.COINGECKO_API_KEY) {
      headers["X-Cg-Pro-Api-Key"] = env.COINGECKO_API_KEY;
    }

    const url = `${env.COINGECKO_API_BASE}/coins/list`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`CoinGecko fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("CoinGecko returned invalid data format");
    }

    const observations: Observation[] = data.map((coin: any) => ({
      source: "coingecko",
      protocol: "coingecko",
      objectType: "token",
      objectId: coin.id,
      textValue: `${coin.symbol} ${coin.name}`,
      observedAt: now,
      windowStart,
      windowEnd: now,
    }));

    console.log(`CoinGecko: Fetched ${observations.length} observations`);
    return observations;
  } catch (e) {
    const error = e as Error;
    console.error("CoinGecko error:", error.message);
    return []; // Never fake data
  }
}

/**
 * Fetch CoinGecko market data for additional context
 */
export async function fetchCoinGeckoMarketData(limit: number = 100): Promise<Observation[]> {
  const env = envSchema.parse(process.env);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const headers: HeadersInit = {
      "Accept": "application/json",
    };

    if (env.COINGECKO_API_KEY) {
      headers["X-Cg-Pro-Api-Key"] = env.COINGECKO_API_KEY;
    }

    const url = `${env.COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`CoinGecko market data fetch failed: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("CoinGecko market data returned invalid format");
    }

    const observations: Observation[] = data.map((coin: any) => ({
      source: "coingecko",
      protocol: "coingecko",
      objectType: "token",
      objectId: coin.id,
      textValue: `${coin.symbol} ${coin.name} ${coin.category || ""}`,
      observedAt: now,
      windowStart,
      windowEnd: now,
    }));

    console.log(`CoinGecko Market: Fetched ${observations.length} observations`);
    return observations;
  } catch (e) {
    const error = e as Error;
    console.error("CoinGecko market data error:", error.message);
    return [];
  }
}
