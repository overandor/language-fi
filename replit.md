# Language.fi — Language is Liquidity

## Overview

DeFi protocol concept site where every letter, number, and space is a live API-served primitive with an oracle price. Sentences become staked baskets of those character primitives.

pnpm workspace monorepo using TypeScript. Two artifacts: React+Vite frontend and Express API server.

## Architecture

### Frontend — `artifacts/language-fi/` (port 21659, previewPath `/`)
- React + Vite + Tailwind (geomorphic dark theme: `#05050A` bg, `#38BDF8` electric blue, `#A3E635` neon green)
- Fonts: Space Grotesk (headings), Inter (body), IBM Plex Mono (data)
- Router: wouter
- Pages: `/` (HomePage), `/explorer`, `/leaderboard`, `/stake` (3 tabs), `/primitives`, `/primitives/:symbol`, `/letter/:letter`

### API Server — `artifacts/api-server/` (port 8080, proxied via `/api/*`)
Key endpoints in `src/routes/letters.ts`:
- `GET /api/primitives` — all A-Z, 0-9, SPACE, symbol primitives with oracle price, rank, confidence
- `GET /api/primitives/:symbol` — full oracle detail: oracle_sources (5 weighted), gateio_tokens, weekly_market, settlement_proofs, price_breakdown
- `GET /api/letters` — letter grid data (A-Z + SPACE)
- `GET /api/letter/:letter` — letter detail stats
- `GET /api/protocol-breakdown/:letter` — oracle source breakdown
- `POST /api/stake-sentence` — stake with character_performance, diversity_multiplier, spam_score
- `POST /api/staking/sentence-score` — full staking score per spec (diversity, anti-spam, top_contributors)
- `POST /api/calculate-sentence-price` — grouped char price breakdown + minting fee
- `POST /api/sentences/quote` — grouped sentence quote
- `POST /api/transfer-sentence` — hard/vaulted transfer simulation
- `GET /api/sentence-leaderboard` — top staked sentences
- `GET /api/space-price`, `GET /api/settlements`

No database — all data is generated/randomized server-side with 5-minute cache.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
