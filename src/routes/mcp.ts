import { createFileRoute } from "@tanstack/react-router";
import { ApiError, stringifyJson } from "@/lib/agentApi";
import { callAgentTool, listMcpTools } from "@/lib/mcpTools";

/**
 * MicroRadicle MCP server — stateless streamable-HTTP, hand-rolled
 * minimal JSON-RPC (no MCP SDK in the dep tree). Supports initialize,
 * ping, tools/list, and tools/call over POST; the tools are the same
 * handlers the REST API uses (src/lib/mcpTools.ts). No auth, no sessions:
 * GET/DELETE are rejected with 405 since there is no server-initiated
 * stream to open.
 */

const PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = { name: "microradicle", title: "MicroRadicle Agent API", version: "1.0.0" };

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

function rpcResult(id: unknown, result: unknown): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: unknown, code: number, message: string): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function isNotification(msg: JsonRpcRequest): boolean {
  return msg.id === undefined || msg.id === null;
}

function handleMessage(msg: JsonRpcRequest): Record<string, unknown> | null {
  if (!msg || typeof msg !== "object" || typeof msg.method !== "string") {
    return rpcError(msg?.id, -32600, "Invalid request: expected a JSON-RPC object with a method.");
  }
  const method = msg.method;
  const params = (msg.params ?? {}) as Record<string, unknown>;

  if (method.startsWith("notifications/")) return null; // accepted, no reply

  switch (method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : PROTOCOL_VERSION;
      return rpcResult(msg.id, {
        protocolVersion: requested,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "MicroRadicle farm engines for agents. feed_calculate analyzes a poultry ration (nutrient panel, costs, warnings) with the Feed Studio engine; variety_search and variety_get query the 266-record cultivar library. Free, no key. The same tools are plain REST under /api — see /openapi.json and /llms.txt.",
      });
    }
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, { tools: listMcpTools() });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args =
        params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)
          ? (params.arguments as Record<string, unknown>)
          : {};
      if (!name) return rpcError(msg.id, -32602, "tools/call requires params.name.");
      try {
        const result = callAgentTool(name, args);
        const structured = result && typeof result === "object" && !Array.isArray(result) ? result : undefined;
        return rpcResult(msg.id, {
          content: [{ type: "text", text: stringifyJson(result) }],
          ...(structured ? { structuredContent: structured } : {}),
          isError: false,
        });
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Tool call failed.";
        return rpcResult(msg.id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    case "resources/list":
      return rpcResult(msg.id, { resources: [] });
    case "prompts/list":
      return rpcResult(msg.id, { prompts: [] });
    default:
      return rpcError(msg.id, -32601, `Method not found: ${method}`);
  }
}

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const text = await request.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return new Response(stringifyJson(rpcError(null, -32700, "Parse error: body must be valid JSON.")), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        }

        const messages = (Array.isArray(parsed) ? parsed : [parsed]) as JsonRpcRequest[];
        const responses: Array<Record<string, unknown>> = [];
        for (const msg of messages) {
          const res = handleMessage(msg);
          // Notifications (no id) never get a response, per JSON-RPC.
          if (res !== null && !isNotification(msg)) responses.push(res);
        }

        if (responses.length === 0) {
          return new Response(null, { status: 202 });
        }
        const payload = Array.isArray(parsed) ? responses : responses[0];
        return new Response(stringifyJson(payload), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
      GET: async () =>
        new Response(
          stringifyJson({
            error: "This MCP endpoint is stateless and speaks JSON-RPC over POST only; there is no GET stream.",
          }),
          { status: 405, headers: { "content-type": "application/json; charset=utf-8", allow: "POST" } },
        ),
      DELETE: async () =>
        new Response(stringifyJson({ error: "Stateless MCP endpoint — no session to delete." }), {
          status: 405,
          headers: { "content-type": "application/json; charset=utf-8", allow: "POST" },
        }),
    },
  },
});
