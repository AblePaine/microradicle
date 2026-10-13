import { useMemo, useState } from "react";
import type { FarmState, Units } from "@/types/farm";
import type {
  FeedBand,
  FeedSettings,
  NutrientKey,
  RationLine,
  SavedRation,
} from "@/types/feed";
import { LB_TO_KG } from "@/lib/math";
import {
  analyzeRation,
  effectiveTarget,
  INGREDIENT_BY_ID,
  INGREDIENTS,
  pearsonBalance,
  resolveFeed,
  TARGETS,
} from "@/lib/feedMath";
import { round2 } from "@/lib/soil-chemistry";
import { cn } from "@/lib/utils";

type Props = {
  farm: FarmState;
  onPatchFeed: (partial: Partial<FeedSettings>) => void;
  /** When set, edit that ration; otherwise the first saved ration. */
  rationId?: string;
  onDuplicate?: (ration: SavedRation) => void;
  onDelete?: (ration: SavedRation) => void;
};

const NUTRIENT_ROWS: Array<{
  key: NutrientKey;
  label: string;
  unit: string;
  digits: number;
  bandOf: (t: ReturnType<typeof effectiveTarget>) => FeedBand | null;
}> = [
  { key: "cp", label: "Crude protein", unit: "%", digits: 2, bandOf: (t) => t.cp },
  { key: "me", label: "Energy (ME)", unit: "kcal/kg", digits: 0, bandOf: (t) => t.me_kcal_kg },
  { key: "lys", label: "Lysine", unit: "%", digits: 2, bandOf: (t) => t.lys },
  { key: "met", label: "Methionine", unit: "%", digits: 2, bandOf: (t) => t.met },
  { key: "ca", label: "Calcium", unit: "%", digits: 2, bandOf: (t) => t.ca },
  { key: "total_p", label: "Phosphorus (total)", unit: "%", digits: 2, bandOf: () => null },
  { key: "avail_p", label: "Phosphorus (available)", unit: "%", digits: 2, bandOf: (t) => t.avail_p },
  { key: "fiber", label: "Crude fiber", unit: "%", digits: 1, bandOf: () => null },
];

const OVERRIDE_FIELDS: Array<{ field: keyof RationLine; label: string; step: number }> = [
  { field: "cp_pct", label: "CP %", step: 0.1 },
  { field: "me_kcal_kg", label: "ME kcal/kg", step: 10 },
  { field: "lys_pct", label: "Lys %", step: 0.01 },
  { field: "met_pct", label: "Met %", step: 0.01 },
  { field: "ca_pct", label: "Ca %", step: 0.01 },
  { field: "total_p_pct", label: "Total P %", step: 0.01 },
  { field: "avail_p_pct", label: "Avail P %", step: 0.01 },
  { field: "fiber_pct", label: "Fiber %", step: 0.1 },
];

const BATCH_PRESETS = [50, 100, 500, 1000];

