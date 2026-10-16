import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/agentApi";
import { OPENAPI_SPEC } from "@/lib/openapi";

/** OpenAPI 3.1 document for the agent API (src/lib/openapi.ts). */
export const Route = createFileRoute("/openapi.json")({
  server: {
    handlers: {
      GET: async () => jsonResponse(OPENAPI_SPEC),
    },
  },
});
