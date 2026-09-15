import {
  CROP_CATEGORIES,
  FROST_BANDS,
  TRADE_LABEL,
  type Crop,
  type CropCategory,
  type EngineTradeFilter,
  type FrostHardiness,
} from "@/types/crop";

const modules = import.meta.glob("../data/crops/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Crop>;

export const crops: Crop[] = Object.values(modules).sort((a, b) => {
  const name = a.commonName.localeCompare(b.commonName);
  if (name !== 0) return name;
  return a.cultivar.localeCompare(b.cultivar);
});

export const cropBySlug: Map<string, Crop> = new Map(crops.map((c) => [c.id, c]));

export function getCrop(slug: string): Crop | undefined {
  return cropBySlug.get(slug);
}

export function requireCrop(slug: string): Crop {
  const crop = getCrop(slug);
  if (!crop) throw new Error(`Unknown cultivar: ${slug}`);
  return crop;
}

export { CROP_CATEGORIES, FROST_BANDS };

export const FAMILIES: string[] = [...new Set(crops.map((c) => c.family))].sort();

export const CULTIVAR_COUNT = crops.length;

export const VEGETABLE_COUNT = crops.filter((c) => c.category !== "cut-flowers").length;

export const FLOWER_COUNT = crops.filter((c) => c.category === "cut-flowers").length;

export const cropsByCategory: Record<CropCategory, number> = Object.fromEntries(
  CROP_CATEGORIES.map((cat) => [cat, crops.filter((c) => c.category === cat).length]),
) as Record<CropCategory, number>;

export function cropMatchesTrade(crop: Crop, filter: EngineTradeFilter): boolean {
  if (filter === "vegetables") return crop.category !== "cut-flowers";
  return crop.category === filter;
}

export function cropsForTrade(filter?: EngineTradeFilter | null): Crop[] {
  if (!filter) return crops;
  return crops.filter((c) => cropMatchesTrade(c, filter));
}

export function groupedCropsForTrade(
  filter?: EngineTradeFilter | null,
  extra?: Crop | null,
): { name: string; items: Crop[] }[] {
  const list = cropsForTrade(filter);
  const withExtra = extra && !list.some((c) => c.id === extra.id) ? [extra, ...list] : list;
  const groups = new Map<string, Crop[]>();
  for (const crop of withExtra) {
    const items = groups.get(crop.commonName) ?? [];
    items.push(crop);
    groups.set(crop.commonName, items);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, items]) => ({ name, items }));
}

export function defaultCropIdForTrade(filter?: EngineTradeFilter | null): string {
  const list = cropsForTrade(filter);
  const preferred =
    filter === "cut-flowers"
      ? "zinnia-benarys-giant-coral"
      : !filter || filter === "vegetables" || filter === "leafy-greens"
        ? "lettuce-salanova-butterhead"
        : list[0]?.id;
  if (preferred && list.some((c) => c.id === preferred)) return preferred;
  return list[0]?.id ?? crops[0]!.id;
}

export function tradeViewLabel(filter?: EngineTradeFilter | null): string | null {
  if (!filter) return null;
  return TRADE_LABEL[filter];
}

export function cropsGroupedByCommonName(): { name: string; items: Crop[] }[] {
  return groupedCropsForTrade(null);
}

export const CROPS_BY_COMMON_NAME = cropsGroupedByCommonName();

export function filterCrops(opts: {
  query?: string;
  category?: CropCategory | "all";
  frost?: FrostHardiness | "all";
  family?: string | "all";
}): Crop[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return crops.filter((c) => {
    if (opts.category && opts.category !== "all" && c.category !== opts.category) return false;
    if (opts.frost && opts.frost !== "all" && c.timeline.frostHardiness !== opts.frost) return false;
    if (opts.family && opts.family !== "all" && c.family !== opts.family) return false;
    if (!q) return true;
    const hay = `${c.commonName} ${c.cultivar} ${c.botanicalName} ${c.family} ${c.category} ${c.id}`.toLowerCase();
    return hay.includes(q);
  });
}