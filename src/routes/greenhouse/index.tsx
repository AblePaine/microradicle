import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { canonicalLink, jsonLdScript, ogMeta, webApplicationJsonLd } from "@/lib/seo";
import {
  decodeTopOffFromUnknown,
  greenhouseShareHref,
  type SharedTopOffParams,
} from "@/lib/shareUrl";
import { computeTopOff, DEFAULT_RECIPE_EC, type TopOffPart } from "@/lib/topoffMath";

const DESCRIPTION =
  "The hydroponic daily-action calculator: enter the reservoir's current volume and EC plus your target, and it solves what to add right now — mL of each concentrate part, plain water, or both — with a dump-and-remix flag when the correction is too big for a top-off. Brand-agnostic, no product database, works offline. EC is the truth; PPM shown on both the 500 and 700 scales.";

export const Route = createFileRoute("/greenhouse/")({
  component: GreenhouseIndex,
  validateSearch: (s: Record<string, unknown>): SharedTopOffParams => decodeTopOffFromUnknown(s),
  head: () => ({
    meta: [
      { title: "Greenhouse Top-Off Calculator — MicroRadicle" },
      { name: "description", content: DESCRIPTION },
      ...ogMeta({ title: "Greenhouse Top-Off Calculator — MicroRadicle", description: DESCRIPTION, path: "/greenhouse" }),
    ],
    scripts: [
      jsonLdScript(
        webApplicationJsonLd({ name: "MicroRadicle Greenhouse Top-Off Calculator", description: DESCRIPTION, path: "/greenhouse" }),
      ),
    ],
    links: [canonicalLink("/greenhouse")],
  }),
});

const inputCls =
  "mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent";
const labelCls = "block font-mono text-[10px] tracking-widest text-subtle uppercase";

function parseNum(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits);
}

const MODE_HEADLINES: Record<string, string> = {
  concentrate: "Add concentrates",
  dilute: "Add plain water",
  fill: "Top off to the fill line",
  none: "On target — add nothing",
  blocked: "Can't get there by top-off",
};

