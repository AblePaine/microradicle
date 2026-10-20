import { createFileRoute } from "@tanstack/react-router";
import { ApiError, calculateHerdDueDate, errorResponse, herdInputFromQuery, jsonResponse } from "@/lib/agentApi";

/**
 * Herd packet due-date math for agents — the same arithmetic as the web
 * herd log. Stateless: the keeper's log records are web-only (browser
 * local storage) and are never sent here; this endpoint only adds a day
 * count to a date the caller supplies, plus the caller's own reminder
 * offsets. It returns dates, not advice.
 */
export const Route = createFileRoute("/api/herd/calculate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          return jsonResponse(calculateHerdDueDate(herdInputFromQuery(url.searchParams)));
        } catch (err) {
          return errorResponse(err);
        }
      },
      POST: async ({ request }) => {
        try {
          const text = await request.text();
          let body: unknown = {};
          if (text.trim()) {
            try {
              body = JSON.parse(text);
            } catch {
              throw new ApiError(400, "Request body must be valid JSON.");
            }
          }
          return jsonResponse(calculateHerdDueDate(body));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
