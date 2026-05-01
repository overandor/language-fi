import { shouldQuarantine, SOURCE_TIERS } from "../anti-manipulation"

describe("Quarantine Tests", () => {
  it("should quarantine sources exceeding threshold", () => {
    const source = "coingecko"
    const anomalyCount = 5
    
    const result = shouldQuarantine(source, anomalyCount)
    expect(result).toBe(true)
  })
  
  it("should not quarantine sources below threshold", () => {
    const source = "coingecko"
    const anomalyCount = 3
    
    const result = shouldQuarantine(source, anomalyCount)
    expect(result).toBe(false)
  })
  
  it("should handle untrusted sources", () => {
    const source = "unknown-source"
    const anomalyCount = 0
    
    const result = shouldQuarantine(source, anomalyCount)
    expect(result).toBe(true)
  })
  
  it("should respect source quality tiers", () => {
    const trustedSource = "coingecko"
    const standardSource = "gateio"
    
    const trustedWeight = SOURCE_TIERS[trustedSource]?.weight
    const standardWeight = SOURCE_TIERS[standardSource]?.weight
    
    expect(trustedWeight).toBeGreaterThan(standardWeight || 0)
  })
})