function GreenhouseIndex() {
  const search = Route.useSearch();
  const [volume, setVolume] = useState(search.volumeL !== undefined ? String(search.volumeL) : "40");
  const [ecNow, setEcNow] = useState(search.ecNow !== undefined ? String(search.ecNow) : "1.2");
  const [ecTarget, setEcTarget] = useState(search.ecTarget !== undefined ? String(search.ecTarget) : "1.8");
  const [recipeEc, setRecipeEc] = useState(search.recipeEc !== undefined ? String(search.recipeEc) : String(DEFAULT_RECIPE_EC));
  const [partNames, setPartNames] = useState<string[]>([
    search.parts?.[0]?.name ?? "",
    search.parts?.[1]?.name ?? "",
    search.parts?.[2]?.name ?? "",
  ]);
  const [partRates, setPartRates] = useState<string[]>([
    search.parts?.[0] !== undefined ? String(search.parts[0].ml_per_gal) : "5",
    search.parts?.[1] !== undefined ? String(search.parts[1].ml_per_gal) : "5",
    search.parts?.[2] !== undefined ? String(search.parts[2].ml_per_gal) : "5",
  ]);
  const [fill, setFill] = useState(search.fillVolumeL !== undefined ? String(search.fillVolumeL) : "");
  const [capacity, setCapacity] = useState(search.capacityL !== undefined ? String(search.capacityL) : "");
  const [ph, setPh] = useState(search.phNow !== undefined ? String(search.phNow) : "");
  const [drift, setDrift] = useState(Boolean(search.driftSuspected));
  const [msg, setMsg] = useState("");

  const parts: TopOffPart[] = partRates
    .map((rate, i) => {
      const ml = parseNum(rate);
      if (ml === undefined) return null;
      const name = partNames[i]?.trim();
      return { ...(name ? { name } : {}), ml_per_gal: ml };
    })
    .filter((p): p is TopOffPart => p !== null);

  const result = useMemo(() => {
    const v = parseNum(volume);
    const e0 = parseNum(ecNow);
    const et = parseNum(ecTarget);
    if (v === undefined || v <= 0 || e0 === undefined || e0 < 0 || et === undefined || et <= 0) return null;
    const rec = parseNum(recipeEc);
    return computeTopOff({
      volume_l: v,
      ec_now: e0,
      ec_target: et,
      ...(rec !== undefined && rec > 0 ? { recipe_ec: rec } : {}),
      parts,
      ...(parseNum(fill) !== undefined ? { fill_volume_l: parseNum(fill)! } : {}),
      ...(parseNum(capacity) !== undefined ? { capacity_l: parseNum(capacity)! } : {}),
      ...(parseNum(ph) !== undefined ? { ph_now: parseNum(ph)! } : {}),
      drift_suspected: drift,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, ecNow, ecTarget, recipeEc, fill, capacity, ph, drift, partNames, partRates]);

  async function copyShare() {
    const v = parseNum(volume);
    const e0 = parseNum(ecNow);
    const et = parseNum(ecTarget);
    const href = greenhouseShareHref(
      {
        ...(v !== undefined ? { volumeL: v } : {}),
        ...(e0 !== undefined ? { ecNow: e0 } : {}),
        ...(et !== undefined ? { ecTarget: et } : {}),
        ...(parseNum(recipeEc) !== undefined ? { recipeEc: parseNum(recipeEc)! } : {}),
        parts,
        ...(parseNum(fill) !== undefined ? { fillVolumeL: parseNum(fill)! } : {}),
        ...(parseNum(capacity) !== undefined ? { capacityL: parseNum(capacity)! } : {}),
        ...(parseNum(ph) !== undefined ? { phNow: parseNum(ph)! } : {}),
        ...(drift ? { driftSuspected: true } : {}),
      },
      window.location.origin,
    );
    try {
      await navigator.clipboard.writeText(href);
      setMsg("Share URL copied — it carries this reservoir state and recipe.");
    } catch {
      setMsg(href);
    }
  }

  function setPartName(i: number, value: string) {
    setPartNames((prev) => prev.map((n, j) => (j === i ? value : n)));
  }
  function setPartRate(i: number, value: string) {
    setPartRates((prev) => prev.map((n, j) => (j === i ? value : n)));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Greenhouse · hydroponics</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">RESERVOIR TOP-OFF</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          The daily question: the plants drank, the EC drifted — what do you add <em>right now</em>?
          Enter the reservoir as it stands and where you want it; the engine solves the dose —
          concentrate parts, plain water, or both — and tells you plainly when the honest answer is
          a dump-and-remix instead. Brand-agnostic: it works from your recipe's rates, not a product
          database. Nothing leaves your browser.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            The reservoir, as it stands
          </header>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
            <label className={labelCls}>
              Current volume (liters) *
              <input value={volume} onChange={(e) => setVolume(e.target.value)} inputMode="decimal" placeholder="40" className={inputCls} />
            </label>
            <label className={labelCls}>
              Reservoir capacity (liters, optional)
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} inputMode="decimal" placeholder="e.g. 100" className={inputCls} />
            </label>
            <label className={labelCls}>
              Current EC (mS/cm) *
              <input value={ecNow} onChange={(e) => setEcNow(e.target.value)} inputMode="decimal" placeholder="1.2" className={inputCls} />
            </label>
            <label className={labelCls}>
              Target EC (mS/cm) *
              <input value={ecTarget} onChange={(e) => setEcTarget(e.target.value)} inputMode="decimal" placeholder="1.8" className={inputCls} />
            </label>
            <label className={labelCls}>
              Top off to volume (liters, optional)
              <input value={fill} onChange={(e) => setFill(e.target.value)} inputMode="decimal" placeholder="Fill line — solves water + parts" className={inputCls} />
            </label>
            <label className={labelCls}>
              pH now (optional — context only)
              <input value={ph} onChange={(e) => setPh(e.target.value)} inputMode="decimal" placeholder="e.g. 5.8" className={inputCls} />
            </label>
          </div>

          <div className="border-t border-border p-3">
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Last mix recipe — full-strength rates</p>
            <label className={labelCls}>
              EC of a fresh full-strength batch (your recipe's number)
              <input value={recipeEc} onChange={(e) => setRecipeEc(e.target.value)} inputMode="decimal" placeholder="2.0" className={inputCls} />
            </label>
            <div className="mt-2 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <label className={labelCls}>
                    Part {i + 1} name (optional)
                    <input
                      value={partNames[i]}
                      onChange={(e) => setPartName(i, e.target.value)}
                      placeholder={i === 0 ? "e.g. Micro" : i === 1 ? "e.g. Gro" : "e.g. Bloom"}
                      className={inputCls}
                    />
                  </label>
                  <label className={labelCls}>
                    Rate (mL / gal at full strength)
                    <input value={partRates[i]} onChange={(e) => setPartRate(i, e.target.value)} inputMode="decimal" placeholder="5" className={inputCls} />
                  </label>
                </div>
              ))}
            </div>
            <label className="mt-3 flex items-start gap-2 text-sm text-muted">
              <input type="checkbox" checked={drift} onChange={(e) => setDrift(e.target.checked)} className="mt-1" />
              <span>
                The mix may be compromised — slime, off smell, or additions nobody wrote down. (Top-off
                math assumes the salts in the tank are the ones you mixed.)
              </span>
            </label>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-faint">
              How it solves: EC blends linearly by volume. A part mixed at its full-strength rate
              contributes that recipe's full-strength EC — the number you entered above, measured on
              your own fresh batch. Your brand's chart EC is the right value; the 2.0 pre-fill is only
              a placeholder.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <span className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">What to add</span>
            <button
              type="button"
              onClick={() => void copyShare()}
              className="h-8 rounded-md bg-accent px-3 font-mono text-[10px] tracking-widest text-accent-fg transition-transform duration-150 active:scale-[0.96]"
            >
              COPY SHARE LINK
            </button>
          </header>
          <div className="p-3">
            {result === null ? (
              <p className="py-8 text-center font-mono text-xs text-muted">
                Enter a volume, a current EC, and a target EC to solve the dose.
              </p>
            ) : (
              <>
                <p className="font-display text-2xl font-semibold tracking-wide text-fg">{MODE_HEADLINES[result.mode]}</p>

                {result.advisory.dump_and_remix ? (
                  <div className="mt-3 border border-accent bg-elevated p-3">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">Dump-and-remix advisory</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted">
                      {result.advisory.messages.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {result.parts_ml.length > 0 && result.total_concentrate_ml > 0 ? (
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="text-left font-mono text-[10px] tracking-widest text-subtle uppercase">
                        <th className="py-1">Part</th>
                        <th className="py-1">Rate</th>
                        <th className="py-1 text-right">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.parts_ml.map((p, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1.5 text-fg">{p.name ?? `Part ${i + 1}`}</td>
                          <td className="py-1.5 font-mono text-[11px] text-muted">{p.ml_per_gal} mL/gal</td>
                          <td className="py-1.5 text-right font-mono text-fg">{fmt(p.add_ml)} mL</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border font-mono text-[11px] text-muted">
                        <td className="py-1.5" colSpan={2}>
                          Total concentrate
                        </td>
                        <td className="py-1.5 text-right text-fg">{fmt(result.total_concentrate_ml)} mL</td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}

                <dl className="mt-3 space-y-1 font-mono text-[12px] text-muted">
                  {result.add_water_l > 0 ? (
                    <div className="flex justify-between">
                      <dt>Plain water to add</dt>
                      <dd className="text-fg">{fmt(result.add_water_l, 2)} L</dd>
                    </div>
                  ) : null}
                  {result.full_strength_equivalent_l !== null && result.full_strength_equivalent_l > 0 ? (
                    <div className="flex justify-between">
                      <dt>Full-strength equivalent</dt>
                      <dd className="text-fg">{fmt(result.full_strength_equivalent_l, 2)} L</dd>
                    </div>
                  ) : null}
                  {result.final_volume_l !== null ? (
                    <div className="flex justify-between">
                      <dt>Volume after</dt>
                      <dd className="text-fg">{fmt(result.final_volume_l, 2)} L</dd>
                    </div>
                  ) : null}
                  {result.final_ec !== null ? (
                    <div className="flex justify-between">
                      <dt>EC after</dt>
                      <dd className="text-fg">{fmt(result.final_ec, 2)} mS/cm</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt>PPM now → target (500 scale)</dt>
                    <dd className="text-fg">
                      {Math.round(result.ppm_now.ppm500)} → {Math.round(result.ppm_target.ppm500)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>PPM now → target (700 scale)</dt>
                    <dd className="text-fg">
                      {Math.round(result.ppm_now.ppm700)} → {Math.round(result.ppm_target.ppm700)}
                    </dd>
                  </div>
                </dl>

                {result.notes.map((n) => (
                  <p key={n} className="mt-3 font-mono text-[10px] leading-relaxed text-faint">
                    {n}
                  </p>
                ))}
                {msg ? <p className="mt-3 font-mono text-[10px] text-ok">{msg}</p> : null}
              </>
            )}
          </div>
        </section>
      </div>

      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-widest text-faint">
        EC is the stored truth — PPM depends on your meter's scale (500 or 700), so both are shown.
        Stir and re-read after dosing; meters settle slower than math. This engine doses nutrients
        only — it does not dose pH.
      </p>
    </main>
  );
}
