import { createFileRoute } from "@tanstack/react-router";
import { ApiError, calculateTopOff, errorResponse, jsonResponse, topoffInputFromQuery } from "@/lib/agentApi";

/**
 * Greenhouse reservoir top-off math for agents — the same linear-blend
 * engine as the web greenhouse page. Stateless: the caller supplies the
 * reservoir's current volume + EC, a target EC, and the last mix recipe;
 * the endpoint returns the concentrate parts (or plain water) to add,
 * plus a dump-and-remix flag when the correction is extreme. pH is
 * accepted as context only — no pH dosing is computed.
 */
export const Route = createFileRoute("/api/greenhouse/calculate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          return jsonResponse(calculateTopOff(topoffInputFromQuery(url.searchParams)));
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
          return jsonResponse(calculateTopOff(body));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
