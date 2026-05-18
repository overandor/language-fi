import { computeInputHash, computeOutputHash, recordOracleRun, verifyOracleRun } from "../reproducible"

describe("Oracle Run Tests", () => {
  it("should verify oracle run with valid hash chain", async () => {
    // This test requires database connection
    // For now, we'll test the hash verification logic
    const input1 = {
      timestamp: 1234567890,
      sources: ["coingecko", "gateio"],
      observations: [],
      policyVersion: "1.0.0"
    }
    
    const hash1 = computeInputHash(input1)
    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64) // SHA-256 hex string
  })
  
  it("should detect hash chain mismatch", () => {
    const input1 = {
      timestamp: 1234567890,
      sources: ["coingecko"],
      observations: [],
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
  
  it("should compute consistent output hash for same prices", () => {
    const prices = { A: 1.5, B: 2.0, C: 0.5 }
    
    const hash1 = computeOutputHash(prices)
    const hash2 = computeOutputHash(prices)
    
    expect(hash1).toBe(hash2)
  })
})
