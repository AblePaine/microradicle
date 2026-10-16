import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, listFeedIngredients } from "@/lib/agentApi";

/** Feed Studio ingredient catalog — the ids ration lines reference. */
export const Route = createFileRoute("/api/feed/ingredients")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonResponse(listFeedIngredients());
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
