import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, getSeedVarietyBySlug, jsonResponse } from "@/lib/agentApi";

/** One full Variety Explorer record by slug, e.g. /api/varieties/amelia-tomato. */
export const Route = createFileRoute("/api/varieties/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          return jsonResponse(getSeedVarietyBySlug(params.slug));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
