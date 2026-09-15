import type { LivestockClass, LivestockSpeciesSpec } from "@/types/pasture";
import { LIVESTOCK_CLASSES } from "@/types/pasture";
import catalog from "@/data/pasture/species.json";

export const SPECIES: LivestockSpeciesSpec[] = (catalog as LivestockSpeciesSpec[]).slice().sort((a, b) => {
  const classOrder = LIVESTOCK_CLASSES.indexOf(a.livestockClass) - LIVESTOCK_CLASSES.indexOf(b.livestockClass);
  if (classOrder !== 0) return classOrder;
  const name = a.commonName.localeCompare(b.commonName);
  if (name !== 0) return name;
  return a.breed.localeCompare(b.breed);
});

export const SPECIES_COUNT = SPECIES.length;

export const speciesById: Map<string, LivestockSpeciesSpec> = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): LivestockSpeciesSpec | undefined {
  return speciesById.get(id);
}

export function requireSpecies(id: string): LivestockSpeciesSpec {
  const spec = getSpecies(id);
  if (!spec) throw new Error(`Unknown pasture species: ${id}`);
  return spec;
}

export const SPECIES_BY_CLASS: { classId: LivestockClass; items: LivestockSpeciesSpec[] }[] = LIVESTOCK_CLASSES.map(
  (classId) => ({
    classId,
    items: SPECIES.filter((s) => s.livestockClass === classId),
  }),
).filter((g) => g.items.length > 0);
