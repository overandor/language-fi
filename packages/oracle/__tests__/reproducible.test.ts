import { computeInputHash, computeOutputHash } from "../reproducible"

describe("Reproducible Oracle Tests", () => {
  describe("computeInputHash", () => {
    it("should generate consistent hash for same input", () => {
      const input = {
        timestamp: 1234567890,
        sources: ["coingecko", "gateio"],
        observations: [{ source: "coingecko", objectId: "BTC" }],
        policyVersion: "1.0.0"
      }
      
      const hash1 = computeInputHash(input)
      const hash2 = computeInputHash(input)
      
      expect(hash1).toBe(hash2)
    })

    it("should generate different hash for different input", () => {
      const input1 = {
        timestamp: 1234567890,
        sources: ["coingecko"],
        observations: [{ source: "coingecko", objectId: "BTC" }],
        policyVersion: "1.0.0"
      }
      
      const input2 = {
        ...input1,
        timestamp: 1234567891
      }
      
      const hash1 = computeInputHash(input1)
      const hash2 = computeInputHash(input2)
      
      expect(hash1).not.toBe(hash2)
    })

    it("should sort sources for deterministic hashing", () => {
      const input1 = {
        timestamp: 1234567890,
        sources: ["gateio", "coingecko"],
        observations: [],
        policyVersion: "1.0.0"
      }
      
      const input2 = {
        timestamp: 1234567890,
        sources: ["coingecko", "gateio"],
        observations: [],
        policyVersion: "1.0.0"
      }
      
      const hash1 = computeInputHash(input1)
      const hash2 = computeInputHash(input2)
      
      expect(hash1).toBe(hash2)
    })
  })

  describe("computeOutputHash", () => {
    it("should generate consistent hash for same prices", () => {
      const prices = { A: 1.5, B: 2.0, C: 0.5 }
      
      const hash1 = computeOutputHash(prices)
      const hash2 = computeOutputHash(prices)
      
      expect(hash1).toBe(hash2)
    })

    it("should sort symbols for deterministic hashing", () => {
      const prices1 = { C: 0.5, A: 1.5, B: 2.0 }
      const prices2 = { A: 1.5, B: 2.0, C: 0.5 }
      
      const hash1 = computeOutputHash(prices1)
      const hash2 = computeOutputHash(prices2)
      
      expect(hash1).toBe(hash2)
    })

    it("should generate different hash for different prices", () => {
      const prices1 = { A: 1.5, B: 2.0 }
      const prices2 = { A: 1.6, B: 2.0 }
      
      const hash1 = computeOutputHash(prices1)
      const hash2 = computeOutputHash(prices2)
      
      expect(hash1).not.toBe(hash2)
    })
  })
})
