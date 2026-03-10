// rateLimiter.ts
// Client-side rate limiting for share feature

const STORAGE_KEY = "cutsheet-share-limit";
const MAX_SHARES = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ShareRecord {
  timestamp: number;
  count: number;
}

function getShareRecord(): ShareRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { timestamp: Date.now(), count: 0 };
    
    const record: ShareRecord = JSON.parse(stored);
    
    // Reset if window has passed
    if (Date.now() - record.timestamp > WINDOW_MS) {
      return { timestamp: Date.now(), count: 0 };
    }
    
    return record;
  } catch {
    return { timestamp: Date.now(), count: 0 };
  }
}

function saveShareRecord(record: ShareRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Silent fail if localStorage is unavailable
  }
}

export function checkShareLimit(): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const record = getShareRecord();
  const allowed = record.count < MAX_SHARES;
  const remaining = Math.max(0, MAX_SHARES - record.count);
  const resetAt = new Date(record.timestamp + WINDOW_MS);
  
  return { allowed, remaining, resetAt };
}

export function incrementShareCount(): void {
  const record = getShareRecord();
  record.count += 1;
  saveShareRecord(record);
}

export function getRemainingShares(): number {
  const record = getShareRecord();
  return Math.max(0, MAX_SHARES - record.count);
}

export function getResetTime(): Date {
  const record = getShareRecord();
  return new Date(record.timestamp + WINDOW_MS);
}

export function resetShareLimit(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent fail
  }
}
