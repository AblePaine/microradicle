import { create } from "zustand";
import type { BedSuccession, FarmState, FieldBlock, Units } from "@/types/farm";
import { MAX_BED_LENGTH_FT, MAX_BEDS_PER_BLOCK } from "@/types/farm";
import type { IrrigationNetwork, IrrigationZone } from "@/types/irrigation";
import type { SoilSettings } from "@/types/soil";
import type { EconomicsSettings } from "@/types/economics";
import { cropBySlug, getCrop } from "@/lib/crops";
import { getMicrogreen } from "@/lib/nursery";
import { computeBatch } from "@/lib/nurseryMath";
import { getSpecies } from "@/lib/pasture";
import { computeRotation } from "@/lib/pastureMath";
import type { PastureForageStand } from "@/types/pasture";
import { defaultZoneForBlock, resolveNetwork } from "@/lib/hydraulics";
import { resolveSoil } from "@/lib/soilMath";
import { resolveEconomics } from "@/lib/economicsMath";
import { bedKey, computeSuccession, recomputeFarm } from "@/lib/math";
import {
  createDefaultFarm,
  downloadFarmBackup,
  loadFarm,
  parseFarm,
  saveFarm,
  uid,
} from "@/lib/storage";

type FarmStore = {
  farm: FarmState;
  hydrated: boolean;
  selectedBlockId: string | null;
  selectedBedIndex: number;
  hydrate: () => void;
  setFarm: (farm: FarmState) => void;
  patchFarm: (partial: Partial<FarmState>) => void;
  setUnits: (units: Units) => void;
  patchClimate: (partial: Partial<FarmState["climate"]>) => void;
  selectBed: (blockId: string, bedIndex: number) => void;
  addBlock: () => void;
  removeBlock: (id: string) => void;
  patchBlock: (id: string, patch: Partial<Pick<FieldBlock, "name" | "bed_count" | "bed_length_ft">>) => void;
  addSuccession: (draft: Omit<BedSuccession, "id">) => string;
  updateSuccession: (succession: BedSuccession) => void;
  removeSuccession: (id: string) => void;
  resetFarm: () => void;
  importFarm: (raw: unknown) => void;
  exportBackup: () => void;
  ensureIrrigation: () => IrrigationNetwork;
  patchIrrigation: (partial: Partial<Omit<IrrigationNetwork, "zones">>) => void;
  addZone: () => string;
  removeZone: (id: string) => void;
  patchZone: (id: string, patch: Partial<Omit<IrrigationZone, "id">>) => void;
  patchSoil: (partial: Partial<SoilSettings>) => void;
  patchEconomics: (partial: Partial<EconomicsSettings>) => void;
  addNurseryBatch: (cultivarId: string, trayCount: number, sowDate: string) => string;
  updateNurseryBatch: (id: string, patch: { tray_count?: number; sow_date?: string; cultivar_id?: string }) => void;
  removeNurseryBatch: (id: string) => void;
  addPastureRotation: (
    speciesId: string,
    headCount: number,
    stand: PastureForageStand,
    startDate: string,
    moveDays: number,
    allocatedSqft: number,
  ) => string;
  updatePastureRotation: (
    id: string,
    patch: {
      species_id?: string;
      head_count?: number;
      stand?: PastureForageStand;
      start_date?: string;
      move_interval_days?: number;
      allocated_paddock_sqft?: number;
    },
  ) => void;
  removePastureRotation: (id: string) => void;
};

function persist(farm: FarmState): FarmState {
  const next = recomputeFarm(farm, cropBySlug);
  saveFarm(next);
  return next;
}

function newSuccessionId(id?: string): string {
  if (id && id !== "preview") return id;
  return uid("s");
}

function finalize(
  draft: Omit<BedSuccession, "id"> & { id?: string },
  farm: FarmState,
): BedSuccession {
  const crop = getCrop(draft.crop_id);
  const block = farm.blocks.find((b) => b.id === draft.block_id);
  const id = newSuccessionId(draft.id);
  if (!crop || !block) {
    return { ...draft, id } as BedSuccession;
  }
  return computeSuccession({ ...draft, id }, crop, block, farm.climate);
}

