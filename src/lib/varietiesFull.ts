/**
 * Full variety records (5MB+ dataset) — server-side consumers only:
 * agentApi (REST + MCP) and the variety detail route's server
 * function. Do NOT import from client components; the explorer UI
 * works from the slim index in @/lib/varieties.
 */
import fullData from "../data/varieties/varieties-full.json" with { type: "json" };
import type { Variety } from "../types/variety.ts";

export const ALL_VARIETIES = fullData as unknown as Variety[];

const bySlug = new Map(ALL_VARIETIES.map((v) => [v.slug, v]));

export function getVarietyFull(slug: string): Variety | undefined {
  return bySlug.get(slug);
}
