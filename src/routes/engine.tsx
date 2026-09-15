import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BedCrossSection } from "@/components/BedCrossSection";
import { EngineCanvas } from "@/components/EngineCanvas";
import { OpsBoard } from "@/components/OpsBoard";
import { SuccessionTimeline } from "@/components/SuccessionTimeline";
import { cropBySlug, crops, getCrop, groupedCropsForTrade, defaultCropIdForTrade, tradeViewLabel } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import {
  computeSuccession,
  directRevenue,
  expectedYieldDisplay,
  farmYield,
  fieldMethod,
  findFreeBed,
  formatBedFt,
  formatUsd,
  formatWeight,
  harvestDatesForWindow,
  iso,
  plantCount,
  PHASE_LABEL,
  seasonWindow,
  successionConflicts,
  successionPhase,
  wholesaleRevenue,
} from "@/lib/math";
import {
  engineSearchFromUnknown,
  successionShareHref,
  type EngineSearch,
} from "@/lib/shareUrl";
import { cn } from "@/lib/utils";
import type { Crop } from "@/types/crop";
import { MAX_BED_LENGTH_FT, MAX_BEDS_PER_BLOCK, type BedSuccession } from "@/types/farm";

export type { EngineSearch };

export const Route = createFileRoute("/engine")({
  validateSearch: (s: Record<string, unknown>): EngineSearch => engineSearchFromUnknown(s),
  component: EnginePage,
  head: () => ({
    meta: [{ title: "Engine — MicroRadicle" }],
  }),
});

function EnginePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const farm = useFarmStore((s) => s.farm);
  const selectedBlockId = useFarmStore((s) => s.selectedBlockId);
  const selectedBedIndex = useFarmStore((s) => s.selectedBedIndex);
  const selectBed = useFarmStore((s) => s.selectBed);
  const addBlock = useFarmStore((s) => s.addBlock);
  const removeBlock = useFarmStore((s) => s.removeBlock);
  const patchBlock = useFarmStore((s) => s.patchBlock);
  const addSuccession = useFarmStore((s) => s.addSuccession);
  const updateSuccession = useFarmStore((s) => s.updateSuccession);
  const removeSuccession = useFarmStore((s) => s.removeSuccession);
  const patchFarm = useFarmStore((s) => s.patchFarm);
  const patchClimate = useFarmStore((s) => s.patchClimate);

  const block = farm.blocks.find((b) => b.id === selectedBlockId) ?? farm.blocks[0] ?? null;
  const bedIndex = block ? Math.min(selectedBedIndex, block.bed_count - 1) : 0;
  const [tab, setTab] = useState<"map" | "section" | "gantt" | "plant" | "ops">("map");
  const [slug, setSlug] = useState(
    () => search.crop ?? defaultCropIdForTrade(search.category),
  );
  const [harvestDate, setHarvestDate] = useState(() => search.date ?? iso(new Date()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const trade = search.category;
  const tradeLabel = tradeViewLabel(trade);

  useEffect(() => {
    if (search.crop && getCrop(search.crop)) setSlug(search.crop);
    else if (search.category) setSlug(defaultCropIdForTrade(search.category));
    if (search.date) setHarvestDate(search.date);
    if (search.units) {
      setMsg(`Shared target ${search.units} units. Schedule to plant it.`);
    }
  }, [search.crop, search.date, search.units, search.category]);

  const crop = getCrop(slug) ?? crops[0]!;
  const cropGroups = useMemo(() => groupedCropsForTrade(trade, crop), [trade, crop]);
  const today = useMemo(() => new Date(), []);
  const yields = useMemo(() => farmYield(farm, cropBySlug), [farm]);

  const draft = useMemo(() => {
    if (!block) return null;
    return computeSuccession(
      {
        id: editingId ?? "preview",
        block_id: block.id,
        bed_index: bedIndex,
        crop_id: crop.id,
        target_harvest_date: harvestDate,
      },
      crop,
      block,
      farm.climate,
    );
  }, [block, bedIndex, crop, harvestDate, farm.climate, editingId]);

  const conflicts = draft ? successionConflicts(draft, farm, editingId ?? undefined) : [];

  function selectExisting(blockId: string, index: number, succession: BedSuccession) {
    selectBed(blockId, index);
    setEditingId(succession.id);
    setSlug(succession.crop_id);
    setHarvestDate(succession.target_harvest_date);
    setTab("plant");
  }

  function commit() {
    if (!block || !draft) return;
    if (conflicts.length) {
      setMsg(`${conflicts.length} occupancy conflict${conflicts.length > 1 ? "s" : ""} — not planted.`);
      return;
    }
    const payload = {
      block_id: block.id,
      bed_index: bedIndex,
      crop_id: slug,
      target_harvest_date: harvestDate,
      field_transplant_date: draft.field_transplant_date,
      nursery_sow_date: draft.nursery_sow_date,
      harvest_end_date: draft.harvest_end_date,
      bed_feet_needed: draft.bed_feet_needed,
      target_units: draft.target_units,
    };
    if (editingId) {
      updateSuccession({ ...payload, id: editingId });
      setMsg("Succession updated.");
    } else {
      const id = addSuccession(payload);
      setEditingId(id);
      setMsg("Scheduled.");
    }
  }

  function fillSeason() {
    if (!block) return;
    const year = new Date().getFullYear();
    const window = seasonWindow(farm, crop, year);
    const dates = harvestDatesForWindow(crop, window.start, window.end);
    let n = 0;
    let snapshot = farm;
    for (const date of dates) {
      const computed = computeSuccession(
        { block_id: block.id, bed_index: 0, crop_id: crop.id, target_harvest_date: iso(date) },
        crop,
        block,
        farm.climate,
      );
      const free = findFreeBed(snapshot, block, computed);
      if (free == null) continue;
      const planting = { ...computed, bed_index: free };
      const id = addSuccession(planting);
      snapshot = {
        ...snapshot,
        successions: [...snapshot.successions, { ...planting, id }],
      };
      n += 1;
    }
    setMsg(n ? `Filled ${n} succession${n === 1 ? "" : "s"} on ${block.name}.` : "No free beds in this window.");
  }

  async function copyShare() {
    if (!draft) return;
    const href = successionShareHref(
      { cropId: slug, units: draft.target_units, date: harvestDate },
      window.location.origin,
    );
    try {
      await navigator.clipboard.writeText(href);
      setMsg("Share URL copied.");
    } catch {
      setMsg(href);
    }
  }

  const method = fieldMethod(crop);

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <input
          value={farm.name}
          onChange={(e) => patchFarm({ name: e.target.value })}
          className="h-9 w-[140px] rounded-sm border border-border bg-elevated px-2 font-display text-lg tracking-wide text-fg outline-none focus:border-accent sm:w-[180px]"
          aria-label="Farm name"
        />
        <label className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-subtle">
          LAST
          <input
            type="text"
            value={farm.climate.last_spring_frost}
            onChange={(e) => patchClimate({ last_spring_frost: e.target.value })}
            className="h-9 w-[72px] rounded-sm border border-border bg-elevated px-2 tabular text-fg outline-none focus:border-accent"
            aria-label="Last spring frost MM-DD"
          />
        </label>
        <label className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-subtle">
          FIRST
          <input
            type="text"
            value={farm.climate.first_fall_frost}
            onChange={(e) => patchClimate({ first_fall_frost: e.target.value })}
            className="h-9 w-[72px] rounded-sm border border-border bg-elevated px-2 tabular text-fg outline-none focus:border-accent"
            aria-label="First fall frost MM-DD"
          />
        </label>
        <label className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-subtle">
          LAT
          <input
            type="number"
            step={0.1}
            value={Math.round(farm.climate.latitude * 10) / 10}
            onChange={(e) => patchClimate({ latitude: Number(e.target.value) })}
            className="h-9 w-[64px] rounded-sm border border-border bg-elevated px-2 tabular text-fg outline-none focus:border-accent"
            aria-label="Latitude"
          />
        </label>
        <span className="ml-auto font-mono text-[10px] tracking-widest text-faint">
          {farm.blocks.length} BLK · {farm.blocks.reduce((s, b) => s + b.bed_count, 0)} BEDS
        </span>
        {tradeLabel ? (
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
            {tradeLabel}
            <Link
              to="/engine"
              search={{ crop: search.crop, units: search.units, date: search.date, category: undefined }}
              className="text-muted hover:text-fg"
            >
              All trades
            </Link>
          </span>
        ) : null}
      </div>

      <div className="flex gap-1 border-b border-border px-2 py-1 lg:hidden">
        {(["map", "gantt", "plant", "ops", "section"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-11 flex-1 rounded-sm font-mono text-[10px] tracking-[0.14em] uppercase",
              tab === t ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[200px_minmax(0,1fr)_300px] lg:grid-rows-[minmax(220px,1.1fr)_200px_auto] lg:p-4">
        <aside className={cn("flex min-h-0 flex-col rounded-lg border border-border bg-surface lg:row-span-2", hide(tab, "map") + " lg:flex")}>
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Blocks</p>
            <button
              type="button"
              onClick={addBlock}
              className="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:text-accent"
              aria-label="Add block"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto p-1.5">
            {farm.blocks.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => selectBed(b.id, 0)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-2 text-left font-mono text-xs",
                    b.id === block?.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <span className="truncate">{b.name}</span>
                  <span className="tabular text-[10px] opacity-70">
                    {b.bed_count}×{b.bed_length_ft}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {block ? (
            <div className="hidden space-y-2 border-t border-border p-3 lg:block">
              <label className="block font-mono text-[10px] tracking-widest text-subtle">
                NAME
                <input
                  value={block.name}
                  onChange={(e) => patchBlock(block.id, { name: e.target.value })}
                  className="mt-1 h-9 w-full rounded-sm border border-border bg-elevated px-2 text-xs text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="block font-mono text-[10px] tracking-widest text-subtle">
                BEDS
                <input
                  type="number"
                  min={1}
                  max={MAX_BEDS_PER_BLOCK}
                  value={block.bed_count}
                  onChange={(e) => patchBlock(block.id, { bed_count: Number(e.target.value) })}
                  aria-label="Beds in this block"
                  className="mt-1 h-9 w-full rounded-sm border border-border bg-elevated px-2 tabular text-xs text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="block font-mono text-[10px] tracking-widest text-subtle">
                LENGTH FT
                <input
                  type="number"
                  min={10}
                  max={MAX_BED_LENGTH_FT}
                  value={block.bed_length_ft}
                  onChange={(e) => patchBlock(block.id, { bed_length_ft: Number(e.target.value) })}
                  aria-label="Bed length in feet"
                  className="mt-1 h-9 w-full rounded-sm border border-border bg-elevated px-2 tabular text-xs text-fg outline-none focus:border-accent"
                />
              </label>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="inline-flex h-9 items-center gap-1.5 font-mono text-[10px] tracking-widest text-danger"
              >
                <Trash2 className="size-3.5" />
                DELETE BLOCK
              </button>
            </div>
          ) : null}
        </aside>

        <div className={cn("min-h-[240px] min-w-0 lg:row-span-1", hide(tab, "map") + " lg:flex lg:flex-col")}>
          <EngineCanvas
            farm={farm}
            selectedBlockId={block?.id ?? null}
            selectedBedIndex={bedIndex}
            selectedSuccessionId={editingId}
            onSelectBed={selectBed}
            onSelectSuccession={selectExisting}
            onOpenClipboard={() => navigate({ to: "/clipboard" })}
            onCopyShare={() => {
              void copyShare();
            }}
            shareReady={Boolean(draft)}
            tradeFilter={trade}
          />
        </div>

        <div className={cn("min-h-0 lg:row-span-2", hide(tab, "plant") + " lg:flex lg:flex-col")}>
          <PlantForm
            crop={crop}
            slug={slug}
            setSlug={setSlug}
            groups={cropGroups}
            harvestDate={harvestDate}
            setHarvestDate={setHarvestDate}
            blockId={block?.id ?? ""}
            bedIndex={bedIndex}
            blocks={farm.blocks}
            onPickBed={(id, i) => selectBed(id, i)}
            nursery={draft?.nursery_sow_date ?? "—"}
            transplant={draft?.field_transplant_date ?? "—"}
            clear={draft?.harvest_end_date ?? "—"}
            method={method}
            plantN={block ? plantCount(crop, block.bed_length_ft) : 0}
            yieldLabel={block ? expectedYieldDisplay(crop, block.bed_length_ft, farm.units) : "—"}
            wholesaleLabel={block ? formatUsd(wholesaleRevenue(crop, block.bed_length_ft)) : "—"}
            directLabel={block ? formatUsd(directRevenue(crop, block.bed_length_ft)) : "—"}
            bedFeet={draft?.bed_feet_needed ?? 0}
            units={draft?.target_units ?? 0}
            conflicts={conflicts.length}
            editing={Boolean(editingId)}
            msg={msg}
            onCommit={commit}
            onFill={fillSeason}
            onShare={() => {
              void copyShare();
            }}
            onCancel={() => {
              setEditingId(null);
              setMsg(null);
            }}
            onDelete={() => {
              if (editingId) {
                removeSuccession(editingId);
                setEditingId(null);
                setMsg("Removed.");
              }
            }}
          />
        </div>

        <div className={cn("min-h-[200px] min-w-0 lg:col-start-2 lg:row-start-2", hide(tab, "gantt") + " lg:block")}>
          <SuccessionTimeline
            farm={farm}
            selectedBlockId={block?.id ?? null}
            selectedBedIndex={bedIndex}
            onSelectBed={selectBed}
          />
        </div>

        <div
          className={cn(
            "min-h-0 lg:col-start-1 lg:col-span-2 lg:row-start-3",
            tab === "section" || tab === "ops" ? "flex flex-col" : "hidden lg:flex lg:flex-col",
          )}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <div className={cn("min-h-0", tab === "section" ? "block" : "hidden lg:block")}>
              <BedCrossSection
                crop={crop}
                units={farm.units}
                title={`${block?.name ?? "BLOCK"} ${bedIndex + 1} · ${crop.cultivar}`}
              />
            </div>
            <div className={cn("min-h-0", tab === "ops" ? "block" : "hidden lg:block")}>
              <OpsBoard
                farm={farm}
                today={today}
                onSelectTask={(blockId, index, successionId) => {
                  const succession = farm.successions.find((s) => s.id === successionId);
                  if (succession) selectExisting(blockId, index, succession);
                }}
              />
            </div>
            <div className={cn("min-h-0", tab === "section" ? "block" : "hidden lg:block")}>
              <YieldPanel farmName={farm.name} units={farm.units} rows={yields} today={today} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function hide(tab: string, self: string) {
  return tab === self ? "flex flex-col" : "hidden";
}

function PlantForm(props: {
  crop: Crop;
  slug: string;
  setSlug: (s: string) => void;
  groups: { name: string; items: Crop[] }[];
  harvestDate: string;
  setHarvestDate: (s: string) => void;
  blockId: string;
  bedIndex: number;
  blocks: { id: string; name: string; bed_count: number }[];
  onPickBed: (blockId: string, bedIndex: number) => void;
  nursery: string;
  transplant: string;
  clear: string;
  method: "direct" | "transplant" | "either";
  plantN: number;
  yieldLabel: string;
  wholesaleLabel: string;
  directLabel: string;
  bedFeet: number;
  units: number;
  conflicts: number;
  editing: boolean;
  msg: string | null;
  onCommit: () => void;
  onFill: () => void;
  onShare: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const block = props.blocks.find((b) => b.id === props.blockId);
  return (
    <form
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface"
      onSubmit={(e) => {
        e.preventDefault();
        props.onCommit();
      }}
    >
      <div className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        {props.editing ? "Edit succession" : "New succession"}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <label className="block font-mono text-[10px] tracking-widest text-subtle">
          CULTIVAR
          <select
            value={props.slug}
            onChange={(e) => props.setSlug(e.target.value)}
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
          >
            {props.groups.map((group) => (
              <optgroup key={group.name} label={group.name}>
                {group.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cultivar}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block font-mono text-[10px] tracking-widest text-subtle">
          TARGET HARVEST
          <input
            type="date"
            value={props.harvestDate}
            onChange={(e) => props.setHarvestDate(e.target.value)}
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            BLOCK
            <select
              value={props.blockId}
              onChange={(e) => props.onPickBed(e.target.value, 0)}
              className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {props.blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            BED
            <select
              value={props.bedIndex}
              onChange={(e) => props.onPickBed(props.blockId, Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {Array.from({ length: block?.bed_count ?? 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-border font-mono text-[11px]">
          <Cell k="Nursery" v={fmtDay(props.nursery)} />
          <Cell k="Field" v={fmtDay(props.transplant)} />
          <Cell k="Clear" v={fmtDay(props.clear)} />
          <Cell k="Method" v={props.method === "either" ? "direct / tp" : props.method} />
          <Cell k="Bed-ft" v={String(props.bedFeet)} />
          <Cell k="Units" v={String(props.units)} />
          <Cell k="Plants" v={String(props.plantN)} />
          <Cell k="Yield" v={props.yieldLabel} />
          <Cell k="Wholesale" v={props.wholesaleLabel} />
          <Cell k="Direct" v={props.directLabel} />
        </dl>
        <p className={cn("font-mono text-[11px]", props.conflicts ? "text-danger" : "text-subtle")}>
          {props.conflicts ? `${props.conflicts} conflict(s) on this bed` : "No occupancy conflict"}
        </p>
        {props.msg ? <p className="font-mono text-[11px] text-accent">{props.msg}</p> : null}
        <Link
          to="/crop/$slug"
          params={{ slug: props.slug }}
          className="inline-block font-mono text-[10px] tracking-widest text-muted uppercase hover:text-accent"
        >
          Open spec →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border p-3">
        <button
          type="submit"
          className="h-10 flex-1 rounded-md bg-accent px-3 font-display text-base font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
        >
          {props.editing ? "Update" : "Schedule"}
        </button>
        <button
          type="button"
          onClick={props.onFill}
          className="h-10 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-fg"
        >
          FILL SEASON
        </button>
        <button
          type="button"
          onClick={props.onShare}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-fg"
        >
          <Link2 className="size-3.5" />
          SHARE
        </button>
        {props.editing ? (
          <>
            <button
              type="button"
              onClick={props.onCancel}
              className="h-10 rounded-md px-3 font-mono text-[10px] tracking-widest text-muted"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={props.onDelete}
              className="h-10 rounded-md px-3 font-mono text-[10px] tracking-widest text-danger"
            >
              REMOVE
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

function fmtDay(isoDate: string): string {
  if (!isoDate || isoDate === "—") return "—";
  try {
    return format(parseISO(isoDate), "MMM d");
  } catch {
    return isoDate;
  }
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-2 py-2">
      <dt className="text-[9px] tracking-[0.16em] text-faint">{k.toUpperCase()}</dt>
      <dd className="mt-0.5 tabular text-fg">{v}</dd>
    </div>
  );
}

function YieldPanel({
  farmName,
  units,
  rows,
  today,
}: {
  farmName: string;
  units: "imperial" | "metric";
  rows: ReturnType<typeof farmYield>;
  today: Date;
}) {
  const farm = useFarmStore((s) => s.farm);
  const totW = rows.reduce((s, r) => s + r.wholesaleUsd, 0);
  const totD = rows.reduce((s, r) => s + r.directUsd, 0);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>Yield rollup · {farmName}</span>
        <span className="text-faint">{format(today, "d MMM yyyy")}</span>
      </div>
      <div className="max-h-[260px] overflow-auto">
        <table className="w-full font-mono text-xs">
          <thead className="sticky top-0 bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-3 py-2 text-left">CULTIVAR</th>
              <th className="px-3 py-2 text-right">FT</th>
              <th className="px-3 py-2 text-right">YIELD</th>
              <th className="px-3 py-2 text-right">WH $</th>
              <th className="px-3 py-2 text-right">DIR $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = getCrop(r.cropId);
              const sample = farm.successions.find((s) => s.crop_id === r.cropId);
              const phase = sample ? PHASE_LABEL[successionPhase(sample, today)] : "—";
              return (
                <tr key={r.cropId} className="border-t border-border">
                  <td className="px-3 py-2 text-fg">
                    {c?.cultivar ?? r.cropId}
                    <span className="ml-2 text-[10px] tracking-widest text-faint">{phase}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular text-muted">{formatBedFt(r.bedFt, units)}</td>
                  <td className="px-3 py-2 text-right tabular text-fg">
                    {r.unit === "pound"
                      ? formatWeight(r.yieldAmount, units)
                      : `${Math.round(r.yieldAmount)} ${r.unitLabel}`}
                  </td>
                  <td className="px-3 py-2 text-right tabular text-muted">{formatUsd(r.wholesaleUsd)}</td>
                  <td className="px-3 py-2 text-right tabular text-fg">{formatUsd(r.directUsd)}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  No successions yet.
                </td>
              </tr>
            ) : (
              <tr className="border-t border-border bg-elevated">
                <td className="px-3 py-2 text-[10px] tracking-widest text-subtle">TOTAL</td>
                <td />
                <td />
                <td className="px-3 py-2 text-right tabular text-muted">{formatUsd(totW)}</td>
                <td className="px-3 py-2 text-right tabular text-fg">{formatUsd(totD)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
