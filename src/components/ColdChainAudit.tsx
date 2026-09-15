import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EconomicsSettings, StorageThermalZone } from "@/types/economics";
import type { FarmState, Units } from "@/types/farm";
import { cropBySlug } from "@/lib/crops";
import { AC_WINDOW_SIZES } from "@/lib/economics-calc";
import {
  farmAudits,
  packMixWarnings,
  resolveEconomics,
  resolveWeekStart,
  weeklyPicks,
  ZONE_META,
} from "@/lib/economicsMath";
import { formatTemp, formatWeight } from "@/lib/math";
import { cn } from "@/lib/utils";

const ZONE_SHORT: Record<StorageThermalZone, string> = {
  "zone-1-cold-wet": "Z1",
  "zone-2-cool-humid": "Z2",
  "zone-3-ambient-dry": "Z3",
  "zone-curing": "CURE",
};

const ZONE_FILL: Record<StorageThermalZone, string> = {
  "zone-1-cold-wet": "var(--color-accent)",
  "zone-2-cool-humid": "var(--color-ok)",
  "zone-3-ambient-dry": "var(--color-muted)",
  "zone-curing": "var(--color-warn)",
};

type Props = {
  farm: FarmState;
  onPatch: (partial: Partial<EconomicsSettings>) => void;
  zoneId?: StorageThermalZone;
};

