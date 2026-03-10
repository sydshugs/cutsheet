# Rate Limiting — Share Feature

Documentation for the share link rate limiting implementation in Cutsheet.

## Overview

To prevent abuse of the share link feature, Cutsheet implements a rate limit:
- **Limit**: 10 shares per hour
- **Scope**: Per browser (localStorage-based)
- **Reset**: Automatic after 1 hour from first share

---

## Current Implementation (Client-Side)

### How It Works

1. **Before creating a share**:
   - Check localStorage for share count in the last hour
   - If count ≥ 10, show error message with reset time
   - If count < 10, allow share creation

2. **After successful share**:
   - Increment the share count in localStorage
   - Track timestamp for automatic reset

3. **Reset behavior**:
   - If 1 hour has passed since the first share, reset count to 0
   - User can continue sharing

### Technical Details

**File**: `src/utils/rateLimiter.ts`

**Functions**:
```typescript
checkShareLimit(): { allowed: boolean; remaining: number; resetAt: Date }
incrementShareCount(): void
getRemainingShares(): number
getResetTime(): Date
resetShareLimit(): void
```

**Storage Key**: `cutsheet-share-limit`

**Data Structure**:
```typescript
{
  timestamp: number,  // First share timestamp in window
  count: number       // Number of shares in current window
}
```

---

## User Experience

### Normal Flow
1. User clicks "Share Link"
2. Share is created successfully
3. Link is copied to clipboard
4. Toast notification: "Link copied to clipboard"

### Rate Limit Hit
1. User clicks "Share Link" (11th time in an hour)
2. Share is blocked
3. Error toast: "Share limit reached (10/hour). Resets at 3:45 PM"
4. No share is created
5. User must wait until reset time

---

## UI Components

### Success Toast
- Green/white background
- "Link copied to clipboard" message
- Auto-dismisses after 3 seconds

### Error Toast
- Red background (#FF4444 with transparency)
- Shows rate limit message with reset time
- Auto-dismisses after 5 seconds

---

## Limitations (Client-Side)

### Can Be Bypassed By:
- Clearing browser localStorage
- Using incognito/private mode
- Switching browsers
- Switching devices

### Does Not Protect Against:
- Distributed attacks
- Automated bots (without localStorage)
- Malicious users determined to abuse

---

## Production Upgrade (Server-Side)

For production deployments, upgrade to IP-based rate limiting using Supabase Edge Functions.

### Why Upgrade?

**Client-side (current)**:
- ❌ Can be bypassed by clearing localStorage
- ❌ Not IP-based
- ❌ No cross-device enforcement
- ✅ No backend required
- ✅ Immediate feedback

**Server-side (recommended)**:
- ✅ IP-based tracking (harder to bypass)
- ✅ Cross-device enforcement
- ✅ Database-backed (persistent)
- ✅ Can block VPNs/proxies
- ❌ Requires backend setup
- ❌ Additional API call overhead

### Implementation Steps

See `SUPABASE_SETUP.md` for detailed server-side implementation guide.

**Quick summary**:
1. Add `created_by_ip` column to `analyses` table
2. Create Supabase Edge Function to capture client IP
3. Check rate limit in Edge Function before inserting
4. Return 429 status code if limit exceeded
5. Update client to call Edge Function instead of direct insert

---

## Testing Rate Limit

### Manual Test
1. Create 10 shares in quick succession
2. On the 11th attempt, you should see the rate limit error
3. Wait 1 hour (or clear localStorage) to reset

### Quick Reset (Development)
```javascript
// In browser console:
localStorage.removeItem('cutsheet-share-limit');
```

Or use the utility function:
```typescript
import { resetShareLimit } from './utils/rateLimiter';
resetShareLimit();
```

### Programmatic Test
```typescript
import { checkShareLimit, incrementShareCount } from './utils/rateLimiter';

// Simulate 10 shares
for (let i = 0; i < 10; i++) {
  incrementShareCount();
}

// Check limit
const { allowed, remaining, resetAt } = checkShareLimit();
console.log('Allowed:', allowed);        // false
console.log('Remaining:', remaining);    // 0
console.log('Resets at:', resetAt);      // Date object
```

---

## Configuration

To change the rate limit values, edit `src/utils/rateLimiter.ts`:

```typescript
const MAX_SHARES = 10;           // Change to desired limit
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
```

**Examples**:
- 5 shares per 30 minutes: `MAX_SHARES = 5`, `WINDOW_MS = 30 * 60 * 1000`
- 20 shares per 2 hours: `MAX_SHARES = 20`, `WINDOW_MS = 2 * 60 * 60 * 1000`
- 50 shares per day: `MAX_SHARES = 50`, `WINDOW_MS = 24 * 60 * 60 * 1000`

---

## Analytics

To track rate limit hits for monitoring:

```typescript
// In App.tsx handleShareLink:
if (!allowed) {
  // Log to analytics service
  analytics.track('Share Rate Limit Hit', {
    remaining,
    resetAt: resetAt.toISOString(),
  });
  
  setRateLimitError(`Share limit reached...`);
  return;
}
```

---

## Future Enhancements

### Potential Improvements
1. **Tiered limits** based on user type (free vs pro)
2. **Soft warnings** at 8/10 shares
3. **Grace period** for premium users
4. **Email verification** to increase limit
5. **Purchase additional shares** as add-on

### Pro Tier Example
```typescript
const MAX_SHARES = isPro ? 100 : 10;
```

---

## Troubleshooting

### "Share limit reached" but I haven't shared anything
- Check if localStorage is persisting from previous sessions
- Clear localStorage: `localStorage.removeItem('cutsheet-share-limit')`

### Rate limit not enforcing
- Check browser console for errors
- Verify `rateLimiter.ts` is imported correctly
- Ensure `incrementShareCount()` is called after successful share

### Reset time not updating
- The reset time is calculated from the **first share** in the window
- It doesn't reset until the full hour has passed
- Example: First share at 2:15 PM → resets at 3:15 PM (even if you only made 2 shares)

---

## References

- **Implementation**: `src/utils/rateLimiter.ts`
- **Integration**: `src/App.tsx` (handleShareLink function)
- **Server-side guide**: `SUPABASE_SETUP.md`
- **Database schema**: `supabase/analyses_table_with_ip.sql`
