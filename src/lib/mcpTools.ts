/**
 * Agent tool definitions — the single source of truth shared by the MCP
 * endpoint (src/routes/mcp.ts), the REST API, and the static manifest at
 * public/mcp-tools.json (generated from this module; keep them in step).
 */
import { ApiError, calculateFeed, calculateHerdDueDate, getVarietyById, searchVarieties } from "./agentApi.ts";

export interface AgentToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputDescription: string;
  http: {
    method: "GET" | "POST";
    path: string;
    example_body?: Record<string, unknown>;
    example_query?: string;
  };
}

const FEED_LINE_SCHEMA = {
  type: "object",
  properties: {
    ingredient_id: {
      type: "string",
      description:
        "Catalog ingredient id — see GET /api/feed/ingredients (corn, soybean-meal-44, wheat, oats, alfalfa-meal-17, fish-meal-65, limestone, oyster-shell, dicalcium-phosphate, salt, vitamin-mineral-premix). A custom ingredient is allowed if the line also carries a name and its nutrient values.",
    },
    pct: { type: "number", description: "Percent of the ration as mixed. Lines are expected to total 100; the engine computes on the actual total and warns when it drifts." },
    name: { type: "string", description: "Display name — required for custom (non-catalog) ingredients." },
    cp_pct: { type: "number", description: "Override: crude protein % for this line." },
    me_kcal_kg: { type: "number", description: "Override: metabolizable energy kcal/kg for this line." },
    lys_pct: { type: "number", description: "Override: lysine % for this line." },
    met_pct: { type: "number", description: "Override: methionine % for this line." },
    ca_pct: { type: "number", description: "Override: calcium % for this line." },
    total_p_pct: { type: "number", description: "Override: total phosphorus % for this line." },
    avail_p_pct: { type: "number", description: "Override: available phosphorus % for this line." },
    fiber_pct: { type: "number", description: "Override: crude fiber % for this line." },
    price_usd_per_lb: { type: "number", description: "Override: price $/lb for this line (defaults to the catalog price)." },
  },
  required: ["ingredient_id", "pct"],
};

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    name: "feed_calculate",
    description:
      "Analyze a poultry ration with the MicroRadicle Feed Studio engine: full nutrient panel (crude protein, ME kcal/kg, lysine, methionine, calcium, total + available phosphorus, fiber — each with an in/low/high state against the life-stage target band), Ca:P ratio, batch weigh-out with per-ingredient cost, cost per lb / per bird per day / per flock per day and week, and plain-language warnings (missing premix, salt out of band, methionine floor, fiber ceiling...). All inputs optional — omit lines entirely to analyze the built-in layer example ration.",
    inputSchema: {
      type: "object",
      properties: {
        target_id: {
          type: "string",
          enum: ["broiler-starter", "broiler-grower", "broiler-finisher", "pullet-starter", "pullet-grower", "layer-production"],
          description: "Life-stage target preset the ration is judged against. Default: layer-production.",
        },
        lines: {
          type: "array",
          items: FEED_LINE_SCHEMA,
          description: "Ration lines (ingredient + % of mix). Omit entirely for the built-in layer example ration.",
        },
        batch_lbs: { type: "number", description: "Batch size in lb for the weigh-out and cost math. Default: 100." },
        flock_size: { type: "number", description: "Birds fed, for flock cost per day/week. Default: 25." },
        intake_lb_per_day: { type: "number", description: "Feed intake per bird per day in lb. Default: the target preset's intake (0.24 for layers)." },
        target_overrides: {
          type: "object",
          description: "Per-nutrient band edits merged over the preset, keyed by nutrient (cp, me, lys, met, ca, total_p, avail_p, fiber); each value is { min: number, max: number | null }.",
        },
      },
    },
    outputDescription:
      "Returns { input (normalized ration), target (the effective life-stage bands incl. overrides), analysis: { total_pct, nutrients { cp, me, lys, met, ca, total_p, avail_p, fiber: { value, state } }, ca_to_p_ratio (null if infinite), salt_pct, premix_pct, batch [{ ingredient_id, name, lbs, cost_usd }], batch_cost_usd, cost_per_lb_usd, cost_per_bird_day_usd, flock_cost_day_usd, flock_cost_week_usd, warnings [{ nutrient, severity, message }] } }.",
    http: {
      method: "POST",
      path: "/feed/calculate",
      example_body: {
        target_id: "layer-production",
        lines: [
          { ingredient_id: "corn", pct: 63.2 },
          { ingredient_id: "soybean-meal-44", pct: 25.3 },
          { ingredient_id: "limestone", pct: 9 },
          { ingredient_id: "dicalcium-phosphate", pct: 1.5 },
          { ingredient_id: "salt", pct: 0.4 },
          { ingredient_id: "vitamin-mineral-premix", pct: 0.6 },
        ],
        batch_lbs: 100,
        flock_size: 25,
      },
      example_query: "target_id=layer-production&lines=corn:63.2,soybean-meal-44:25.3,limestone:9,dicalcium-phosphate:1.5,salt:0.4,vitamin-mineral-premix:0.6",
    },
  },
  {
    name: "herd_due_date",
    description:
      "Compute an expected due date from a breeding date plus a day count — the same arithmetic as the MicroRadicle herd log. Species presets pre-fill the common published average day count (cattle 283, sheep 147, goat 150, pig 114, poultry incubation 21); gestation_days overrides it with the keeper's own number. Optional reminders are the caller's own labels and offsets (anchored to the breeding date, the due date, or a custom date) and come back with their calendar dates. This is date arithmetic on caller-supplied entries only — it returns dates, not animal-care advice, and it suggests no intervals or schedules. The herd log itself is web-only: records live in the keeper's browser and are not accessible through this API.",
    inputSchema: {
      type: "object",
      properties: {
        species: {
          type: "string",
          enum: ["cattle", "sheep", "goat", "pig", "poultry", "other"],
          description: "Species preset for the day count. Omit to default to 283 days, or pair with gestation_days.",
        },
        breeding_date: { type: "string", description: "Breeding (or incubation-start) date, ISO YYYY-MM-DD. Required." },
        gestation_days: { type: "number", description: "Day count from breeding_date to the expected due date. Overrides the species preset." },
        reminders: {
          type: "array",
          description: "The caller's own reminder entries: { label, anchor ('breeding' | 'due' | 'custom'), offset_days, custom_date (required when anchor is 'custom') }.",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              anchor: { type: "string", enum: ["breeding", "due", "custom"] },
              offset_days: { type: "number" },
              custom_date: { type: "string" },
            },
          },
        },
      },
      required: ["breeding_date"],
    },
    outputDescription:
      "Returns { input (normalized: species, breeding_date, gestation_days, reminders), due_date (YYYY-MM-DD), reminders: [{ id, label, anchor, offset_days, custom_date?, date (computed YYYY-MM-DD or null) }] }.",
    http: {
      method: "POST",
      path: "/herd/calculate",
      example_body: {
        species: "cattle",
        breeding_date: "2026-01-01",
        reminders: [{ label: "My own note — two weeks out", anchor: "due", offset_days: -14 }],
      },
      example_query: "species=cattle&breeding_date=2026-01-01",
    },
  },
  {
    name: "variety_search",
    description:
      "Search the MicroRadicle cultivar library (266 field-tested variety records for 30-inch biointensive beds). Free-text query matches common name, cultivar, botanical name, family, category, and id; category, frost-hardiness band, and botanical family filter exactly. Results are paginated full records — the same operating specs the site's succession engine plans from (propagation, bed geometry, timeline/DTM, yield & revenue, irrigation, soil extraction).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Free-text search (name, cultivar, botanical name, family, id). Also accepted as 'query'." },
        category: {
          type: "string",
          enum: ["leafy-greens", "brassicas", "root-crops", "alliums", "solanaceous", "cucurbits", "legumes", "herbs", "cut-flowers"],
          description: "Crop category filter. (Enum is advisory — the API validates against the live catalog.)",
        },
        frost: {
          type: "string",
          enum: ["tender", "moderate", "hardy", "extreme"],
          description: "Frost-hardiness band filter.",
        },
        family: { type: "string", description: "Botanical family filter, exact match (e.g. 'Solanaceae'). The response includes the full family list." },
        limit: { type: "number", description: "Page size, 1–200. Default: 50." },
        offset: { type: "number", description: "Pagination offset. Default: 0." },
      },
    },
    outputDescription:
      "Returns { total (full match count), limit, offset, count (this page), families (all botanical families in the library), varieties: [full cultivar records] }.",
    http: {
      method: "GET",
      path: "/crops",
      example_query: "q=tomato&limit=5",
    },
  },
  {
    name: "variety_get",
    description:
      "Fetch one cultivar record by id (e.g. 'tomato-cherokee-purple', 'lettuce-salanova-butterhead') — the complete operating spec: propagation (method, cell size, nursery lead, germination window), 30-inch-bed geometry, timeline (DTM, holding days, frost hardiness), yield & revenue targets, irrigation profile, soil nutrient extraction, companions/avoid lists, and succession cadence.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Cultivar id from variety_search results." },
      },
      required: ["id"],
    },
    outputDescription: "Returns the full cultivar record, or a 404 error for an unknown id.",
    http: {
      method: "GET",
      path: "/crops/{id}",
    },
  },
];

export function listMcpTools(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return AGENT_TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

export function callAgentTool(name: string, args: Record<string, unknown> | undefined): unknown {
  const input = args ?? {};
  switch (name) {
    case "feed_calculate":
      return calculateFeed(input);
    case "herd_due_date":
      return calculateHerdDueDate(input);
    case "variety_search":
      return searchVarieties(input);
    case "variety_get": {
      const id = input.id;
      if (typeof id !== "string" || !id) {
        throw new ApiError(400, "variety_get requires an 'id' argument (a cultivar id from variety_search).");
      }
      return getVarietyById(id);
    }
    default:
      throw new ApiError(404, `Unknown tool '${name}'. Available tools: ${AGENT_TOOLS.map((t) => t.name).join(", ")}.`);
  }
}
