import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, searchSeedVarieties } from "@/lib/agentApi";

/**
 * Seed & Variety Explorer search — free-text q plus crop-group /
 * maturity-band / documented-resistance filters, paginated with
 * limit + offset. Slim records; fetch /api/varieties/{slug} for the
 * full record. Data: OpenPlantDB (CC0).
 */
export const Route = createFileRoute("/api/varieties/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sp = new URL(request.url).searchParams;
          return jsonResponse(
            searchSeedVarieties({
              q: sp.get("q") ?? sp.get("query") ?? undefined,
              group: sp.get("group") ?? undefined,
              band: sp.get("band") ?? undefined,
              resistant: sp.get("resistant") ?? undefined,
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
