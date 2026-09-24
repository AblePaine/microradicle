import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { FarmState, Units } from "@/types/farm";
import type { SoilSettings, SoilTexture } from "@/types/soil";
import { cropBySlug } from "@/lib/crops";
import { LB_TO_KG } from "@/lib/math";
import {
  AMENDMENTS,
  balancePlan,
  blockDeficit,
  creditById,
  DEFAULT_AMENDMENT_IDS,
  equivalentMealLbs,
  estimateSoilTempF,
  farmDeficit,
  manureCreditsFromFarm,
  manurePOverload,
  P_OVERLOAD_RATIO,
  resolveSoil,
  selectedAmendments,
  soilAmendmentBalance,
} from "@/lib/soilMath";
import { elementalKToK2O, elementalPToP2O5, round2, round3 } from "@/lib/soil-chemistry";
import { cn } from "@/lib/utils";

const TEXTURES: { id: SoilTexture; label: string }[] = [
  { id: "sand", label: "Sand" },
  { id: "silt-loam", label: "Silt loam" },
  { id: "clay", label: "Clay" },
];

type Props = {
  farm: FarmState;
  onPatchSoil: (partial: Partial<SoilSettings>) => void;
  blockId?: string;
};

export function SoilNutrientBalancer({ farm, onPatchSoil, blockId }: Props) {
  const settings = resolveSoil(farm);
  const units = farm.units;
  const palette = selectedAmendments(settings);
  const credits = useMemo(() => manureCreditsFromFarm(farm), [farm]);
  const credit = useMemo(
    () => creditById(farm, settings.manure_credit_id),
    [farm, settings.manure_credit_id],
  );

  const deficit = useMemo(() => {
    if (blockId) return blockDeficit(farm, blockId, cropBySlug);
    return farmDeficit(farm, cropBySlug);
  }, [farm, blockId]);

  const plan = useMemo(
    () => (deficit ? balancePlan(deficit, settings, credit) : null),
    [deficit, settings, credit],
  );

  const bridge = useMemo(
    () => (deficit ? soilAmendmentBalance(deficit, settings, credit) : null),
    [deficit, settings, credit],
  );

  const blockRows = useMemo(() => {
    return farm.blocks
      .map((b) => {
        const d = blockDeficit(farm, b.id, cropBySlug);
        return d ? { block: b, plan: balancePlan(d, settings, credit) } : null;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [farm, settings, credit]);

  if (!deficit || !plan) {
    return (
      <p className="rounded-md border border-border bg-surface px-4 py-8 text-center font-mono text-xs text-muted">
        Block not on this farm.
      </p>
    );
  }

  const cropNeed = { n: deficit.total_n_lbs, p: deficit.total_p_lbs, k: deficit.total_k_lbs };
  const need = { n: plan.net_need.n_lbs, p: plan.net_need.p_lbs, k: plan.net_need.k_lbs };
  const supplied = {
    n: need.n + plan.net_balance.n_delta_lbs,
    p: need.p + plan.net_balance.p_delta_lbs,
    k: need.k + plan.net_balance.k_delta_lbs,
  };
  const nShort = supplied.n < need.n * 0.95 - 0.01;
  const kShort = supplied.k < need.k * 0.95 - 0.01;
  const manureP = manurePOverload(deficit, credit);
  const pOver = plan.net_balance.is_p_overloaded || manureP;
  const empty = cropNeed.n + cropNeed.p + cropNeed.k <= 0;
  const equiv = equivalentMealLbs(credit);

  function toggleAmendment(id: string) {
    const on = settings.selected_amendment_ids.includes(id);
    const next = on
      ? settings.selected_amendment_ids.filter((x) => x !== id)
      : [...settings.selected_amendment_ids, id];
    if (!next.length) return;
    onPatchSoil({ selected_amendment_ids: next });
  }

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Soil · temperature and texture
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <NumField
            label="Soil temp"
            value={settings.soil_temp_f}
            step={1}
            min={36}
            max={95}
            onChange={(n) => onPatchSoil({ soil_temp_f: n })}
            hint="°F at 4 in"
          />
          <NumField
            label="OM"
            value={settings.organic_matter_pct}
            step={0.5}
            min={0.5}
            max={12}
            onChange={(n) => onPatchSoil({ organic_matter_pct: n })}
            hint="% organic matter"
          />
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            TEXTURE
            <select
              value={settings.texture}
              onChange={(e) => onPatchSoil({ texture: e.target.value as SoilTexture })}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {TEXTURES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            HORIZON
            <select
              value={settings.horizon_weeks}
              onChange={(e) => onPatchSoil({ horizon_weeks: Number(e.target.value) })}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {[4, 6, 8, 12, 16].map((w) => (
                <option key={w} value={w}>
                  {w} weeks
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onPatchSoil({ soil_temp_f: estimateSoilTempF(farm.climate.latitude) })}
            className="h-11 self-end rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted hover:border-accent hover:text-accent"
          >
            EST. FROM LAT {farm.climate.latitude.toFixed(1)}°
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <Stat k="Bed-feet" v={fmtFeet(deficit.total_bed_feet, units)} />
          <Stat k="N crop took" v={fmtMass(cropNeed.n, units)} warn={nShort} />
          <Stat
            k="P crop took"
            v={`${fmtMass(cropNeed.p, units)} · ${fmtMass(elementalPToP2O5(cropNeed.p), units, 2)} P₂O₅`}
            warn={pOver}
          />
          <Stat
            k="K crop took"
            v={`${fmtMass(cropNeed.k, units)} · ${fmtMass(elementalKToK2O(cropNeed.k), units, 2)} K₂O`}
            warn={kShort}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Pasture manure · year-1 credit
        </header>
        <div className="p-3">
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            CREDIT SOURCE
            <select
              id="manure-credit"
              value={settings.manure_credit_id ?? ""}
              onChange={(e) => onPatchSoil({ manure_credit_id: e.currentTarget.value || null })}
              onInput={(e) => onPatchSoil({ manure_credit_id: (e.currentTarget as HTMLSelectElement).value || null })}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              <option value="">None — bagged meals only</option>
              {credits.map((c) => (
                <option key={c.source_id} value={c.source_id}>
                  {c.source_name}
                </option>
              ))}
            </select>
          </label>
          {credits.length === 0 ? (
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
              No paddock stays on the ledger yet.{" "}
              <Link to="/pasture" className="text-accent hover:underline">
                Save a move on pasture
              </Link>{" "}
              and it will show up here as N, P, and K you do not have to buy.
            </p>
          ) : null}
        </div>
        {credit && bridge ? (
          <div
            id="manure-credit-banner"
            className={cn(
              "border-t px-3 py-3 font-mono text-[11px] leading-relaxed",
              manureP ? "border-danger/40 bg-danger/10 text-danger" : "border-ok/30 bg-ok/5 text-fg",
            )}
          >
            <p>
              {credit.source_name} puts{" "}
              <span className="text-accent">{fmtMass(credit.available_n_lbs, units, 2)} plant-available N</span>,{" "}
              {fmtMass(credit.available_p2o5_lbs, units, 2)} P₂O₅, and {fmtMass(credit.available_k2o_lbs, units, 2)} K₂O
              on these beds. That stands in for about {fmtMass(equiv.feather_meal_12_0_0_lbs, units, 1)} feather meal
              12-0-0, {fmtMass(equiv.bone_meal_3_15_0_lbs, units, 1)} bone meal, and{" "}
              {fmtMass(equiv.potash_0_0_50_lbs, units, 1)} sulfate of potash — roughly $
              {bridge.commercial_savings_usd.toFixed(0)} of bags left on the pallet.
            </p>
            {manureP ? (
              <p className="mt-2">
                Phosphate from this manure already overshoots what the crop took out by more than 25%. Skip bone meal
                on this block. Spread the flock over more bed-feet or keep the next tractor off it.
              </p>
            ) : (
              <p className="mt-2 text-muted">
                Recipe below is the remainder after this credit. Year-1 N is 50% of poultry manure, 40% of sheep and
                cattle manure.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {empty ? (
        <p className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-xs text-muted">
          No crop extraction on this {blockId ? "block" : "farm"}. Drop successions in the planner first.
        </p>
      ) : manureP ? (
        <p className="rounded-md border border-danger/40 bg-elevated px-3 py-2 font-mono text-xs text-danger">
          Phosphorus cap — manure P₂O₅ is over 125% of crop removal. Don't add bone meal.
        </p>
      ) : pOver ? (
        <p className="rounded-md border border-danger/40 bg-elevated px-3 py-2 font-mono text-xs text-danger">
          P overload — available P exceeds deficit × {P_OVERLOAD_RATIO}. Drop the manure, compost,
          or bone meal, or add a 0-P N source (feather meal, blood meal).
        </p>
      ) : nShort || kShort ? (
        <p className="rounded-md border border-accent/40 bg-elevated px-3 py-2 font-mono text-xs text-accent">
          {nShort ? "Short on N at this temperature — raise the soil temp, extend the horizon, or add a hotter N meal. " : ""}
          {kShort ? "Short on K — keep sulfate of potash or langbeinite on the palette." : ""}
        </p>
      ) : (
        <p className="rounded-md border border-ok/30 bg-elevated px-3 py-2 font-mono text-xs text-ok">
          Recipe covers N and K after manure. P held at ≤ {Math.round((P_OVERLOAD_RATIO - 1) * 100)}% over removal.
        </p>
      )}

      <section className="rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Palette · OMRI listed</p>
          <button
            type="button"
            onClick={() => onPatchSoil({ selected_amendment_ids: [...DEFAULT_AMENDMENT_IDS] })}
            className="h-11 px-2 font-mono text-[10px] tracking-widest text-accent"
          >
            RESET 12-0-0 / 3-15-0 / 0-0-50
          </button>
        </header>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
          {AMENDMENTS.map((a) => {
            const on = settings.selected_amendment_ids.includes(a.id);
            return (
              <li key={a.id} className="border-b border-border last:border-0 sm:odd:border-r lg:[&:nth-child(3n)]:border-r-0">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-elevated">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleAmendment(a.id)}
                    className="size-4 accent-accent"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-fg">{a.name}</span>
                    <span className="block font-mono text-[10px] tracking-widest text-faint">
                      {a.n_pct}-{a.p_pct}-{a.k_pct}
                      {a.ca_pct > 1 ? ` · Ca ${a.ca_pct}%` : ""}
                      {a.mg_pct > 1 ? ` · Mg ${a.mg_pct}%` : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Recipe · {deficit.block_name}
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] font-mono text-xs">
            <thead className="bg-elevated text-[10px] tracking-widest text-faint">
              <tr>
                <th className="px-3 py-2 text-left">MATERIAL</th>
                <th className="px-3 py-2 text-right">{units === "metric" ? "KG" : "LB"}</th>
                <th className="px-3 py-2 text-right">{units === "metric" ? "KG/30.5 m" : "LB/100 FT"}</th>
                <th className="px-3 py-2 text-right">OZ/FT</th>
                <th className="px-3 py-2 text-right">G/M</th>
                <th className="px-3 py-2 text-right">QT/100 FT</th>
                <th className="px-3 py-2 text-right">BAGS</th>
                <th className="px-3 py-2 text-right">N</th>
                <th className="px-3 py-2 text-right">P</th>
                <th className="px-3 py-2 text-right">K</th>
              </tr>
            </thead>
            <tbody>
              {plan.recipe.map((row) => (
                <tr key={row.amendment.id} className="border-t border-border">
                  <td className="px-3 py-2 text-fg">{row.amendment.name}</td>
                  <td className="px-3 py-2 text-right tabular text-accent">{fmtMass(row.lbs_required, units)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.lbs_per_100ft_bed, units)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{row.oz_per_linear_bed_foot.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{row.grams_per_linear_meter.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{row.quarts_per_100ft_bed.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular">
                    {row.full_50lb_bags_needed} × {row.amendment.standard_bag_weight_lbs} lb
                  </td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.n_supplied_lbs, units, 3)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.p_supplied_lbs, units, 3)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.k_supplied_lbs, units, 3)}</td>
                </tr>
              ))}
              {plan.recipe.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted">
                    {empty ? "Nothing to replace." : "The palette can't build a recipe without going negative. Add feather meal, sulfate of potash, and bone meal."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-4">
          <BalanceTile k="N Δ" v={plan.net_balance.n_delta_lbs} need={need.n} got={supplied.n} units={units} />
          <BalanceTile k="P Δ" v={plan.net_balance.p_delta_lbs} need={need.p} got={supplied.p} units={units} danger={pOver} />
          <BalanceTile k="K Δ" v={plan.net_balance.k_delta_lbs} need={need.k} got={supplied.k} units={units} />
          <div className="bg-elevated px-3 py-3">
            <p className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">Buy list</p>
            <p className="mt-1 font-mono text-xs text-fg">
              {plan.recipe.length
                ? plan.recipe.map((r) => `${r.full_50lb_bags_needed} bag ${shortName(r.amendment.name)}`).join(" · ")
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {deficit.crop_breakdown.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Extraction · crop mix
          </header>
          <table className="w-full font-mono text-xs">
            <thead className="bg-elevated text-[10px] tracking-widest text-faint">
              <tr>
                <th className="px-3 py-2 text-left">CULTIVAR</th>
                <th className="px-3 py-2 text-right">FEET</th>
                <th className="px-3 py-2 text-right">N</th>
                <th className="px-3 py-2 text-right">P</th>
                <th className="px-3 py-2 text-right">K</th>
              </tr>
            </thead>
            <tbody>
              {deficit.crop_breakdown.map((row) => (
                <tr key={row.crop_id} className="border-t border-border">
                  <td className="px-3 py-2 text-fg">{row.crop_name}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{fmtFeet(row.bed_feet, units)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.n_lbs, units, 3)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.p_lbs, units, 3)}</td>
                  <td className="px-3 py-2 text-right tabular">{fmtMass(row.k_lbs, units, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {!blockId ? (
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Blocks · per-valve recipe
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] font-mono text-xs">
              <thead className="bg-elevated text-[10px] tracking-widest text-faint">
                <tr>
                  <th className="px-3 py-2 text-left">BLOCK</th>
                  <th className="px-3 py-2 text-right">FEET</th>
                  <th className="px-3 py-2 text-right">N</th>
                  <th className="px-3 py-2 text-right">P</th>
                  <th className="px-3 py-2 text-right">K</th>
                  <th className="px-3 py-2 text-left">TOP MATERIAL</th>
                  <th className="px-3 py-2 text-left">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {blockRows.map(({ block, plan: bp }) => {
                  const top = bp.recipe[0];
                  const over = bp.net_balance.is_p_overloaded;
                  const short = bp.deficit.total_n_lbs + bp.net_balance.n_delta_lbs < bp.deficit.total_n_lbs * 0.95 - 0.01;
                  return (
                    <tr key={block.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Link to="/soil/$slug" params={{ slug: block.id }} className="text-fg hover:text-accent">
                          {block.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular text-muted">{fmtFeet(bp.deficit.total_bed_feet, units)}</td>
                      <td className="px-3 py-2 text-right tabular">{fmtMass(bp.deficit.total_n_lbs, units, 3)}</td>
                      <td className="px-3 py-2 text-right tabular">{fmtMass(bp.deficit.total_p_lbs, units, 3)}</td>
                      <td className="px-3 py-2 text-right tabular">{fmtMass(bp.deficit.total_k_lbs, units, 3)}</td>
                      <td className="px-3 py-2 text-muted">
                        {top ? `${fmtMass(top.lbs_required, units)} ${shortName(top.amendment.name)}` : "—"}
                      </td>
                      <td className={cn("px-3 py-2", over ? "text-danger" : short ? "text-accent" : "text-ok")}>
                        {over ? "P-OVER" : short ? "N-SHORT" : bp.deficit.total_n_lbs > 0 ? "OK" : "FALLOW"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Application cautions
          </header>
          <ul className="divide-y divide-border">
            {plan.recipe.map((row) => (
              <li key={row.amendment.id} className="px-3 py-3">
                <p className="font-mono text-xs text-fg">{row.amendment.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{row.amendment.application_cautions}</p>
              </li>
            ))}
            {plan.recipe.length === 0 ? (
              <li className="px-3 py-6 text-center font-mono text-xs text-muted">No materials on this block.</li>
            ) : null}
          </ul>
        </section>
      )}

      <p className="font-mono text-[10px] tracking-widest text-faint">
        Elemental N / P / K. Fertilizer labels are N–P₂O₅–K₂O. P first-season frac: rock 0.15 · bone 0.65 · compost 0.5.
        Palette locked to {palette.length} source{palette.length === 1 ? "" : "s"}. Δ is supplied − removal.
      </p>
    </div>
  );
}

function fmtMass(lb: number, units: Units, digits = 2): string {
  if (units === "metric") return `${(lb * LB_TO_KG).toFixed(digits)} kg`;
  return `${lb.toFixed(digits)} lb`;
}

function fmtFeet(ft: number, units: Units): string {
  if (units === "metric") return `${(ft * 0.3048).toFixed(1)} m`;
  return `${round2(ft)} ft`;
}

function shortName(name: string): string {
  return name.replace(/\s+\d.*$/, "");
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

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="bg-elevated px-3 py-3">
      <dt className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd className={cn("mt-1 font-mono text-xs tabular", warn ? "text-danger" : "text-fg")}>{v}</dd>
    </div>
  );
}

function BalanceTile({
  k,
  v,
  need,
  got,
  units,
  danger,
}: {
  k: string;
  v: number;
  need: number;
  got: number;
  units: Units;
  danger?: boolean;
}) {
  const pct = need > 0 ? Math.min(140, (got / need) * 100) : got > 0 ? 140 : 0;
  const ok = !danger && got >= need * 0.95;
  return (
    <div className="bg-elevated px-3 py-3">
      <p className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</p>
      <p className={cn("mt-1 font-mono text-sm tabular", danger ? "text-danger" : ok ? "text-ok" : "text-accent")}>
        {v >= 0 ? "+" : ""}
        {fmtMass(v, units, 3)}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-bg">
        <div
          className={cn("h-full", danger ? "bg-danger" : ok ? "bg-ok" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function nAppliedById(
  recipe: Array<{ amendment: { id: string; n_pct: number }; lbs_required: number }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of recipe) {
    out[row.amendment.id] = round3(row.lbs_required * (row.amendment.n_pct / 100));
  }
  return out;
}