export function ColdChainAudit({ farm, onPatch, zoneId }: Props) {
  const settings = resolveEconomics(farm);
  const units = farm.units;
  const weekStart = resolveWeekStart(farm);
  const picks = useMemo(() => weeklyPicks(farm, cropBySlug, weekStart), [farm, weekStart]);
  const audits = useMemo(() => farmAudits(farm, cropBySlug, weekStart), [farm, weekStart]);
  const warnings = packMixWarnings(picks);
  const shown = zoneId ? audits.filter((a) => a.target_zone === zoneId) : audits;
  const flags = shown.flatMap((a) => a.chill_flags);
  const existingCuft = settings.cooler_length_ft * settings.cooler_width_ft * settings.cooler_height_ft;
  const peakLoad = Math.max(0, ...audits.map((a) => a.peak_btu_per_hr));
  const chart = audits.map((a) => ({
    short: ZONE_SHORT[a.target_zone],
    peak: a.peak_btu_per_hr,
    ac: a.total_field_mass_lbs > 0 ? a.recommended_ac_btu_rating : 0,
  }));

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Cooler · field heat · CoolBot
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6">
          <NumField
            label="Field temp"
            value={settings.field_temp_f}
            step={1}
            min={40}
            max={110}
            onChange={(n) => onPatch({ field_temp_f: n })}
            hint={`pulled at ${formatTemp(settings.field_temp_f, units)}`}
          />
          <NumField
            label="Pull-down"
            value={settings.pull_down_hours}
            step={0.5}
            min={0.5}
            max={24}
            onChange={(n) => onPatch({ pull_down_hours: n })}
            hint="hours to setpoint (not hydro)"
          />
          <NumField
            label="Cooler L"
            value={settings.cooler_length_ft}
            step={1}
            min={4}
            max={40}
            onChange={(n) => onPatch({ cooler_length_ft: n })}
            hint="ft interior"
          />
          <NumField
            label="Cooler W"
            value={settings.cooler_width_ft}
            step={1}
            min={4}
            max={20}
            onChange={(n) => onPatch({ cooler_width_ft: n })}
            hint="ft"
          />
          <NumField
            label="Cooler H"
            value={settings.cooler_height_ft}
            step={0.5}
            min={6}
            max={12}
            onChange={(n) => onPatch({ cooler_height_ft: n })}
            hint="ft"
          />
          <div className="bg-elevated px-3 py-2">
            <p className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">Box volume</p>
            <p className="mt-1 font-mono text-sm tabular text-fg">{formatVolume(existingCuft, units)}</p>
            <p className="mt-1 font-mono text-[9px] tracking-widest text-faint">55% usable for totes</p>
          </div>
        </div>
      </section>

      <figure className="overflow-hidden rounded-lg border border-border bg-surface">
        <figcaption className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          <span>Peak BTU / hr by zone</span>
          <span className="text-faint">
            Q = m·cp·ΔT / {settings.pull_down_hours} h + respiration · 1.25× CoolBot
          </span>
        </figcaption>
        <div className="h-[240px] w-full p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="short"
                tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                stroke="var(--color-border)"
              />
              <YAxis
                tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                tickFormatter={(v: number) => formatBtu(v)}
                stroke="var(--color-border)"
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                }}
                formatter={(value, name) => [
                  formatBtu(Number(value)),
                  name === "peak" ? "Peak load" : "Window AC",
                ]}
              />
              <Legend
                wrapperStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10 }}
                formatter={(v) => (v === "peak" ? "Peak BTU/hr" : "Recommended AC")}
              />
              <Bar dataKey="peak" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ac" fill="var(--color-ok)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      {warnings.map((w) => (
        <p key={w} className="rounded-md border border-danger/40 bg-elevated px-3 py-2 font-mono text-xs text-danger">
          {w}
        </p>
      ))}
      {flags.map((f) => (
        <p key={`${f.crop_id}-${f.cooler_temp_f}`} className="rounded-md border border-danger/40 bg-elevated px-3 py-2 font-mono text-xs text-danger">
          {f.message}
        </p>
      ))}
      {warnings.length === 0 && flags.length === 0 && peakLoad > 0 ? (
        <p className="rounded-md border border-ok/30 bg-elevated px-3 py-2 font-mono text-xs text-ok">
          Zones split. Peak {formatBtu(peakLoad)}/hr. Window units {AC_WINDOW_SIZES.map((n) => n / 1000).join("/")} kBTU.
          Hydro is a first-stage method — compressor still sized on {settings.pull_down_hours} h room pull-down.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((a) => {
          const meta = ZONE_META[a.target_zone];
          const empty = a.total_field_mass_lbs <= 0;
          return (
            <article
              key={a.target_zone}
              className={cn("rounded-lg border border-border bg-surface", empty && "opacity-70")}
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                <Link
                  to="/economics/$slug"
                  params={{ slug: a.target_zone }}
                  className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase hover:text-accent"
                >
                  {meta.label}
                </Link>
                <span className="font-mono text-[10px] tracking-widest" style={{ color: ZONE_FILL[a.target_zone] }}>
                  {formatTemp(meta.temp_f, units)} · {meta.rh}
                </span>
              </header>
              <dl className="grid grid-cols-2 gap-px bg-border">
                <Tile k="Mass" v={formatWeight(a.total_field_mass_lbs, units)} />
                <Tile k="Totes" v={String(a.total_totes)} />
                <Tile k="Field heat" v={formatBtu(a.sensible_heat_btu)} />
                <Tile k="Still breathing / d" v={formatBtu(a.respiration_heat_btu_per_day)} />
                <Tile k="Peak" v={`${formatBtu(a.peak_btu_per_hr)}/hr`} accent />
                <Tile
                  k="CoolBot"
                  v={empty ? "—" : `${formatBtu(a.recommended_ac_btu_rating)} · ${a.ac_tons} t`}
                  warn={!empty && a.recommended_ac_btu_rating >= 18000}
                />
                <Tile k="Displacement" v={formatVolume(a.cubic_displacement_cu_ft, units)} />
                <Tile
                  k="Floor"
                  v={a.minimum_cooler_sqft ? formatArea(a.minimum_cooler_sqft, units) : "—"}
                  warn={!empty && !a.fits_existing_cooler}
                />
              </dl>
              <p
                className={cn(
                  "border-t border-border px-3 py-2 font-mono text-[10px] tracking-widest",
                  empty ? "text-faint" : a.chill_flags.length ? "text-danger" : a.fits_existing_cooler ? "text-ok" : "text-accent",
                )}
              >
                {empty
                  ? "No mass this week."
                  : a.chill_flags.length
                    ? `${a.chill_flags.length} chilling-injury flag${a.chill_flags.length === 1 ? "" : "s"}.`
                    : a.fits_existing_cooler
                      ? `Fits ${settings.cooler_length_ft}×${settings.cooler_width_ft}×${settings.cooler_height_ft} ft walk-in.`
                      : "Totes exceed 55% of existing box. Stack or add a second cooler."}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function formatBtu(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 BTU";
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? k.toFixed(0) : k.toFixed(1)} kBTU`;
  }
  return `${Math.round(n)} BTU`;
}

function formatVolume(cuft: number, units: Units): string {
  if (units === "metric") return `${(cuft * 0.0283168).toFixed(2)} m³`;
  return `${cuft.toFixed(1)} ft³`;
}

function formatArea(sqft: number, units: Units): string {
  if (units === "metric") return `${(sqft * 0.092903).toFixed(1)} m²`;
  return `${Math.round(sqft)} ft²`;
}

function NumField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
  hint: string;
}) {
  return (
    <label className="block font-mono text-[10px] tracking-widest text-subtle">
      {label.toUpperCase()}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
      />
      <span className="mt-1 block text-[9px] tracking-widest text-faint">{hint}</span>
    </label>
  );
}

function Tile({ k, v, warn, accent }: { k: string; v: string; warn?: boolean; accent?: boolean }) {
  return (
    <div className="bg-elevated px-3 py-3">
      <dt className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-xs tabular",
          warn ? "text-danger" : accent ? "text-accent" : "text-fg",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