export function FeedRationBalancer({ farm, onPatchFeed, rationId, onDuplicate, onDelete }: Props) {
  const settings = resolveFeed(farm);
  const units = farm.units;
  const ration = settings.rations.find((r) => r.id === rationId) ?? settings.rations[0];

  const target = useMemo(() => (ration ? effectiveTarget(ration) : null), [ration]);
  const analysis = useMemo(
    () => (ration && target ? analyzeRation(ration, target) : null),
    [ration, target],
  );

  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [addId, setAddId] = useState<string>(INGREDIENTS[0]?.id ?? "");
  const [pearsonOpen, setPearsonOpen] = useState(false);
  const [baseId, setBaseId] = useState("corn");
  const [sourceId, setSourceId] = useState("soybean-meal-44");
  const [aimCp, setAimCp] = useState<number | null>(null);
  const [fixedPcts, setFixedPcts] = useState<Record<string, number>>({});
  const [pearsonMsg, setPearsonMsg] = useState<string | null>(null);

  if (!ration || !target || !analysis) {
    return (
      <p className="rounded-md border border-border bg-surface px-4 py-8 text-center font-mono text-xs text-muted">
        No ration on this farm.
      </p>
    );
  }

  const aimDefault = target.cp.max != null ? round2((target.cp.min + target.cp.max) / 2) : target.cp.min;
  const aim = aimCp ?? aimDefault;
  const fixedDefault = (id: string): number => {
    if (id === "limestone") return target.bird_class === "layer" ? 9.0 : 1.0;
    if (id === "dicalcium-phosphate") return 1.5;
    if (id === "salt") return 0.4;
    return 0.6; // premix label rate
  };
  const fixedIds = ["limestone", "dicalcium-phosphate", "salt", "vitamin-mineral-premix"];

  function updateRation(patch: Partial<SavedRation>) {
    onPatchFeed({
      rations: settings.rations.map((r) =>
        r.id === ration.id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r,
      ),
    });
  }

  function updateLine(index: number, patch: Partial<RationLine>) {
    updateRation({ lines: ration.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) });
  }

  function removeLine(index: number) {
    updateRation({ lines: ration.lines.filter((_, i) => i !== index) });
  }

  function addCatalogLine() {
    if (!addId || ration.lines.some((l) => l.ingredient_id === addId)) return;
    updateRation({ lines: [...ration.lines, { ingredient_id: addId, pct: 0 }] });
  }

  function addCustomLine() {
    const n = ration.lines.filter((l) => l.ingredient_id.startsWith("custom-")).length + 1;
    updateRation({
      lines: [
        ...ration.lines,
        {
          ingredient_id: `custom-${n}`,
          name: `Custom ingredient ${n}`,
          pct: 0,
          cp_pct: 0,
          me_kcal_kg: 0,
          lys_pct: 0,
          met_pct: 0,
          ca_pct: 0,
          total_p_pct: 0,
          avail_p_pct: 0,
          fiber_pct: 0,
          price_usd_per_lb: 0,
        },
      ],
    });
  }

  function applyPearson() {
    const base = INGREDIENT_BY_ID.get(baseId);
    const source = INGREDIENT_BY_ID.get(sourceId);
    if (!base || !source) return;
    const fixed: RationLine[] = fixedIds.map((id) => ({
      ingredient_id: id,
      pct: fixedPcts[id] ?? fixedDefault(id),
    }));
    const result = pearsonBalance(aim, fixed, base, source);
    if (!result.ok) {
      setPearsonMsg(result.message);
      return;
    }
    setPearsonMsg(
      `Balanced: grain portion needed ${round2(result.required_grain_cp_pct)}% CP across ${round2(result.grain_share_pct)}% of the ration. Lines replaced — hand-tune from here.`,
    );
    updateRation({ lines: result.lines.map((l) => ({ ...l, pct: round2(l.pct) })) });
  }

  function setBand(key: NutrientKey, band: FeedBand) {
    updateRation({ target_overrides: { ...(ration.target_overrides ?? {}), [key]: band } });
  }

  const balanced =
    Math.abs(analysis.total_pct - 100) <= 0.5 && !analysis.warnings.some((w) => w.severity === "alert");

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_370px]">
      <div className="space-y-3">
        <section className="rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Step 1 · Birds & batch
          </header>
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block font-mono text-[10px] tracking-widest text-subtle sm:col-span-2">
              RATION NAME
              <input
                type="text"
                value={ration.name}
                onChange={(e) => updateRation({ name: e.target.value })}
                className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="block font-mono text-[10px] tracking-widest text-subtle sm:col-span-2">
              TARGET PRESET
              <select
                value={ration.target_id}
                onChange={(e) => {
                  const t = TARGETS.find((x) => x.id === e.target.value);
                  updateRation({
                    target_id: e.target.value,
                    target_overrides: undefined,
                    intake_lb_per_day: t?.default_intake_lb_per_day ?? ration.intake_lb_per_day,
                  });
                  setAimCp(null);
                }}
                className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
              >
                {TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <NumField
              label="Flock size"
              value={ration.flock_size}
              step={1}
              min={0}
              max={100000}
              onChange={(n) => updateRation({ flock_size: Math.round(n) })}
              hint="birds on this ration"
            />
            <NumField
              label="Intake"
              value={ration.intake_lb_per_day}
              step={0.01}
              min={0.01}
              max={2}
              onChange={(n) => updateRation({ intake_lb_per_day: n })}
              hint="lb / bird / day"
            />
            <NumField
              label="Batch size"
              value={ration.batch_lbs}
              step={10}
              min={1}
              max={2000}
              onChange={(n) => updateRation({ batch_lbs: n })}
              hint={units === "metric" ? "lb (site math is lb-first)" : "lb per mix"}
            />
            <div className="flex items-end gap-1">
              {BATCH_PRESETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => updateRation({ batch_lbs: b })}
                  className={cn(
                    "h-11 flex-1 rounded-md border px-1 font-mono text-[10px] tracking-widest",
                    ration.batch_lbs === b
                      ? "border-accent text-accent"
                      : "border-border text-muted hover:border-accent hover:text-accent",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <details className="border-t border-border px-3 py-2">
            <summary className="cursor-pointer font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
              Adjust target bands (this ration only)
            </summary>
            <div className="grid gap-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
              {NUTRIENT_ROWS.filter((r) => r.bandOf(target)).map((row) => (
                <BandField
                  key={row.key}
                  label={row.label}
                  band={row.bandOf(target)!}
                  onChange={(b) => setBand(row.key, b)}
                />
              ))}
              <NumField
                label="Fiber ceiling"
                value={target.fiber_max_pct}
                step={0.5}
                min={1}
                max={30}
                onChange={(n) =>
                  updateRation({
                    target_overrides: {
                      ...(ration.target_overrides ?? {}),
                      fiber: { min: 0, max: n },
                    },
                  })
                }
                hint="% crude fiber, max"
              />
            </div>
            <p className="pb-2 font-mono text-[10px] leading-relaxed text-faint">
              Bands default to the preset (LSU AgCenter / NRC). Loosen them here for heritage birds or
              lower-density feeding — the preset itself never changes.
            </p>
          </details>
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
              Step 2 · Ingredients
            </p>
            <p
              className={cn(
                "font-mono text-[10px] tracking-widest",
                Math.abs(analysis.total_pct - 100) <= 0.5 ? "text-ok" : "text-danger",
              )}
            >
              TOTAL {round2(analysis.total_pct)}%
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] font-mono text-xs">
              <thead className="bg-elevated text-[10px] tracking-widest text-faint">
                <tr>
                  <th className="px-3 py-2 text-left">INGREDIENT</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2 text-right">{units === "metric" ? "KG/BATCH" : "LB/BATCH"}</th>
                  <th className="px-3 py-2 text-right">$/LB</th>
                  <th className="px-3 py-2 text-right">VALUES</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {ration.lines.map((line, i) => {
                  const cat = INGREDIENT_BY_ID.get(line.ingredient_id);
                  const row = analysis.batch[i];
                  const expanded = expandedLine === i;
                  return [
                    <tr key={`row-${i}`} className="border-t border-border">
                      <td className="px-3 py-2 text-fg">
                        {line.name ?? cat?.name ?? line.ingredient_id}
                        {cat ? (
                          <span className="block text-[10px] tracking-widest text-faint">
                            CP {cat.cp_pct}% · ME {cat.me_kcal_kg}
                            {cat.ca_pct >= 1 ? ` · Ca ${cat.ca_pct}%` : ""}
                          </span>
                        ) : (
                          <span className="block text-[10px] tracking-widest text-faint">custom</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          max={100}
                          value={round2(line.pct)}
                          onChange={(e) => updateLine(i, { pct: Number(e.target.value) })}
                          className="h-9 w-20 rounded-sm border border-border bg-elevated px-2 text-right tabular text-xs text-fg outline-none focus:border-accent"
                          aria-label={`Percent for ${line.name ?? cat?.name ?? line.ingredient_id}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular text-accent">
                        {row ? fmtMass(row.lbs, units) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step={0.01}
                          min={0}
                          value={line.price_usd_per_lb ?? cat?.default_price_usd_per_lb ?? 0}
                          onChange={(e) =>
                            updateLine(i, { price_usd_per_lb: Number(e.target.value) })
                          }
                          className="h-9 w-20 rounded-sm border border-border bg-elevated px-2 text-right tabular text-xs text-fg outline-none focus:border-accent"
                          aria-label={`Price per lb for ${line.name ?? cat?.name ?? line.ingredient_id}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedLine(expanded ? null : i)}
                          className="h-9 px-2 font-mono text-[10px] tracking-widest text-accent"
                        >
                          {expanded ? "HIDE" : "EDIT"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="h-9 px-2 font-mono text-[10px] tracking-widest text-muted hover:text-danger"
                          aria-label={`Remove ${line.name ?? cat?.name ?? line.ingredient_id}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>,
                    expanded ? (
                      <tr key={`edit-${i}`} className="border-t border-border/60 bg-elevated/50">
                        <td colSpan={6} className="px-3 py-3">
                          {line.name !== undefined || !cat ? (
                            <label className="mb-3 block max-w-xs font-mono text-[10px] tracking-widest text-subtle">
                              NAME
                              <input
                                type="text"
                                value={line.name ?? ""}
                                onChange={(e) => updateLine(i, { name: e.target.value })}
                                className="mt-1 h-9 w-full rounded-sm border border-border bg-elevated px-2 text-xs text-fg outline-none focus:border-accent"
                              />
                            </label>
                          ) : null}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {OVERRIDE_FIELDS.map((f) => (
                              <label
                                key={f.field}
                                className="block font-mono text-[9px] tracking-widest text-subtle"
                              >
                                {f.label.toUpperCase()}
                                <input
                                  type="number"
                                  step={f.step}
                                  min={0}
                                  placeholder={
                                    cat ? String(cat[f.field as keyof typeof cat] ?? "") : "0"
                                  }
                                  value={
                                    typeof line[f.field] === "number"
                                      ? (line[f.field] as number)
                                      : ""
                                  }
                                  onChange={(e) =>
                                    updateLine(i, {
                                      [f.field]:
                                        e.target.value === "" ? undefined : Number(e.target.value),
                                    })
                                  }
                                  className="mt-0.5 h-9 w-full rounded-sm border border-border bg-elevated px-2 tabular text-xs text-fg outline-none focus:border-accent"
                                />
                              </label>
                            ))}
                          </div>
                          <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
                            Blank = catalog value. Override when your feed tested differently — your
                            corn is not book corn. Overrides live on this ration only.
                          </p>
                          {cat?.cautions ? (
                            <p className="mt-1 text-xs leading-relaxed text-muted">{cat.cautions}</p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
                {ration.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted">
                      No ingredients yet. Add from the library below, or run the Pearson
                      auto-balance.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-end gap-2 border-t border-border p-3">
            <label className="block min-w-52 flex-1 font-mono text-[10px] tracking-widest text-subtle">
              ADD FROM LIBRARY
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
              >
                {INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addCatalogLine}
              className="h-11 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted hover:border-accent hover:text-accent"
            >
              ADD
            </button>
            <button
              type="button"
              onClick={addCustomLine}
              className="h-11 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted hover:border-accent hover:text-accent"
            >
              CUSTOM INGREDIENT
            </button>
            <button
              type="button"
              onClick={() => setPearsonOpen((v) => !v)}
              className="h-11 rounded-md bg-accent px-3 font-mono text-[10px] tracking-widest text-accent-fg transition-transform duration-150 active:scale-[0.96]"
            >
              AUTO-BALANCE PROTEIN
            </button>
          </div>
          {pearsonOpen ? (
            <div className="border-t border-border p-3">
              <p className="font-mono text-[11px] leading-relaxed text-muted">
                Pearson square: fixed minerals are reserved first, then the grain portion is squared
                between an energy base and a protein source to hit the CP aim. Applying replaces the
                ration's lines.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block font-mono text-[10px] tracking-widest text-subtle">
                  ENERGY BASE
                  <select
                    value={baseId}
                    onChange={(e) => setBaseId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
                  >
                    {INGREDIENTS.filter((i) => i.cp_pct > 0).map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.cp_pct}% CP)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block font-mono text-[10px] tracking-widest text-subtle">
                  PROTEIN SOURCE
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
                  >
                    {INGREDIENTS.filter((i) => i.cp_pct > 0).map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.cp_pct}% CP)
                      </option>
                    ))}
                  </select>
                </label>
                <NumField
                  label="CP aim"
                  value={aim}
                  step={0.1}
                  min={0}
                  max={60}
                  onChange={(n) => setAimCp(n)}
                  hint="% of finished ration"
                />
                <div className="grid grid-cols-2 gap-2">
                  {fixedIds.map((id) => (
                    <NumField
                      key={id}
                      label={INGREDIENT_BY_ID.get(id)?.name.split(",")[0] ?? id}
                      value={fixedPcts[id] ?? fixedDefault(id)}
                      step={0.1}
                      min={0}
                      max={30}
                      onChange={(n) => setFixedPcts((s) => ({ ...s, [id]: n }))}
                      hint="% fixed"
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={applyPearson}
                  className="h-11 rounded-md border border-accent px-4 font-mono text-[10px] tracking-widest text-accent hover:bg-accent hover:text-accent-fg"
                >
                  APPLY SQUARE
                </button>
                {pearsonMsg ? (
                  <p className="font-mono text-[11px] leading-relaxed text-muted">{pearsonMsg}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {(onDuplicate || onDelete) && (
          <div className="flex gap-2">
            {onDuplicate ? (
              <button
                type="button"
                onClick={() => onDuplicate(ration)}
                className="h-11 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted hover:border-accent hover:text-accent"
              >
                DUPLICATE RATION
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(ration)}
                disabled={settings.rations.length <= 1}
                className="h-11 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                DELETE RATION
              </button>
            ) : null}
          </div>
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-4">
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
              Nutrient panel · {target.label}
            </p>
            <span
              className={cn(
                "font-mono text-[10px] tracking-widest",
                balanced ? "text-ok" : "text-accent",
              )}
            >
              {balanced ? "IN BAND" : "CHECK WARNINGS"}
            </span>
          </header>
          <table className="w-full font-mono text-xs">
            <tbody>
              {NUTRIENT_ROWS.map((row) => {
                const cell = analysis.nutrients[row.key];
                const band = row.bandOf(target);
                return (
                  <tr key={row.key} className="border-t border-border first:border-0">
                    <td className="px-3 py-2 text-muted">{row.label}</td>
                    <td className="px-3 py-2 text-right tabular text-fg">
                      {cell.value.toFixed(row.digits)} {row.unit}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-faint">
                      {row.key === "fiber"
                        ? `≤ ${target.fiber_max_pct}%`
                        : band
                          ? band.max != null
                            ? `${band.min}–${band.max}`
                            : `≥ ${band.min}`
                          : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <StateChip state={cell.state} />
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-muted">Ca : P ratio</td>
                <td className="px-3 py-2 text-right tabular text-fg">
                  {Number.isFinite(analysis.ca_to_p_ratio)
                    ? `${round2(analysis.ca_to_p_ratio)} : 1`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular text-faint">≥ 1.5 : 1</td>
                <td className="px-3 py-2 text-right">
                  <StateChip state={analysis.ca_to_p_ratio >= 1.5 ? "in" : "low"} />
                </td>
              </tr>
            </tbody>
          </table>
          {analysis.warnings.length > 0 ? (
            <ul className="space-y-2 border-t border-border p-3">
              {analysis.warnings.map((w, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-md border px-3 py-2 font-mono text-[11px] leading-relaxed",
                    w.severity === "alert"
                      ? "border-danger/40 bg-danger/10 text-danger"
                      : w.severity === "warn"
                        ? "border-accent/40 bg-elevated text-accent"
                        : "border-border bg-elevated text-muted",
                  )}
                >
                  {w.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-border px-3 py-2 font-mono text-[11px] text-ok">
              Every band met. Mix it.
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Weigh-out · {ration.batch_lbs} lb batch
          </header>
          <table className="w-full font-mono text-xs">
            <tbody>
              {analysis.batch.map((row, i) => (
                <tr key={i} className="border-t border-border first:border-0">
                  <td className="px-3 py-2 text-fg">{row.name}</td>
                  <td className="px-3 py-2 text-right tabular text-accent">{fmtMass(row.lbs, units)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">${row.cost_usd.toFixed(2)}</td>
                </tr>
              ))}
              {analysis.batch.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-muted">Nothing to weigh yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <dl className="grid grid-cols-2 gap-px border-t border-border bg-border">
            <Stat k="Batch cost" v={`$${analysis.batch_cost_usd.toFixed(2)}`} />
            <Stat k="Cost / lb" v={`$${analysis.cost_per_lb_usd.toFixed(3)}`} />
            <Stat k="Per bird / day" v={`$${analysis.cost_per_bird_day_usd.toFixed(3)}`} />
            <Stat
              k={`Flock of ${ration.flock_size}`}
              v={`$${analysis.flock_cost_day_usd.toFixed(2)}/day · $${analysis.flock_cost_week_usd.toFixed(2)}/wk`}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-elevated px-3 py-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Standing notes</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Grit is never in the 100%.</span> Insoluble grit is
            offered free-choice on the side — it has no nutrients, and folding it into the ration math
            is the classic beginner error.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-fg">Oyster shell supplements, never substitutes.</span>{" "}
            Free-choice shell lets a layer top up calcium overnight while the shell forms — the
            formulated limestone in the mix still carries the base load.
          </p>
        </section>
      </aside>
    </div>
  );
}

function fmtMass(lb: number, units: Units): string {
  if (units === "metric") return `${(lb * LB_TO_KG).toFixed(2)} kg`;
  return `${round2(lb)} lb`;
}

function StateChip({ state }: { state: "in" | "low" | "high" }) {
  return (
    <span
      className={cn(
        "inline-block border px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase",
        state === "in"
          ? "border-ok/30 bg-ok/10 text-ok"
          : "border-accent/40 bg-accent/10 text-accent",
      )}
    >
      {state === "in" ? "IN" : state === "low" ? "LOW" : "HIGH"}
    </span>
  );
}

function BandField({
  label,
  band,
  onChange,
}: {
  label: string;
  band: FeedBand;
  onChange: (b: FeedBand) => void;
}) {
  return (
    <div className="font-mono text-[10px] tracking-widest text-subtle">
      {label.toUpperCase()}
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          step={0.05}
          value={band.min}
          onChange={(e) => onChange({ ...band, min: Number(e.target.value) })}
          className="h-9 w-full rounded-sm border border-border bg-elevated px-2 tabular text-xs text-fg outline-none focus:border-accent"
          aria-label={`${label} minimum`}
        />
        <span className="text-faint">–</span>
        <input
          type="number"
          step={0.05}
          value={band.max ?? ""}
          placeholder="∞"
          onChange={(e) =>
            onChange({ ...band, max: e.target.value === "" ? null : Number(e.target.value) })
          }
          className="h-9 w-full rounded-sm border border-border bg-elevated px-2 tabular text-xs text-fg outline-none focus:border-accent"
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
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

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-3 py-3">
      <dt className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd className="mt-1 font-mono text-xs tabular text-fg">{v}</dd>
    </div>
  );
}
