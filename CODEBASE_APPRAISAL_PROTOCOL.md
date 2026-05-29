# Codebase Appraisal Protocol

## Overview

This protocol defines a systematic methodology for appraising the monetary value of a software codebase folder. The appraisal estimates development cost replacement value, not market valuation.

## Phase 1: Codebase Analysis

### 1.1 Structure Assessment
- Identify project type (monorepo, single app, library, etc.)
- Count packages/modules and their relationships
- Assess build system complexity (Webpack, Vite, esbuild, etc.)
- Evaluate package manager setup (npm, pnpm, yarn workspaces)

### 1.2 Technology Stack Inventory
- List all frameworks and major libraries
- Note TypeScript/JavaScript configuration complexity
- Identify database integrations (ORM, migrations)
- Document API client generation (OpenAPI, GraphQL)
- Assess testing infrastructure presence

### 1.3 Code Quality Metrics
- Check for proper TypeScript configuration (strict mode, project references)
- Evaluate custom utilities (fetch wrappers, auth handling)
- Assess schema definitions (DB, API contracts)
- Review component/library structure
- Identify configuration completeness

## Phase 2: Component Valuation

### 2.1 Infrastructure Layer ($8,000 - $12,000 baseline)
**Monorepo Setup**: $2,000 - $3,000
- Workspace configuration
- TypeScript project references
- Shared dependency management
- Build orchestration

**API Client Generation**: $2,000 - $3,000
- OpenAPI spec maintenance
- Orval/ similar tooling config
- React Query / SWR integration
- Zod schema generation

**Database Layer**: $2,000 - $3,000
- ORM setup (Drizzle, Prisma, etc.)
- Migration system
- Schema definitions
- Connection pooling

**Custom Utilities**: $2,000 - $3,000
- Fetch wrappers with auth
- Error handling
- Response parsing
- Base URL management

### 2.2 Frontend Implementation ($2,000 - $8,000)
**Basic Setup**: $2,000 - $4,000
- Framework initialization
- Routing configuration
- State management setup
- Styling system (Tailwind, CSS modules)

**Component Library**: $0 - $2,000
- UI component integration (shadcn/ui, MUI, etc.)
- Custom components
- Design system implementation
- Responsive layouts

**Advanced Features**: $0 - $2,000
- Real-time updates (WebSockets)
- Charts/visualizations
- Wallet integrations
- Complex forms

### 2.3 Backend Implementation ($500 - $3,000)
**Basic Server**: $500 - $1,000
- Express/Fastify setup
- Route structure
- Middleware configuration
- Health checks

**Business Logic**: $0 - $1,000
- API endpoint implementations
- Data processing
- Validation
- Error handling

**Advanced Features**: $0 - $1,000
- Caching layer
- Background jobs
- Authentication/authorization
- Rate limiting

### 2.4 Concept & Documentation ($5,000 - $15,000)
**Specification Quality**: $3,000 - $8,000
- API documentation completeness
- Architecture diagrams
- Data flow documentation
- Edge case coverage

**Novelty Factor**: $2,000 - $7,000
- Unique concept differentiation
- Market gap identification
- Innovation potential
- Competitive analysis

## Phase 3: Deduction Assessment

### 3.1 Incompleteness Penalties
**Empty Schemas**: -$2,000 - $5,000
- No database tables defined
- Missing API contracts
- Incomplete type definitions

**Mock Data**: -$1,000 - $3,000
- Randomized data instead of real integration
- No external API connections
- Placeholder implementations

**Missing Integrations**: -$1,000 - $3,000
- No blockchain/web3 connections
- No payment processing
- No authentication provider
- No production deployment config

**Documentation Gaps**: -$500 - $2,000
- Missing README
- No setup instructions
- Unclear architecture
- No contribution guidelines

### 3.2 Technical Debt
**Outdated Dependencies**: -$500 - $2,000
- Security vulnerabilities
- Deprecated frameworks
- End-of-life libraries

**Code Quality Issues**: -$500 - $2,000
- Inconsistent patterns
- Lack of error handling
- No type safety
- Poor separation of concerns

**Testing Gaps**: -$500 - $2,000
- No unit tests
- No integration tests
- No E2E tests
- No test coverage

## Phase 4: Market Potential Multiplier

### 4.1 Novelty Assessment
**Breakthrough (2.0x)**: Radical innovation, no direct competitors
**Novel (1.5x - 1.8x)**: Unique approach, differentiated value prop
**Incremental (1.2x - 1.4x)**: Improvement on existing concepts
**Commodity (1.0x)**: Common pattern, many alternatives

### 4.2 Market Fit Indicators
**Strong Fit (+0.3x)**: Clear user need, validated demand
**Moderate Fit (+0.1x)**: Potential need, requires validation
**Uncertain Fit (0x)**: Unproven market, experimental
**Weak Fit (-0.2x)**: Limited addressable market

### 4.3 Execution Risk
**Low Risk (+0.2x)**: Proven team, clear roadmap
**Moderate Risk (0x)**: Standard complexity, manageable
**High Risk (-0.3x)**: Technical challenges, resource intensive

## Phase 5: Final Calculation

### Formula
```
Base Value = Infrastructure + Frontend + Backend + Documentation
Deductions = Incompleteness + Technical Debt
Adjusted Base = Base Value - Deductions
Multiplier = Novelty × Market Fit × (1 - Execution Risk)
Final Value = Adjusted Base × Multiplier
```

### Value Ranges
**Conservative**: Base value only, 1.0x multiplier
**Realistic**: Adjusted base, moderate multiplier (1.2x - 1.5x)
**Optimistic**: Full potential, high multiplier (1.5x - 2.0x)

## Phase 6: Report Generation

### Required Sections
1. **Executive Summary**: Overall value range in one paragraph
2. **Value Breakdown**: Detailed component-by-component valuation
3. **Deductions**: Specific penalties with rationale
4. **Market Analysis**: Multiplier justification
5. **Final Range**: Conservative, realistic, optimistic estimates
6. **Disclaimer**: Clarify this is development cost, not market valuation

### Output Format
```markdown
## Estimated Value: $X - $Y

### Value Breakdown
- **Component Name**: $Range
  - Rationale

### Deductions
- **Issue Name**: -$Range
  - Rationale

### Market Potential Multiplier
- **Factor**: X.x
  - Rationale

### Final Range
- **Conservative**: $X
- **Realistic**: $Y
- **Optimistic**: $Z
```

## Assumptions & Limitations

1. **Developer Rate**: Assumes $100-$150/hour senior developer rate
2. **Time Estimates**: Based on typical development velocity
3. **Market Value**: Not a replacement for professional valuation
4. **Context Dependent**: Value varies by team, timeline, and use case
5. **Non-Commercial**: Excludes brand, user base, revenue, IP legal status

## Usage Guidelines

1. Use for internal planning, budgeting, or acquisition due diligence
2. Combine with professional valuation for financial decisions
3. Re-run appraisal after significant codebase changes
4. Consider team expertise when applying estimates
5. Adjust rates based on local market conditions

## Example Application

See [CODEBASE_APPRAISAL_EXAMPLE.md](./CODEBASE_APPRAISAL_EXAMPLE.md) for a worked example using this protocol on the Language.fi project.
