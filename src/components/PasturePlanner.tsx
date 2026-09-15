import { Link } from "@tanstack/react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SPECIES_BY_CLASS, getSpecies } from "@/lib/pasture";
import {
  MAX_HEAD_PER_ROTATION,
  MAX_MOVE_DAYS,
  acresFromSqft,
  clampHead,
  clampMoveDays,
  computeRotation,
  paddockSideFt,
} from "@/lib/pastureMath";
import { formatWeight } from "@/lib/math";
import { cn } from "@/lib/utils";
import type { Units } from "@/types/farm";
import {
  CLASS_LABEL,
  FENCE_LABEL,
  FORAGE_STANDS,
  NET_ROLL_FT,
  STAND_LABEL,
  type PastureForageStand,
  type PastureRotationQueueItem,
} from "@/types/pasture";

const DEFAULT_SPECIES = "ps-broiler-cornish-cross";

function defaultHeadFor(id: string): number {
  const s = getSpecies(id);
  if (!s) return 80;
  if (s.livestockClass === "pastured-broilers") return 80;
  if (s.livestockClass === "pastured-layers") return 40;
  if (s.livestockClass === "hair-sheep") return 12;
  return 6;
}

type Props = {
  units: Units;
  rotations: PastureRotationQueueItem[];
  initialSpeciesId?: string;
  onAdd: (
    speciesId: string,
    headCount: number,
    stand: PastureForageStand,
    startDate: string,
    moveDays: number,
    allocatedSqft: number,
  ) => void;
  onRemove: (id: string) => void;
};

