/**
 * OpenAPI 3.1 document for the MicroRadicle agent API — served at
 * /openapi.json by src/routes/openapi[.]json.ts. Kept beside the shared
 * logic in src/lib/agentApi.ts so the described schemas track the code.
 */
export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "MicroRadicle Agent API",
    version: "1.0.0",
    description:
      "Free, no-key access to MicroRadicle's farm engines: the Feed Studio poultry ration analyzer, the herd packet due-date calculator, the greenhouse reservoir top-off calculator, and the 266-record cultivar library. The same math as the web UI. An MCP server exposing the same tools lives at /mcp; a tool manifest is at /mcp-tools.json.",
  },
  servers: [{ url: "https://microradicle.com" }],
  paths: {
    "/api/feed/calculate": {
      post: {
        operationId: "feedCalculate",
        summary: "Analyze a poultry ration (Feed Studio engine)",
        description:
          "Full nutrient panel against a life-stage target band, batch weigh-out with costs, cost per bird per day, and warnings. All fields optional — omit lines entirely to analyze the built-in layer example ration.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FeedCalculateRequest" },
              example: {
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
            },
          },
        },
        responses: {
          "200": {
            description: "Normalized input, effective target bands, and the ration analysis.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/FeedCalculateResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
      get: {
        operationId: "feedCalculateGet",
        summary: "Analyze a poultry ration via query params",
        parameters: [
          { name: "target_id", in: "query", schema: { type: "string" }, description: "Life-stage target preset id." },
          {
            name: "lines",
            in: "query",
            schema: { type: "string" },
            description: "Comma-separated ingredient_id:pct pairs, e.g. corn:63.2,soybean-meal-44:25.3,limestone:9.",
          },
          { name: "batch_lbs", in: "query", schema: { type: "number" } },
          { name: "flock_size", in: "query", schema: { type: "number" } },
          { name: "intake_lb_per_day", in: "query", schema: { type: "number" } },
        ],
        responses: {
          "200": {
            description: "Same response as POST.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/FeedCalculateResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/api/herd/calculate": {
      post: {
        operationId: "herdDueDate",
        summary: "Compute a herd due date (herd packet date math)",
        description:
          "Adds a day count to a breeding date the caller supplies: species presets pre-fill the common published average (cattle 283, sheep 147, goat 150, pig 114, poultry incubation 21) and gestation_days overrides with the caller's own number. Optional reminders carry the caller's own labels and offsets and return with computed dates. Date arithmetic only — no intervals or schedules are suggested, and the response contains dates, not animal-care advice. The herd log itself is web-only (records live in the keeper's browser) and is not exposed by this API.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HerdDueDateRequest" },
              example: {
                species: "cattle",
                breeding_date: "2026-01-01",
                reminders: [{ label: "My own note — two weeks out", anchor: "due", offset_days: -14 }],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Normalized input, the computed due date, and reminder dates.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HerdDueDateResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
      get: {
        operationId: "herdDueDateGet",
        summary: "Compute a herd due date via query params",
        parameters: [
          { name: "species", in: "query", schema: { type: "string", enum: ["cattle", "sheep", "goat", "pig", "poultry", "other"] } },
          { name: "breeding_date", in: "query", required: true, schema: { type: "string" }, description: "ISO date, YYYY-MM-DD." },
          { name: "gestation_days", in: "query", schema: { type: "number" }, description: "Overrides the species preset day count." },
        ],
        responses: {
          "200": {
            description: "Same response as POST (without reminders).",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HerdDueDateResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/api/greenhouse/calculate": {
      post: {
        operationId: "greenhouseTopOff",
        summary: "Solve a reservoir top-off (greenhouse hydroponics)",
        description:
          "The daily-action calculator: given the reservoir's current volume and EC, a target EC, and the last mix recipe (up to 3 parts at full-strength mL/gal rates plus the recipe's full-strength EC), it returns the concentrate dose per part or the plain-water dilution that lands on target — or both, split to hit a fill volume exactly. EC blends linearly by volume. A dump-and-remix advisory fires on stated triggers (target at/above the recipe's own EC, correction exceeding the reservoir volume or a stated capacity, dilution that cannot fit the headroom, caller-flagged suspected drift). Brand-agnostic; PPM is reported on both the 500 and 700 scales, derived from EC. ph_now is context only — no pH dosing is computed.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TopOffRequest" },
              example: {
                volume_l: 40,
                ec_now: 1.2,
                ec_target: 1.8,
                recipe_ec: 2.0,
                parts: [
                  { name: "Micro", ml_per_gal: 5 },
                  { name: "Gro", ml_per_gal: 5 },
                  { name: "Bloom", ml_per_gal: 5 },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Normalized input, the solved additions, the resulting volume/EC, and any advisory.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TopOffResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
      get: {
        operationId: "greenhouseTopOffGet",
        summary: "Solve a reservoir top-off via query params",
        parameters: [
          { name: "volume_l", in: "query", required: true, schema: { type: "number" }, description: "Current reservoir volume, liters." },
          { name: "ec_now", in: "query", required: true, schema: { type: "number" }, description: "Current EC (mS/cm)." },
          { name: "ec_target", in: "query", required: true, schema: { type: "number" }, description: "Target EC (mS/cm)." },
          { name: "recipe_ec", in: "query", schema: { type: "number" }, description: "EC of the recipe at full strength. Default 2.0." },
          { name: "parts", in: "query", schema: { type: "string" }, description: "Comma-separated full-strength rates in mL/gal, e.g. parts=5,5,5 (max 3; names are POST-only)." },
          { name: "fill_volume_l", in: "query", schema: { type: "number" }, description: "Top off to this final volume while landing on target." },
          { name: "capacity_l", in: "query", schema: { type: "number" }, description: "Physical reservoir capacity — drives the overflow flag." },
          { name: "ph_now", in: "query", schema: { type: "number" }, description: "pH reading — context only." },
          { name: "drift_suspected", in: "query", schema: { type: "string" }, description: "'1' or 'true' when the mix may be compromised." },
        ],
        responses: {
          "200": {
            description: "Same response as POST.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TopOffResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/api/feed/ingredients": {
      get: {
        operationId: "feedIngredients",
        summary: "Feed ingredient catalog",
        description: "The 11-ingredient Feed Studio catalog with as-fed nutrient values and default prices — the ids feed_calculate lines reference.",
        responses: {
          "200": {
            description: "{ count, ingredients: [FeedIngredient] }",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    ingredients: { type: "array", items: { $ref: "#/components/schemas/FeedIngredient" } },
                  },
                  required: ["count", "ingredients"],
                },
              },
            },
          },
        },
      },
    },
    "/api/feed/targets": {
      get: {
        operationId: "feedTargets",
        summary: "Life-stage target presets",
        description: "The six Feed Studio target presets (broiler starter/grower/finisher, pullet starter/grower, layer) with their nutrient bands.",
        responses: {
          "200": {
            description: "{ count, targets: [FeedTarget] }",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    targets: { type: "array", items: { $ref: "#/components/schemas/FeedTarget" } },
                  },
                  required: ["count", "targets"],
                },
              },
            },
          },
        },
      },
    },
    "/api/crops": {
      get: {
        operationId: "varietySearch",
        summary: "Search the cultivar library",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Free-text search over name, cultivar, botanical name, family, category, id." },
          {
            name: "category",
            in: "query",
            schema: {
              type: "string",
              enum: ["leafy-greens", "brassicas", "root-crops", "alliums", "solanaceous", "cucurbits", "legumes", "herbs", "cut-flowers"],
            },
          },
          { name: "frost", in: "query", schema: { type: "string", enum: ["tender", "moderate", "hardy", "extreme"] } },
          { name: "family", in: "query", schema: { type: "string" }, description: "Botanical family, exact match." },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        ],
        responses: {
          "200": {
            description: "{ total, limit, offset, count, families, varieties: [Crop] }",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VarietySearchResponse" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/api/crops/{id}": {
      get: {
        operationId: "varietyGet",
        summary: "Fetch one cultivar record by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "tomato-cherokee-purple" }],
        responses: {
          "200": {
            description: "The full cultivar record.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Crop" } } },
          },
          "404": { $ref: "#/components/responses/Error" },
        },
      },
    },
  },
  components: {
    responses: {
      Error: {
        description: "Error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { error: { type: "string" } },
              required: ["error"],
            },
          },
        },
      },
    },
    schemas: {
      FeedBand: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: ["number", "null"], description: "null = floor-only band." },
        },
        required: ["min", "max"],
      },
      RationLine: {
        type: "object",
        properties: {
          ingredient_id: { type: "string", description: "Catalog id, or a custom id when name + nutrient values are supplied." },
          pct: { type: "number", description: "% of the ration as mixed." },
          name: { type: "string" },
          cp_pct: { type: "number" },
          me_kcal_kg: { type: "number" },
          lys_pct: { type: "number" },
          met_pct: { type: "number" },
          ca_pct: { type: "number" },
          total_p_pct: { type: "number" },
          avail_p_pct: { type: "number" },
          fiber_pct: { type: "number" },
          price_usd_per_lb: { type: "number" },
        },
        required: ["ingredient_id", "pct"],
      },
      FeedCalculateRequest: {
        type: "object",
        properties: {
          target_id: {
            type: "string",
            enum: ["broiler-starter", "broiler-grower", "broiler-finisher", "pullet-starter", "pullet-grower", "layer-production"],
            default: "layer-production",
          },
          lines: { type: "array", items: { $ref: "#/components/schemas/RationLine" } },
          batch_lbs: { type: "number", default: 100 },
          flock_size: { type: "number", default: 25 },
          intake_lb_per_day: { type: "number", description: "Defaults to the target preset's intake." },
          target_overrides: {
            type: "object",
            description: "Per-nutrient band edits keyed by cp, me, lys, met, ca, total_p, avail_p, fiber.",
            additionalProperties: { $ref: "#/components/schemas/FeedBand" },
          },
        },
      },
      FeedIngredient: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          cp_pct: { type: "number" },
          me_kcal_kg: { type: "number" },
          lys_pct: { type: "number" },
          met_pct: { type: "number" },
          ca_pct: { type: "number" },
          total_p_pct: { type: "number" },
          avail_p_pct: { type: "number" },
          fiber_pct: { type: "number" },
          default_price_usd_per_lb: { type: "number" },
          cautions: { type: "string" },
        },
      },
      FeedTarget: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          bird_class: { type: "string", enum: ["broiler", "pullet", "layer"] },
          cp: { $ref: "#/components/schemas/FeedBand" },
          me_kcal_kg: { $ref: "#/components/schemas/FeedBand" },
          ca: { $ref: "#/components/schemas/FeedBand" },
          avail_p: { $ref: "#/components/schemas/FeedBand" },
          lys: { $ref: "#/components/schemas/FeedBand" },
          met: { $ref: "#/components/schemas/FeedBand" },
          fiber_max_pct: { type: "number" },
          default_intake_lb_per_day: { type: "number" },
        },
      },
      NutrientReading: {
        type: "object",
        properties: {
          value: { type: "number" },
          state: { type: "string", enum: ["in", "low", "high"] },
        },
        required: ["value", "state"],
      },
      FeedCalculateResponse: {
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              target_id: { type: "string" },
              lines: { type: "array", items: { $ref: "#/components/schemas/RationLine" } },
              batch_lbs: { type: "number" },
              flock_size: { type: "number" },
              intake_lb_per_day: { type: "number" },
            },
          },
          target: { $ref: "#/components/schemas/FeedTarget" },
          analysis: {
            type: "object",
            properties: {
              total_pct: { type: "number" },
              nutrients: {
                type: "object",
                properties: {
                  cp: { $ref: "#/components/schemas/NutrientReading" },
                  me: { $ref: "#/components/schemas/NutrientReading" },
                  lys: { $ref: "#/components/schemas/NutrientReading" },
                  met: { $ref: "#/components/schemas/NutrientReading" },
                  ca: { $ref: "#/components/schemas/NutrientReading" },
                  total_p: { $ref: "#/components/schemas/NutrientReading" },
                  avail_p: { $ref: "#/components/schemas/NutrientReading" },
                  fiber: { $ref: "#/components/schemas/NutrientReading" },
                },
              },
              ca_to_p_ratio: { type: ["number", "null"], description: "null when the blend has Ca but no phosphorus (infinite ratio)." },
              salt_pct: { type: "number" },
              premix_pct: { type: "number" },
              batch: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ingredient_id: { type: "string" },
                    name: { type: "string" },
                    lbs: { type: "number" },
                    cost_usd: { type: "number" },
                  },
                },
              },
              batch_cost_usd: { type: "number" },
              cost_per_lb_usd: { type: "number" },
              cost_per_bird_day_usd: { type: "number" },
              flock_cost_day_usd: { type: "number" },
              flock_cost_week_usd: { type: "number" },
              warnings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nutrient: { type: "string" },
                    severity: { type: "string", enum: ["info", "warn", "alert"] },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      HerdReminder: {
        type: "object",
        properties: {
          label: { type: "string", description: "The caller's own label for the reminder." },
          anchor: { type: "string", enum: ["breeding", "due", "custom"], default: "breeding" },
          offset_days: { type: "number", default: 0, description: "Days from the anchor date; negative counts back." },
          custom_date: { type: "string", description: "ISO date — required when anchor is 'custom'." },
        },
      },
      HerdDueDateRequest: {
        type: "object",
        properties: {
          species: { type: "string", enum: ["cattle", "sheep", "goat", "pig", "poultry", "other"] },
          breeding_date: { type: "string", description: "ISO date, YYYY-MM-DD." },
          gestation_days: { type: "number", description: "Day count override; defaults to the species preset (283 with no species)." },
          reminders: { type: "array", items: { $ref: "#/components/schemas/HerdReminder" } },
        },
        required: ["breeding_date"],
      },
      HerdDueDateResponse: {
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              species: { type: "string" },
              breeding_date: { type: "string" },
              gestation_days: { type: "number" },
              reminders: { type: "array", items: { $ref: "#/components/schemas/HerdReminder" } },
            },
          },
          due_date: { type: "string", description: "breeding_date + gestation_days, YYYY-MM-DD." },
          reminders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                anchor: { type: "string" },
                offset_days: { type: "number" },
                custom_date: { type: "string" },
                date: { type: ["string", "null"], description: "The computed calendar date, or null when it cannot be placed." },
              },
            },
          },
        },
      },
      TopOffPart: {
        type: "object",
        properties: {
          name: { type: "string", description: "Optional grower label for the part (display only)." },
          ml_per_gal: { type: "number", description: "This part's rate in the full-strength recipe, mL per gallon." },
        },
        required: ["ml_per_gal"],
      },
      TopOffRequest: {
        type: "object",
        properties: {
          volume_l: { type: "number", description: "Current reservoir volume, liters." },
          ec_now: { type: "number", description: "Current EC (mS/cm)." },
          ec_target: { type: "number", description: "Target EC (mS/cm)." },
          recipe_ec: { type: "number", description: "EC of the recipe mixed at full strength (grower-stated). Default 2.0.", default: 2.0 },
          parts: { type: "array", maxItems: 3, items: { $ref: "#/components/schemas/TopOffPart" } },
          fill_volume_l: { type: "number", description: "Optional final volume to top off to while landing on target." },
          capacity_l: { type: "number", description: "Optional physical reservoir capacity — drives the overflow flag." },
          ph_now: { type: "number", description: "Optional pH reading — context only; never dosed." },
          drift_suspected: { type: "boolean", description: "Caller-flagged suspected drift — forces the dump-and-remix advisory." },
        },
        required: ["volume_l", "ec_now", "ec_target"],
      },
      TopOffResponse: {
        type: "object",
        properties: {
          input: {
            type: "object",
            description: "The normalized input the engine solved (recipe_ec defaulted; fill/capacity/ph null when absent).",
            additionalProperties: true,
          },
          mode: { type: "string", enum: ["concentrate", "dilute", "fill", "none", "blocked"] },
          add_water_l: { type: "number", description: "Plain water to add, liters." },
          full_strength_equivalent_l: {
            type: ["number", "null"],
            description: "Liters of full-strength mix whose concentrate content equals the dose; null when no such volume exists.",
          },
          parts_ml: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                ml_per_gal: { type: "number" },
                add_ml: { type: "number", description: "mL of this part to add." },
              },
            },
          },
          total_concentrate_ml: { type: "number" },
          final_volume_l: { type: ["number", "null"] },
          final_ec: { type: ["number", "null"], description: "EC after the additions, recomputed from the blend." },
          ppm_now: { type: "object", properties: { ppm500: { type: "number" }, ppm700: { type: "number" } } },
          ppm_target: { type: "object", properties: { ppm500: { type: "number" }, ppm700: { type: "number" } } },
          advisory: {
            type: "object",
            properties: {
              dump_and_remix: { type: "boolean" },
              codes: { type: "array", items: { type: "string" } },
              messages: { type: "array", items: { type: "string" } },
            },
          },
          notes: { type: "array", items: { type: "string" } },
        },
      },
      Crop: {
        type: "object",
        description: "Full cultivar operating record. Nested sections are complete in live responses; key fields are sketched here.",
        properties: {
          id: { type: "string", example: "tomato-cherokee-purple" },
          commonName: { type: "string" },
          cultivar: { type: "string" },
          botanicalName: { type: "string" },
          family: { type: "string" },
          category: {
            type: "string",
            enum: ["leafy-greens", "brassicas", "root-crops", "alliums", "solanaceous", "cucurbits", "legumes", "herbs", "cut-flowers"],
          },
          propagation: {
            type: "object",
            properties: {
              method: { type: "string", enum: ["direct-seed", "transplant", "both"] },
              nurseryLeadDays: { type: "number" },
              germinationDays: { type: "number" },
            },
          },
          fieldGeometry: {
            type: "object",
            properties: {
              rowsPerBed: { type: "number" },
              inRowSpacingIn: { type: "number" },
              plantsPerLinearFoot: { type: "number" },
            },
          },
          timeline: {
            type: "object",
            properties: {
              dtmFromField: { type: "number" },
              frostHardiness: { type: "string", enum: ["tender", "moderate", "hardy", "extreme"] },
              isMulticut: { type: "boolean" },
            },
          },
          notes: { type: "string" },
          companions: { type: "array", items: { type: "string" } },
          avoid: { type: "array", items: { type: "string" } },
          successionIntervalDays: { type: "number" },
          maxSuccessions: { type: "number" },
        },
        additionalProperties: true,
      },
      VarietySearchResponse: {
        type: "object",
        properties: {
          total: { type: "integer" },
          limit: { type: "integer" },
          offset: { type: "integer" },
          count: { type: "integer" },
          families: { type: "array", items: { type: "string" } },
          varieties: { type: "array", items: { $ref: "#/components/schemas/Crop" } },
        },
      },
    },
  },
} as const;
