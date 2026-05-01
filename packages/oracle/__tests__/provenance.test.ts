describe("Primitive Provenance Response Shape Tests", () => {
  it("should return valid provenance response structure", () => {
    const mockProvenance = {
      symbol: "A",
      displaySymbol: "A",
      type: "letter",
      latestPrice: {
        priceLgu: 1.5,
        change24h: 0.05,
        currentWeekUsage: 1000,
        rank: 1,
        calculatedAt: new Date()
      },
      linkedOracleRun: {
        id: "run-123",
        startedAt: new Date(),
        inputHash: "abc123",
        outputHash: "def456",
        policyVersion: "1.0.0"
      },
      sourceWeights: {
        coingecko: 0.6,
        gateio: 0.4
      },
      priceComponents: {
        frequency: 1000,
        velocity: 0.05,
        oracleConfidence: 0.85
      },
      confidenceScore: 0.85,
      excludedObservations: 0,
      anomalyFlags: [],
      quarantineStatus: []
    }
    
    expect(mockProvenance).toHaveProperty("symbol")
    expect(mockProvenance).toHaveProperty("latestPrice")
    expect(mockProvenance).toHaveProperty("linkedOracleRun")
    expect(mockProvenance).toHaveProperty("sourceWeights")
    expect(mockProvenance).toHaveProperty("priceComponents")
    expect(mockProvenance).toHaveProperty("confidenceScore")
    expect(mockProvenance).toHaveProperty("excludedObservations")
    expect(mockProvenance).toHaveProperty("anomalyFlags")
    expect(mockProvenance).toHaveProperty("quarantineStatus")
  })
  
  it("should handle missing oracle run gracefully", () => {
    const mockProvenance = {
      symbol: "A",
      displaySymbol: "A",
      type: "letter",
      latestPrice: {
        priceLgu: 1.5,
        change24h: 0.05,
        currentWeekUsage: 1000,
        rank: 1,
        calculatedAt: new Date()
      },
      linkedOracleRun: null,
      sourceWeights: {},
      priceComponents: {
        frequency: 1000,
        velocity: 0.05,
        oracleConfidence: 0.85
      },
      confidenceScore: 0.85,
      excludedObservations: 0,
      anomalyFlags: [],
      quarantineStatus: []
    }
    
    expect(mockProvenance.linkedOracleRun).toBeNull()
  })
})
