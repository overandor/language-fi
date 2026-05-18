# Privacy-First Session Tracking Guide

## Overview

Language.fi implements anonymous session tracking with optional wallet linking to capture usage signals while maintaining privacy compliance and user trust.

## Architecture

### Privacy-First Principles

**What We Do:**
- Track anonymous session IDs (UUIDs)
- Capture usage events (quotes, searches, explorations)
- Allow optional wallet linking with explicit consent
- Provide clear privacy notices

**What We Don't Do:**
- Browser fingerprinting
- Cross-site tracking without consent
- Silent wallet identification
- IP-to-wallet correlation
- Hidden correlation techniques

## Database Schema

### Session Model

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionId    String   @unique // UUID from cookie
  walletAddress String?  // Optional wallet linking (explicit consent only)
  userAgent    String?  // For analytics, not identification
  createdAt    DateTime @default(now())
  lastActiveAt DateTime @default(now())
  
  events       Event[]
}
```

### Event Model

```prisma
model Event {
  id        String   @id @default(cuid())
  sessionId String
  type      String   // "quote", "explore", "search", "stake_preview"
  payload   Json     // Flexible event data
  createdAt DateTime @default(now())
  
  session   Session  @relation(fields: [sessionId], references: [id])
}
```

## API Endpoints

### Create Session

**POST /api/session/create**

Creates an anonymous session with a UUID.

```typescript
const response = await fetch('/api/session/create', { method: 'POST' })
const { sessionId } = await response.json()
```

Response sets `sessionId` cookie (httpOnly, secure in production, 30-day expiry).

### Track Event

**POST /api/events**

Tracks user events for analytics.

```typescript
await fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'quote',
    payload: { length: 42, characters: ['A', 'I', 'G', 'P', 'U'] }
  })
})
```

Event types:
- `quote` - Sentence valuation
- `explore` - Primitive exploration
- `search` - Search queries
- `stake_preview` - Staking simulation

### Link Wallet (Optional)

**POST /api/session/link-wallet**

Links wallet to session with explicit consent only.

```typescript
await fetch('/api/session/link-wallet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: '0x123...'
  })
})
```

Rules:
- User must click connect button
- No silent linking
- Prevents re-linking already linked sessions

## Usage Examples

### Frontend Integration

```typescript
// Create session on page load
useEffect(() => {
  fetch('/api/session/create')
}, [])

// Track quote event
function onQuote(sentence: string) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'quote',
      payload: { sentence, length: sentence.length }
    })
  })
}

// Link wallet on user action
function onConnectWallet(walletAddress: string) {
  fetch('/api/session/link-wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet: walletAddress })
  })
}
```

### Analytics Queries

**Conversion Rate:**

```typescript
const totalSessions = await prisma.session.count()
const sessionsWithWallet = await prisma.session.count({
  where: { walletAddress: { not: null } }
})
const conversionRate = sessionsWithWallet / totalSessions
```

**Popular Primitives Before Wallet:**

```typescript
const quoteEvents = await prisma.event.findMany({
  where: { type: 'quote' },
  include: { session: true }
})

const anonymousQuotes = quoteEvents.filter(e => !e.session.walletAddress)
```

## Oracle Integration

### Web2 Signal Weighting

```typescript
const web2Weight = 0.05 // 5% weight, non-dominant

// Calculate signal from anonymous events
const signal = calculateWeb2Signal(anonymousEvents)

// Combine with onchain data
const finalScore = (onchainScore * 0.95) + (signal * 0.05)
```

**Why Small Weight?**
- Easier to manipulate than onchain data
- Less reliable than exchange data
- Provides early demand signal without dominance

## Privacy Compliance

### GDPR/CCPA Alignment

**Data Minimization:**
- Only collect necessary data (sessionId, events)
- No personal identifiers by default
- Wallet only with explicit consent

**User Control:**
- Clear privacy notice
- Opt-in wallet linking
- Cookie-based session management

**Transparency:**
- Documented data usage
- Clear purpose (protocol improvement)
- No hidden tracking

### Privacy Notice

The UI includes a clear notice:

> "We collect anonymous usage data to improve the protocol. Wallet connection is optional and only used to link activity when you choose to connect."

## Security Considerations

### Session Security

- httpOnly cookies prevent XSS access
- Secure flag in production
- 30-day expiry balances persistence with privacy
- UUID format prevents enumeration

### Wallet Linking Security

- Explicit user action required
- Ethereum address validation (regex)
- Prevents re-linking attacks
- Server-side validation

### Data Protection

- No IP-to-wallet correlation
- No browser fingerprinting
- No cross-site tracking
- Session isolation

## Analytics Use Cases

### Demand Signals

Track which primitives show demand before wallet connection:

```typescript
// Find primitives with high anonymous interest
const highDemand = await prisma.event.groupBy({
  by: ['type'],
  where: { 
    type: 'quote',
    session: { walletAddress: null }
  },
  _count: true
})
```

### Conversion Analysis

Understand which features drive wallet connection:

```typescript
const quoteToWallet = await prisma.event.findMany({
  where: { type: 'quote' },
  include: { session: true }
}).filter(e => e.session.walletAddress)
```

### Oracle Edge

Early demand signals before capital enters:

```typescript
// Example: Heavy "AI", "GPU", "TOKEN" usage
// Later: Those primitives show staking demand
// Signal: Early demand indicator
```

## Best Practices

### DO

- Use anonymous sessions by default
- Provide clear privacy notices
- Require explicit consent for wallet linking
- Use small weights for Web2 signals
- Document data usage clearly

### DON'T

- Attempt browser fingerprinting
- Track across sites without consent
- Try to "guess" wallet identity
- Link IP addresses to wallets
- Use hidden correlation techniques
- Give Web2 signals high oracle weight

## Troubleshooting

### Session Not Creating

Check:
- Cookie is enabled in browser
- API endpoint is accessible
- Database connection is working

### Events Not Tracking

Check:
- Session cookie exists
- Event type is valid
- Payload structure is correct

### Wallet Linking Fails

Check:
- Wallet address format is valid (0x + 40 hex chars)
- Session exists
- Session not already linked

## Next Steps

1. Run database migration:
   ```bash
   npx prisma migrate dev --name add_session_tracking
   ```

2. Add PrivacyNotice component to layout:
   ```tsx
   import { PrivacyNotice } from '@/components/PrivacyNotice'
   ```

3. Test session creation and event tracking

4. Implement analytics dashboard for conversion metrics

5. Add Web2 signal weighting to oracle (small weight)

## Legal Review

This implementation should be reviewed by qualified legal counsel before production use to ensure compliance with:
- GDPR (EU)
- CCPA (California)
- Other regional privacy regulations

The current design follows privacy-by-design principles but requires legal validation for your specific jurisdiction.
