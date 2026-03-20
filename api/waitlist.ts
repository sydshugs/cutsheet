import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { setCorsHeaders } from "./_lib/auth";

// 5 signups per IP per hour
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "3600 s"),
  analytics: false,
  prefix: "cutsheet:waitlist",
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  const rl = await ratelimit.limit(ip);
  if (!rl.success) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const response = await fetch("https://app.loops.so/api/v1/contacts/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      source: "landing-page-waitlist",
      userGroup: "waitlist",
    }),
  });

  const data = await response.json();
  const alreadyExists = data?.message?.includes("already");
  if (!response.ok && !alreadyExists) {
    return res.status(500).json({ error: "Could not process signup" });
  }

  try {
    await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        transactionalId: "cmmnyrn350n2s0izsaf08nqkp",
        email,
      }),
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }

  return res.status(200).json({ success: true });
}
