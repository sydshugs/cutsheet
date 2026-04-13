// waitlistService.ts — Client for /api/waitlist (no auth — public endpoint)

/** Submit an email to the early-access waitlist. */
export async function submitWaitlist(email: string): Promise<void> {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error("Something went wrong — try again.");
  }
}