export function PasturePlanner({ units, rotations, initialSpeciesId, onAdd, onRemove }: Props) {
  const today = isoToday();
  const [speciesId, setSpeciesId] = useState(() =>
    initialSpeciesId && getSpecies(initialSpeciesId) ? initialSpeciesId : DEFAULT_SPECIES,
  );
  const [head, setHead] = useState(() => defaultHeadFor(initialSpeciesId && getSpecies(initialSpeciesId) ? initialSpeciesId : DEFAULT_SPECIES));
  const [stand, setStand] = useState<PastureForageStand>("standard-perennial-mix");
  const [moveDays, setMoveDays] = useState(1);
  const [startDate, setStartDate] = useState(today);
  const [allocated, setAllocated] = useState(0);
  const [allocTouched, setAllocTouched] = useState(false);

  useEffect(() => {
    if (initialSpeciesId && getSpecies(initialSpeciesId)) setSpeciesId(initialSpeciesId);
  }, [initialSpeciesId]);

  const spec = getSpecies(speciesId) ?? getSpecies(DEFAULT_SPECIES);

  useEffect(() => {
    if (!spec) return;
    setMoveDays(spec.recommendedMoveFrequencyDays);
    setHead(spec.livestockClass === "pastured-broilers" ? 80 : spec.livestockClass === "pastured-layers" ? 40 : spec.livestockClass === "hair-sheep" ? 12 : 6);
    setAllocTouched(false);
    setAllocated(0);
  }, [spec?.id]);

  const preview = useMemo(() => {
    if (!spec) return null;
    return computeRotation(spec, head, stand, startDate, moveDays, allocTouched ? allocated : 0, "preview");
  }, [spec, head, stand, startDate, moveDays, allocated, allocTouched]);

  function queue() {
    if (!spec || !preview) return;
    onAdd(spec.id, clampHead(head), stand, startDate, clampMoveDays(moveDays), allocTouched ? allocated : 0);
  }

  return (
    <div className="min-w-0 space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Queue · paddock rotation
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block font-mono text-[10px] tracking-widest text-subtle sm:col-span-2">
            SPECIES
            <select
              id="pasture-species"
              value={spec?.id ?? ""}
              onChange={(e) => setSpeciesId(e.target.value)}
              aria-label="Livestock species"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {SPECIES_BY_CLASS.map((g) => (
                <optgroup key={g.classId} label={CLASS_LABEL[g.classId]}>
                  {g.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.breed}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            HEAD
            <input
              id="pasture-head"
              type="number"
              min={1}
              max={MAX_HEAD_PER_ROTATION}
              step={1}
              value={head}
              onChange={(e) => setHead(Number(e.target.value))}
              aria-label="Head count"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              {spec ? `${spec.avgBodyWeightLbs} lb · ${spec.animalUnitEquivalent} AU` : "—"}
            </span>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            STAND
            <select
              id="pasture-stand"
              value={stand}
              onChange={(e) => setStand(e.target.value as PastureForageStand)}
              aria-label="Forage stand"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {FORAGE_STANDS.map((s) => (
                <option key={s} value={s}>
                  {STAND_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            MOVE EVERY
            <input
              id="pasture-move"
              type="number"
              min={1}
              max={MAX_MOVE_DAYS}
              step={1}
              value={moveDays}
              onChange={(e) => setMoveDays(Number(e.target.value))}
              aria-label="Move interval days"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              {spec ? spec.targetGrazeDensity : "days"}
            </span>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            START
            <input
              id="pasture-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Rotation start date"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            THIS PADDOCK
            <input
              id="pasture-sqft"
              type="number"
              min={0}
              step={10}
              value={allocTouched ? allocated : (preview?.recommended_paddock_sqft ?? 0)}
              onChange={(e) => {
                setAllocTouched(true);
                setAllocated(Number(e.target.value));
              }}
              aria-label="Allocated paddock square feet"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              sqft you are actually giving them
            </span>
          </label>
          <div className="flex flex-col justify-end">
            <button
              id="pasture-queue"
              type="button"
              disabled={!spec}
              onClick={queue}
              className="flex h-11 items-center justify-center bg-accent px-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent-fg uppercase transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
            >
              Queue rotation
            </button>
          </div>
        </div>

        {preview?.overgrazing_warning ? (
          <div
            id="overgraze-banner"
            role="alert"
            className="flex items-start gap-2 border-t border-danger/40 bg-danger/10 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-danger"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              This paddock is short of the forage they need for {preview.move_interval_days} day
              {preview.move_interval_days === 1 ? "" : "s"}. Give them about{" "}
              {formatPaddock(preview.recommended_paddock_sqft, units)} or they will graze it into the dirt.
            </span>
          </div>
        ) : null}

        {preview ? (
          <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4 lg:grid-cols-7">
            <Stat k="Daily DM" v={`${preview.total_daily_dm_lbs} lb`} />
            <Stat k="Need" v={formatPaddock(preview.recommended_paddock_sqft, units)} />
            <Stat k="Shelter" v={formatPaddock(preview.shelter_sqft_needed, units)} />
            <Stat
              k="Net rolls"
              v={preview.recommended_netting_rolls === 0 ? "none" : `${preview.recommended_netting_rolls} × ${NET_ROLL_FT} ft`}
            />
            <Stat k="Spring rest" v={`${preview.spring_rest_days} d`} />
            <Stat k="Summer rest" v={`${preview.summer_rest_days} d`} />
            <Stat k="Manure N" v={formatWeight(preview.manure_n_lbs, units)} />
          </dl>
        ) : null}
      </section>

      {preview && spec ? (
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <PaddockFace rotation={preview} fence={FENCE_LABEL[spec.nettingSpec.fenceType]} units={units} />
          <RestPanel rotation={preview} units={units} />
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-3 py-1.5">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Rotations · {rotations.length} queued · {rotations.reduce((s, r) => s + r.head_count, 0)} head
          </p>
          <p className="font-mono text-[10px] tracking-widest text-faint uppercase">
            {round1(rotations.reduce((s, r) => s + r.total_daily_dm_lbs, 0))} lb DM/d
          </p>
        </header>
        {rotations.length === 0 ? (
          <p className="px-3 py-10 text-center font-mono text-sm text-muted">
            Queue a flock or herd to occupy a paddock.
          </p>
        ) : (
          <>
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left font-mono text-[11px]">
                <thead className="border-b border-border text-[10px] tracking-[0.16em] text-faint uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Breed</th>
                    <th className="px-3 py-2 text-right font-medium">Head</th>
                    <th className="px-3 py-2 font-medium">Move</th>
                    <th className="px-3 py-2 font-medium">Paddock</th>
                    <th className="px-3 py-2 font-medium">Rolls</th>
                    <th className="px-3 py-2 font-medium">Rest</th>
                    <th className="px-3 py-2 font-medium">Manure N</th>
                    <th className="px-3 py-2 text-right font-medium">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {rotations.map((r) => (
                    <RotationRow key={r.id} rotation={r} units={units} onRemove={onRemove} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {rotations.map((r) => (
                <li key={r.id} className="px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to="/pasture/$slug"
                        params={{ slug: r.species_id }}
                        className="font-display text-lg font-semibold tracking-wide text-fg"
                      >
                        {r.species_name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted">
                        {r.head_count} head · every {r.move_interval_days} d
                        {r.overgrazing_warning ? " · SHORT" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(r.id)}
                      aria-label={`Remove ${r.species_name}`}
                      className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
                    <div>{formatPaddock(r.allocated_paddock_sqft, units)}</div>
                    <div>
                      {r.recommended_netting_rolls === 0
                        ? "no net"
                        : `${r.recommended_netting_rolls} × ${NET_ROLL_FT} ft`}
                    </div>
                    <div>
                      Rest {r.spring_rest_days}/{r.summer_rest_days} d
                    </div>
                    <div>{formatWeight(r.manure_n_lbs, units)} N this graze</div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function RotationRow({
  rotation,
  units,
  onRemove,
}: {
  rotation: PastureRotationQueueItem;
  units: Units;
  onRemove: (id: string) => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">
        <Link to="/pasture/$slug" params={{ slug: rotation.species_id }} className="text-fg hover:text-accent">
          {rotation.species_name}
        </Link>
        {rotation.overgrazing_warning ? (
          <span className="ml-2 text-[9px] tracking-widest text-danger uppercase">short</span>
        ) : (
          <span className="ml-2 text-[9px] tracking-widest text-ok uppercase">ok</span>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular text-fg">{rotation.head_count}</td>
      <td className="px-3 py-2 tabular text-muted">{rotation.move_interval_days} d</td>
      <td className="px-3 py-2 tabular text-muted">{formatPaddock(rotation.allocated_paddock_sqft, units)}</td>
      <td className="px-3 py-2 tabular text-muted">
        {rotation.recommended_netting_rolls === 0 ? "—" : rotation.recommended_netting_rolls}
      </td>
      <td className="px-3 py-2 tabular text-muted">
        {rotation.spring_rest_days}/{rotation.summer_rest_days} d
      </td>
      <td className="px-3 py-2 tabular text-fg">{formatWeight(rotation.manure_n_lbs, units)}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onRemove(rotation.id)}
          aria-label={`Remove ${rotation.species_name}`}
          className="inline-flex size-9 items-center justify-center text-muted hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

function PaddockFace({
  rotation,
  fence,
  units,
}: {
  rotation: PastureRotationQueueItem;
  fence: string;
  units: Units;
}) {
  const side = paddockSideFt(rotation.allocated_paddock_sqft);
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex items-end justify-between gap-2 border-b border-border px-3 py-1.5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Paddock · this move</p>
        <p className="font-mono text-[10px] tracking-widest text-faint uppercase">{fence}</p>
      </header>
      <div className="flex flex-col items-center gap-3 p-4">
        <div
          className={cn(
            "flex aspect-square w-full max-w-[180px] items-center justify-center border-2 border-dashed",
            rotation.overgrazing_warning ? "border-danger/60 bg-danger/5" : "border-ok/40 bg-ok/5",
          )}
        >
          <div className="text-center font-mono">
            <p className="text-[10px] tracking-widest text-faint uppercase">Side</p>
            <p className="font-display text-2xl font-semibold tabular text-fg">
              {units === "metric" ? `${Math.round(side * 0.3048)} m` : `${side} ft`}
            </p>
          </div>
        </div>
        <p className="text-center font-mono text-[11px] text-muted">
          {formatPaddock(rotation.allocated_paddock_sqft, units)}
          {rotation.recommended_netting_rolls > 0
            ? ` · ${rotation.recommended_netting_rolls} rolls of ${NET_ROLL_FT} ft`
            : " · floorless tractor"}
        </p>
      </div>
    </section>
  );
}

function RestPanel({ rotation, units }: { rotation: PastureRotationQueueItem; units: Units }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-surface">
      <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        Recovery · manure this graze
      </header>
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
        <Stat k="Spring rest" v={`${rotation.spring_rest_days} d`} />
        <Stat k="Summer rest" v={`${rotation.summer_rest_days} d`} />
        <Stat k="Move" v={`every ${rotation.move_interval_days} d`} />
        <Stat k="N" v={formatWeight(rotation.manure_n_lbs, units)} />
        <Stat k="P2O5" v={formatWeight(rotation.manure_p2o5_lbs, units)} />
        <Stat k="K2O" v={formatWeight(rotation.manure_k2o_lbs, units)} />
      </dl>
      <p className="px-3 py-2 font-mono text-[10px] leading-relaxed tracking-wide text-faint">
        Stay off the paddock for the rest window or the next graze hits a stand that has not grown back.
        Manure numbers are what hits the soil during this stay — not a bagged fertilizer rate.
      </p>
    </section>
  );
}

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="bg-elevated px-3 py-2">
      <dt className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd className={cn("mt-0.5 font-mono text-sm tabular", warn ? "text-danger" : "text-fg")}>{v}</dd>
    </div>
  );
}

function formatPaddock(sqft: number, units: Units): string {
  if (units === "metric") {
    const m2 = Math.round(sqft * 0.0929);
    return `${m2} m²`;
  }
  const acres = acresFromSqft(sqft);
  if (sqft >= 8000) return `${acres} ac`;
  return `${Math.round(sqft)} sqft`;
}

function isoToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
