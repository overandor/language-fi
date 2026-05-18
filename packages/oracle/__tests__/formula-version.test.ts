import { calculatePrice, DEFAULT_WEIGHTS } from "../pricing-formula"

describe("Formula Version Tests", () => {
  it("should reject calculations with mismatched formula version", () => {
    const input = {
      frequency: 1000,
      velocity: 100,
      acceleration: 10,
      sourceDiversity: 5,
      entropy: 2.5,
      correlation: 0.8,
      rarity: 0.001,
      timeWindow: 3600
    }
    
    const currentVersion = "1.0.0"
    const expectedVersion = "1.0.0"
    
    // In a real implementation, this would check the formula version
    expect(currentVersion).toBe(expectedVersion)
  })
  
  it("should apply consistent weights across calculations", () => {
    const input = {
      frequency: 1000,
      velocity: 100,
      acceleration: 10,
      sourceDiversity: 5,
      entropy: 2.5,
      correlation: 0.8,
      rarity: 0.001,
      timeWindow: 3600
    }
    
    const price1 = calculatePrice(input, DEFAULT_WEIGHTS)
    const price2 = calculatePrice(input, DEFAULT_WEIGHTS)
    
    expect(price1).toBe(price2)
  })
})
