import { getSql } from "@/lib/db";
import { renderResultsEmail } from "./render";

/**
 * Send leg for "Email me these results" (capture plan; Brad's go
 * 2026-11-06). Stored requests in results_email_requests are drained
 * oldest-first through Resend: sent_at marks delivery, and attempts +
 * last error (migration 0002) give a retry cap and a paper trail. An
 * external scheduler (Pip's drain hook) pokes POST
 * /api/results-email/drain every few minutes; the function is safe to
 * call by hand for verification.
 */

const SITE_NAME = "MicroRadicle";
const SITE_URL = "https://www.microradicle.com";
const FROM = "MicroRadicle <results@microradicle.com>";
const UMAMI_HOST = "https://umami.epoxybench.com";
const UMAMI_WEBSITE_ID = "b2c899fa-6d7f-4348-afe0-f7a268bbb6d7"; // __root.tsx script tag
const MAX_ATTEMPTS = 5;
const BATCH_LIMIT = 25;

interface PendingRow {
  id: string;
  email: string;
  surface: string;
  snapshot: Record<string, unknown>;
}

export interface DrainSummary {
  processed: number;
  sent: number;
  failed: number;
}

/** The plan's results_email_sent metric — best-effort, never blocks delivery. */
async function fireSentEvent(surface: string): Promise<void> {
  try {
    await fetch(`${UMAMI_HOST}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "microradicle-results-drain/1.0",
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: UMAMI_WEBSITE_ID,
          name: "results_email_sent",
          data: { surface },
        },
      }),
    });
  } catch {
    /* analytics is best-effort; the email already went out */
  }
}

export async function drainResultsEmail(apiKey: string): Promise<DrainSummary> {
  const sql = await getSql();
  const rows = await sql.query<PendingRow>(
    `select id, email, surface, snapshot from results_email_requests
      where sent_at is null and send_attempts < $1
      order by created_at asc
      limit $2`,
    [MAX_ATTEMPTS, BATCH_LIMIT],
  );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const rendered = renderResultsEmail({
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      surface: row.surface,
      snapshot: row.snapshot,
    });
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [row.email],
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        }),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`resend ${res.status}: ${detail}`);
      }
      await sql.query(
        `update results_email_requests
            set sent_at = now(), send_attempts = send_attempts + 1,
                last_send_error = null
          where id = $1`,
        [row.id],
      );
      sent += 1;
      await fireSentEvent(row.surface);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "send_failed";
      await sql.query(
        `update results_email_requests
            set send_attempts = send_attempts + 1, last_send_error = $2
          where id = $1`,
        [row.id, message.slice(0, 500)],
      );
    }
  }
  return { processed: rows.length, sent, failed };
}
