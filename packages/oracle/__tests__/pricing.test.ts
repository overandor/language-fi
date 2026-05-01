import { calculatePrice, calculateEntropy, calculateCorrelation, DEFAULT_WEIGHTS } from "../pricing-formula"

describe("Pricing Formula Tests", () => {
  describe("calculatePrice", () => {
    it("should calculate price within valid range", () => {
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
      
      const price = calculatePrice(input, DEFAULT_WEIGHTS)
      expect(price).toBeGreaterThan(0)
      expect(price).toBeLessThan(1000)
    })

    it("should return minimum price for zero frequency", () => {
      const input = {
        frequency: 0,
        velocity: 0,
        acceleration: 0,
        sourceDiversity: 0,
        entropy: 0,
        correlation: 0,
        rarity: 0,
        timeWindow: 3600
      }
      
      const price = calculatePrice(input, DEFAULT_WEIGHTS)
      expect(price).toBe(0.0001) // MIN_PRICE
    })

    it("should apply time decay correctly", () => {
      const input1 = {
        frequency: 1000,
        velocity: 100,
        acceleration: 10,
        sourceDiversity: 5,
        entropy: 2.5,
        correlation: 0.8,
        rarity: 0.001,
        timeWindow: 3600
      }
      
      const input2 = {
        ...input1,
        timeWindow: 7200 // 2 hours
      }
      
      const price1 = calculatePrice(input1, DEFAULT_WEIGHTS)
      const price2 = calculatePrice(input2, DEFAULT_WEIGHTS)
      
      expect(price2).toBeLessThan(price1)
    })

    it("should be deterministic with same inputs", () => {
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

  describe("calculateEntropy", () => {
    it("should calculate entropy correctly", () => {
      const distribution = { A: 50, B: 30, C: 20 }
      const entropy = calculateEntropy(distribution)
      expect(entropy).toBeGreaterThan(0)
      expect(entropy).toBeLessThan(2) // Max entropy for 3 items is log2(3) ≈ 1.58
    })

    it("should return 0 for uniform distribution", () => {
      const distribution = { A: 100 }
      const entropy = calculateEntropy(distribution)
      expect(entropy).toBe(0)
    })

    it("should handle empty distribution", () => {
      const distribution = {}
      const entropy = calculateEntropy(distribution)
      expect(entropy).toBe(0)
    })
  })

  describe("calculateCorrelation", () => {
    it("should calculate correlation between two sources", () => {
      const values = [
        [1, 2, 3, 4, 5],
        [2, 4, 6, 8, 10]
      ]
      const correlation = calculateCorrelation(values)
      expect(correlation).toBeGreaterThan(0.9) // Perfect positive correlation
    })

    it("should return 0 for single source", () => {
      const values = [[1, 2, 3, 4, 5]]
      const correlation = calculateCorrelation(values)
      expect(correlation).toBe(0)
    })

    it("should handle negative correlation", () => {
      const values = [
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1]
      ]
      const correlation = calculateCorrelation(values)
      expect(correlation).toBeGreaterThan(0.9) // Absolute value
    })
  })
})
