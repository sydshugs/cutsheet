import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email required" });
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
    return res.status(response.status).json(data);
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

  return res.status(200).json(data);
}
