import { createFileRoute } from "@tanstack/react-router";
import { ApiError, calculateFeed, errorResponse, feedInputFromQuery, jsonResponse } from "@/lib/agentApi";

/**
 * Feed Studio ration analysis for agents — same engine as the web UI.
 * POST a partial JSON ration (every field optional); GET takes the same
 * fields as query params with lines as ingredient_id:pct pairs.
 */
export const Route = createFileRoute("/api/feed/calculate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          return jsonResponse(calculateFeed(feedInputFromQuery(url.searchParams)));
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
          return jsonResponse(calculateFeed(body));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