export const useFarmStore = create<FarmStore>((set, get) => ({
  farm: createDefaultFarm(),
  hydrated: false,
  selectedBlockId: "blk-lettuce",
  selectedBedIndex: 0,
  hydrate: () => {
    const farm = loadFarm();
    set({
      farm,
      hydrated: true,
      selectedBlockId: farm.blocks[0]?.id ?? null,
      selectedBedIndex: 0,
    });
  },
  setFarm: (farm) => set({ farm: persist(farm) }),
  patchFarm: (partial) => {
    const farm = persist({ ...get().farm, ...partial });
    set({ farm });
  },
  setUnits: (units) => {
    set({ farm: persist({ ...get().farm, units }) });
  },
  patchClimate: (partial) => {
    const farm = get().farm;
    set({ farm: persist({ ...farm, climate: { ...farm.climate, ...partial } }) });
  },
  selectBed: (blockId, bedIndex) => set({ selectedBlockId: blockId, selectedBedIndex: bedIndex }),
  addBlock: () => {
    const farm = get().farm;
    const n = farm.blocks.length + 1;
    const block: FieldBlock = {
      id: uid("blk"),
      name: `${String.fromCharCode(64 + Math.min(n, 26))} OPEN`,
      bed_count: 4,
      bed_length_ft: 50,
      bed_width_in: 30,
    };
    const irrigation = farm.irrigation
      ? { ...farm.irrigation, zones: [...farm.irrigation.zones, defaultZoneForBlock(block)] }
      : farm.irrigation;
    const next = persist({ ...farm, blocks: [...farm.blocks, block], irrigation });
    set({ farm: next, selectedBlockId: block.id, selectedBedIndex: 0 });
  },
  removeBlock: (id) => {
    const farm = get().farm;
    const blocks = farm.blocks.filter((b) => b.id !== id);
    const successions = farm.successions.filter((s) => s.block_id !== id);
    const irrigation = farm.irrigation
      ? {
          ...farm.irrigation,
          zones: farm.irrigation.zones.map((z) => ({
            ...z,
            block_ids: z.block_ids.filter((bid) => bid !== id),
          })),
        }
      : farm.irrigation;
    const selectedBlockId = get().selectedBlockId === id ? (blocks[0]?.id ?? null) : get().selectedBlockId;
    set({
      farm: persist({ ...farm, blocks, successions, irrigation }),
      selectedBlockId,
      selectedBedIndex: 0,
    });
  },
  patchBlock: (id, patch) => {
    const farm = get().farm;
    const blocks = farm.blocks.map((b) => {
      if (b.id !== id) return b;
      const bed_count = Math.max(1, Math.min(MAX_BEDS_PER_BLOCK, patch.bed_count ?? b.bed_count));
      const bed_length_ft = Math.max(10, Math.min(MAX_BED_LENGTH_FT, patch.bed_length_ft ?? b.bed_length_ft));
      return { ...b, ...patch, bed_count, bed_length_ft, bed_width_in: 30 as const };
    });
    const block = blocks.find((b) => b.id === id);
    const successions = farm.successions.filter(
      (s) => s.block_id !== id || (block && s.bed_index < block.bed_count),
    );
    const selectedBedIndex = Math.min(get().selectedBedIndex, (block?.bed_count ?? 1) - 1);
    set({ farm: persist({ ...farm, blocks, successions }), selectedBedIndex });
  },
  addSuccession: (draft) => {
    const farm = get().farm;
    const succession = finalize(draft, farm);
    set({ farm: persist({ ...farm, successions: [...farm.successions, succession] }) });
    return succession.id;
  },
  updateSuccession: (succession) => {
    const farm = get().farm;
    const next = finalize(succession, farm);
    set({
      farm: persist({
        ...farm,
        successions: farm.successions.map((s) => (s.id === next.id ? next : s)),
      }),
    });
  },
  removeSuccession: (id) => {
    const farm = get().farm;
    set({ farm: persist({ ...farm, successions: farm.successions.filter((s) => s.id !== id) }) });
  },
  resetFarm: () => {
    const farm = createDefaultFarm();
    set({
      farm: persist(farm),
      selectedBlockId: farm.blocks[0]?.id ?? null,
      selectedBedIndex: 0,
    });
  },
  importFarm: (raw) => {
    const farm = parseFarm(raw);
    set({
      farm: persist(farm),
      selectedBlockId: farm.blocks[0]?.id ?? null,
      selectedBedIndex: 0,
    });
  },
  exportBackup: () => {
    downloadFarmBackup(get().farm);
  },
  ensureIrrigation: () => {
    const farm = get().farm;
    const network = resolveNetwork(farm);
    if (!farm.irrigation) set({ farm: persist({ ...farm, irrigation: network }) });
    return get().farm.irrigation ?? network;
  },
  patchIrrigation: (partial) => {
    const farm = get().farm;
    const current = resolveNetwork(farm);
    set({
      farm: persist({
        ...farm,
        irrigation: { ...current, ...partial, zones: current.zones },
      }),
    });
  },
  addZone: () => {
    const farm = get().farm;
    const current = resolveNetwork(farm);
    const assigned = new Set(current.zones.flatMap((z) => z.block_ids));
    const free = farm.blocks.find((b) => !assigned.has(b.id));
    const n = current.zones.length + 1;
    const zone: IrrigationZone = free
      ? defaultZoneForBlock(free)
      : {
          id: uid("zn"),
          name: `ZONE ${n}`,
          block_ids: [],
          header_diameter_in: 0.75,
          header_length_ft: 24,
        };
    zone.id = uid("zn");
    zone.name = free ? `${free.name}` : `ZONE ${n}`;
    set({
      farm: persist({ ...farm, irrigation: { ...current, zones: [...current.zones, zone] } }),
    });
    return zone.id;
  },
  removeZone: (id) => {
    const farm = get().farm;
    const current = resolveNetwork(farm);
    set({
      farm: persist({
        ...farm,
        irrigation: { ...current, zones: current.zones.filter((z) => z.id !== id) },
      }),
    });
  },
  patchZone: (id, patch) => {
    const farm = get().farm;
    const current = resolveNetwork(farm);
    set({
      farm: persist({
        ...farm,
        irrigation: {
          ...current,
          zones: current.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
        },
      }),
    });
  },
  patchSoil: (partial) => {
    const farm = get().farm;
    const current = resolveSoil(farm);
    set({ farm: persist({ ...farm, soil: { ...current, ...partial } }) });
  },
  patchEconomics: (partial) => {
    const farm = get().farm;
    const current = resolveEconomics(farm);
    set({ farm: persist({ ...farm, economics: { ...current, ...partial } }) });
  },
  addNurseryBatch: (cultivarId, trayCount, sowDate) => {
    const farm = get().farm;
    const crop = getMicrogreen(cultivarId);
    if (!crop) return "";
    const batch = computeBatch(crop, trayCount, sowDate, uid("nb"));
    set({
      farm: persist({ ...farm, nursery_batches: [...(farm.nursery_batches ?? []), batch] }),
    });
    return batch.id;
  },
  updateNurseryBatch: (id, patch) => {
    const farm = get().farm;
    const batches = (farm.nursery_batches ?? []).map((b) => {
      if (b.id !== id) return b;
      const cultivarId = patch.cultivar_id ?? b.cultivar_id;
      const crop = getMicrogreen(cultivarId);
      if (!crop) return b;
      return computeBatch(crop, patch.tray_count ?? b.tray_count, patch.sow_date ?? b.sow_date, b.id);
    });
    set({ farm: persist({ ...farm, nursery_batches: batches }) });
  },
  removeNurseryBatch: (id) => {
    const farm = get().farm;
    set({
      farm: persist({
        ...farm,
        nursery_batches: (farm.nursery_batches ?? []).filter((b) => b.id !== id),
      }),
    });
  },
  addPastureRotation: (speciesId, headCount, stand, startDate, moveDays, allocatedSqft) => {
    const farm = get().farm;
    const spec = getSpecies(speciesId);
    if (!spec) return "";
    const rotation = computeRotation(spec, headCount, stand, startDate, moveDays, allocatedSqft, uid("pr"));
    set({
      farm: persist({ ...farm, pasture_rotations: [...(farm.pasture_rotations ?? []), rotation] }),
    });
    return rotation.id;
  },
  updatePastureRotation: (id, patch) => {
    const farm = get().farm;
    const rotations = (farm.pasture_rotations ?? []).map((r) => {
      if (r.id !== id) return r;
      const speciesId = patch.species_id ?? r.species_id;
      const spec = getSpecies(speciesId);
      if (!spec) return r;
      return computeRotation(
        spec,
        patch.head_count ?? r.head_count,
        patch.stand ?? r.stand,
        patch.start_date ?? r.start_date,
        patch.move_interval_days ?? r.move_interval_days,
        patch.allocated_paddock_sqft ?? r.allocated_paddock_sqft,
        r.id,
      );
    });
    set({ farm: persist({ ...farm, pasture_rotations: rotations }) });
  },
  removePastureRotation: (id) => {
    const farm = get().farm;
    set({
      farm: persist({
        ...farm,
        pasture_rotations: (farm.pasture_rotations ?? []).filter((r) => r.id !== id),
      }),
    });
  },
}));

export { bedKey };
