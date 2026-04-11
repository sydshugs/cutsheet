/**
 * Standardized error responses. Never expose internal details to the client.
 */

import type { VercelResponse } from "@vercel/node";

export type ErrorCode =
  | 'RATE_LIMITED'
  | 'AUTH_REQUIRED'
  | 'INVALID_INPUT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'ANALYSIS_FAILED'
  | 'GENERATION_FAILED'
  | 'CREDIT_REQUIRED'
  | 'FEATURE_LOCKED'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

const USER_MESSAGES: Record<ErrorCode, string> = {
  RATE_LIMITED: "You're moving fast — try again in a minute.",
  AUTH_REQUIRED: "Please log in to continue.",
  INVALID_INPUT: "Something's off with that input. Check the file and try again.",
  FILE_TOO_LARGE: "That file is too large. Max size is 500MB.",
  UNSUPPORTED_FORMAT: "That file format isn't supported. Try MP4, MOV, JPG, or PNG.",
  ANALYSIS_FAILED: "Our analysis engine hit a snag. Try again — if it keeps happening, try a different file.",
  GENERATION_FAILED: "Generation didn't work this time. Try again in a moment.",
  CREDIT_REQUIRED: "This feature requires credits. Check your plan for details.",
  FEATURE_LOCKED: "This feature is available on Pro. Upgrade to unlock it.",
  TIMEOUT: "That took too long. Try a shorter video or smaller file.",
  INTERNAL_ERROR: "Something went wrong on our end. We're looking into it.",
};

export function apiError(
  res: VercelResponse,
  code: ErrorCode,
  status: number = 500,
  internalDetail?: string
) {
  if (internalDetail) {
    console.error(`[${code}] ${internalDetail}`);
  }

  return res.status(status).json({
    error: code,
    message: USER_MESSAGES[code],
  });
}
