/**
 * Server function for variety detail lookups — the full dataset
 * (5MB+) stays server-side; the handler dynamically imports it
 * (the readiness.ts pattern). Client-safe code lives in
 * @/lib/varieties.
 */
import { createServerFn } from "@tanstack/react-start";
import type { Variety } from "@/types/variety";

export const getSeedVariety = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Variety | null> => {
    const { getVarietyFull } = await import("./varietiesFull");
    return getVarietyFull(slug) ?? null;
  });
