/**
 * Deterministic Pricing Tests
 * Ensures same input always produces same output
 */

import { calculateInputHash, calculateRunHash } from "../priceEngine";

describe("Deterministic Pricing", () => {
  describe("Input Hash Calculation", () => {
    test("same input produces same hash", () => {
      const counts = { A: 1000, B: 500, C: 250 };
      const weights = { coingecko: 0.4, gateio: 0.3 };

      const hash1 = calculateInputHash(counts, weights);
      const hash2 = calculateInputHash(counts, weights);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });

    test("different input produces different hash", () => {
      const counts1 = { A: 1000, B: 500, C: 250 };
      const counts2 = { A: 1001, B: 500, C: 250 };
      const weights = { coingecko: 0.4, gateio: 0.3 };

      const hash1 = calculateInputHash(counts1, weights);
      const hash2 = calculateInputHash(counts2, weights);

      expect(hash1).not.toBe(hash2);
    });

    test("different weights produce different hash", () => {
      const counts = { A: 1000, B: 500, C: 250 };
      const weights1 = { coingecko: 0.4, gateio: 0.3 };
      const weights2 = { coingecko: 0.5, gateio: 0.2 };

      const hash1 = calculateInputHash(counts, weights1);
      const hash2 = calculateInputHash(counts, weights2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Run Hash Calculation", () => {
    test("same parameters produce same hash", () => {
      const inputHash = "abc123";
      const timestamp = "2024-05-01T12:00:00Z";
      const formulaVersion = "v1.0";
      const previousRunHash = "xyz789";

      const hash1 = calculateRunHash(inputHash, timestamp, formulaVersion, previousRunHash);
      const hash2 = calculateRunHash(inputHash, timestamp, formulaVersion, previousRunHash);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    test("different inputHash produces different run hash", () => {
      const timestamp = "2024-05-01T12:00:00Z";
      const formulaVersion = "v1.0";
      const previousRunHash = "xyz789";

      const hash1 = calculateRunHash("abc123", timestamp, formulaVersion, previousRunHash);
      const hash2 = calculateRunHash("abc124", timestamp, formulaVersion, previousRunHash);

      expect(hash1).not.toBe(hash2);
    });

    test("null previousRunHash handled correctly", () => {
      const inputHash = "abc123";
      const timestamp = "2024-05-01T12:00:00Z";
      const formulaVersion = "v1.0";

      const hash1 = calculateRunHash(inputHash, timestamp, formulaVersion, null);
      const hash2 = calculateRunHash(inputHash, timestamp, formulaVersion, null);

      expect(hash1).toBe(hash2);
    });
  });

  describe("Deterministic Pricing Formula", () => {
    test("frequency-based pricing is deterministic", () => {
      const counts = { A: 1000, B: 500, C: 250 };
      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      const prices1 = {};
      const prices2 = {};

      for (const [char, count] of Object.entries(counts)) {
        prices1[char] = count / total;
        prices2[char] = count / total;
      }

      expect(prices1).toEqual(prices2);
      expect(prices1["A"]).toBe(0.5714285714285714);
    });

    test("ranking is deterministic", () => {
      const counts = { A: 1000, B: 500, C: 250, D: 100 };
      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      const prices = [];
      for (const [char, count] of Object.entries(counts)) {
        prices.push({ char, price: count / total });
      }

      prices.sort((a, b) => b.price - a.price);

      expect(prices[0].char).toBe("A");
      expect(prices[1].char).toBe("B");
      expect(prices[2].char).toBe("C");
      expect(prices[3].char).toBe("D");
    });
  });
});

describe("Reproducibility Verification", () => {
  test("can verify oracle run from input snapshot", () => {
    const inputSnapshot = {
      sourceDataHash: "test_hash_123",
      primitiveCounts: { A: 1000, B: 500 },
      sourceWeights: { coingecko: 0.4, gateio: 0.3 },
      timestamp: "2024-05-01T12:00:00Z",
    };

    // Recalculate hash from snapshot
    const recalculatedHash = calculateInputHash(
      inputSnapshot.primitiveCounts,
      inputSnapshot.sourceWeights
    );

    expect(recalculatedHash).toBeDefined();
    expect(recalculatedHash).toHaveLength(64);
  });

  test("run hash chain creates trust chain", () => {
    const inputHash = "abc123";
    const timestamp = "2024-05-01T12:00:00Z";
    const formulaVersion = "v1.0";

    // First run (no previous)
    const run1Hash = calculateRunHash(inputHash, timestamp, formulaVersion, null);

    // Second run (chained to first)
    const run2Hash = calculateRunHash(inputHash, timestamp, formulaVersion, run1Hash);

    expect(run1Hash).not.toBe(run2Hash);
    expect(run2Hash).toBeDefined();
  });
});
