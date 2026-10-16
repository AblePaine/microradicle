import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, searchVarieties } from "@/lib/agentApi";

/**
 * Cultivar library search — free-text q plus category / frost / family
 * filters, paginated with limit + offset. Full records, same data the
 * succession engine plans from.
 */
export const Route = createFileRoute("/api/crops/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sp = new URL(request.url).searchParams;
          return jsonResponse(
            searchVarieties({
              q: sp.get("q") ?? sp.get("query") ?? undefined,
              category: sp.get("category") ?? undefined,
              frost: sp.get("frost") ?? undefined,
              family: sp.get("family") ?? undefined,
              limit: sp.get("limit") ?? undefined,
              offset: sp.get("offset") ?? undefined,
            }),
          );
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
