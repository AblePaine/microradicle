import { createFileRoute } from "@tanstack/react-router";

import { drainResultsEmail } from "@/lib/results-email/drain";

/**
 * POST /api/results-email/drain — send stored "email me these results"
 * requests (see src/lib/results-email/drain.ts).
 *
 * Auth: `Authorization: Bearer <DRAIN_SECRET>`; the only caller is the
 * drain scheduler. Config: RESEND_API_KEY (sending) and DRAIN_SECRET
 * (auth) are both required — unset either one and the endpoint says so
 * with a 503 instead of half-working.
 */
async function post({ request }: { request: Request }): Promise<Response> {
  const secret = process.env.DRAIN_SECRET;
  if (!secret) {
    return Response.json({ error: "drain_not_configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "send_not_configured" }, { status: 503 });
  }
  try {
    const summary = await drainResultsEmail(apiKey);
    return Response.json({ ok: true, ...summary });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "drain_failed" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/results-email-drain")({
  server: { handlers: { POST: post } },
});
