import type { MicrogreenCultivar } from "@/types/nursery";
import catalog from "@/data/nursery/microgreens.json";

export const MICROGREENS: MicrogreenCultivar[] = (catalog as MicrogreenCultivar[]).slice().sort((a, b) => {
  const name = a.commonName.localeCompare(b.commonName);
  if (name !== 0) return name;
  return a.cultivar.localeCompare(b.cultivar);
});

export const MICROGREEN_COUNT = MICROGREENS.length;

export const microgreenById: Map<string, MicrogreenCultivar> = new Map(
  MICROGREENS.map((c) => [c.id, c]),
);

export function getMicrogreen(id: string): MicrogreenCultivar | undefined {
  return microgreenById.get(id);
}

export function requireMicrogreen(id: string): MicrogreenCultivar {
  const crop = getMicrogreen(id);
  if (!crop) throw new Error(`Unknown microgreen: ${id}`);
  return crop;
}

export const MICROGREENS_BY_COMMON_NAME: { name: string; items: MicrogreenCultivar[] }[] = (() => {
  const groups = new Map<string, MicrogreenCultivar[]>();
  for (const crop of MICROGREENS) {
    const list = groups.get(crop.commonName) ?? [];
    list.push(crop);
    groups.set(crop.commonName, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, items]) => ({ name, items }));
})();
