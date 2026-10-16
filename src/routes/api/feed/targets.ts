import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, listFeedTargets } from "@/lib/agentApi";

/** Feed Studio life-stage target presets with their nutrient bands. */
export const Route = createFileRoute("/api/feed/targets")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonResponse(listFeedTargets());
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
