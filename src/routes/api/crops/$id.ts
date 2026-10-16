import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, getVarietyById, jsonResponse } from "@/lib/agentApi";

/** One cultivar record by id, e.g. /api/crops/tomato-cherokee-purple. */
export const Route = createFileRoute("/api/crops/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          return jsonResponse(getVarietyById(params.id));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
