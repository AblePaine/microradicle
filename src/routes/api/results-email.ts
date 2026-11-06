import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse } from "@/lib/agentApi";
import { getSql } from "@/lib/db";

/**
 * POST /api/results-email — store an "email me these results" request.
 *
 * Body: { email, surface, snapshot } where snapshot is the caller's
 * results object. The request is written to `results_email_requests`
 * (migration 0001). The response says `delivery: "pending"` because
 * that is true at store time: the drain job (send leg, live
 * 2026-11-06 — POST /api/results-email/drain) sends within a few
 * minutes and marks the row sent (migration 0002).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SNAPSHOT_CHARS = 20_000;

export const Route = createFileRoute("/api/results-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return jsonResponse({ error: "invalid_json" }, 400);
          }
          const { email, surface, snapshot } = (body ?? {}) as {
            email?: unknown;
            surface?: unknown;
            snapshot?: unknown;
          };
          if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
            return jsonResponse({ error: "invalid_email" }, 400);
          }
          if (typeof surface !== "string" || !surface || surface.length > 64) {
            return jsonResponse({ error: "invalid_surface" }, 400);
          }
          if (
            typeof snapshot !== "object" ||
            snapshot === null ||
            Array.isArray(snapshot)
          ) {
            return jsonResponse({ error: "invalid_snapshot" }, 400);
          }
          const snapshotJson = JSON.stringify(snapshot);
          if (snapshotJson.length > MAX_SNAPSHOT_CHARS) {
            return jsonResponse({ error: "snapshot_too_large" }, 400);
          }
          const sql = await getSql();
          await sql.query(
            "insert into results_email_requests (email, surface, snapshot) values ($1, $2, $3::jsonb)",
            [email.trim(), surface, snapshotJson],
          );
          return jsonResponse({ ok: true, stored: true, delivery: "pending" });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
