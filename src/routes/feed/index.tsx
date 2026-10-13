import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useFarmStore } from "@/lib/farm-store";
import { analyzeRation, effectiveTarget, resolveFeed, TARGETS, TARGET_BY_ID } from "@/lib/feedMath";
import { uid } from "@/lib/storage";
import { round2 } from "@/lib/soil-chemistry";
import type { SavedRation } from "@/types/feed";

export const Route = createFileRoute("/feed/")({
  component: FeedIndex,
  head: () => ({
    meta: [
      { title: "Feed Studio — MicroRadicle" },
      {
        name: "description",
        content:
          "Formulate, check, and price a poultry ration from ingredients you can buy locally — Pearson-square balancing, a full nutrient panel, and cost per bird per day.",
      },
    ],
  }),
});

function FeedIndex() {
  const farm = useFarmStore((s) => s.farm);
  const patchFeed = useFarmStore((s) => s.patchFeed);
  const navigate = useNavigate();
  const [newTargetId, setNewTargetId] = useState("layer-production");

  useEffect(() => {
    if (!farm.feed) patchFeed({});
  }, [farm.feed, patchFeed]);

  const settings = resolveFeed(farm);
  const summaries = useMemo(
    () =>
      settings.rations.map((ration) => {
        const target = effectiveTarget(ration);
        const analysis = analyzeRation(ration, target);
        return { ration, target, analysis };
      }),
    [settings.rations],
  );

  function createRation() {
    const target = TARGET_BY_ID.get(newTargetId);
    const ration: SavedRation = {
      id: uid("ration"),
      name: `${target?.label ?? "Layer"} ration`,
      target_id: newTargetId,
      lines: [],
      batch_lbs: 100,
      flock_size: 25,
      intake_lb_per_day: target?.default_intake_lb_per_day ?? 0.24,
      updated_at: new Date().toISOString(),
    };
    patchFeed({ rations: [...settings.rations, ration] });
    navigate({ to: "/feed/$slug", params: { slug: ration.id } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Feed & ration</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">FEED STUDIO</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Balance a poultry ration from ingredients you can actually buy locally. The square solves
          protein, the panel checks everything else, and the weigh-out prices the batch down to cost
          per bird per day.
        </p>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Saved rations · {summaries.length}
        </header>
        <ul className="divide-y divide-border">
          {summaries.map(({ ration, target, analysis }) => (
            <li key={ration.id}>
              <Link
                to="/feed/$slug"
                params={{ slug: ration.id }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 transition-colors hover:bg-elevated"
              >
                <span className="min-w-48 flex-1">
                  <span className="block font-mono text-sm text-fg">{ration.name}</span>
                  <span className="block font-mono text-[10px] tracking-widest text-faint">
                    {target.label} · {ration.flock_size} birds · {ration.batch_lbs} lb batch
                  </span>
                </span>
                <span className="flex gap-1.5 font-mono text-[10px]">
                  <SummaryChip k="CP" v={`${round2(analysis.nutrients.cp.value)}%`} bad={analysis.nutrients.cp.state !== "in"} />
                  <SummaryChip k="Ca" v={`${round2(analysis.nutrients.ca.value)}%`} bad={analysis.nutrients.ca.state !== "in"} />
                  <SummaryChip k="$/bird/day" v={`$${analysis.cost_per_bird_day_usd.toFixed(3)}`} />
                  <SummaryChip
                    k="Warnings"
                    v={String(analysis.warnings.length)}
                    bad={analysis.warnings.some((w) => w.severity === "alert")}
                  />
                </span>
              </Link>
            </li>
          ))}
          {summaries.length === 0 ? (
            <li className="px-3 py-8 text-center font-mono text-xs text-muted">
              No rations saved yet.
            </li>
          ) : null}
        </ul>
        <div className="flex flex-wrap items-end gap-2 border-t border-border p-3">
          <label className="block min-w-52 flex-1 font-mono text-[10px] tracking-widest text-subtle">
            NEW RATION — START FROM A TARGET
            <select
              value={newTargetId}
              onChange={(e) => setNewTargetId(e.target.value)}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={createRation}
            className="h-11 rounded-md bg-accent px-4 font-mono text-[10px] tracking-widest text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            NEW RATION
          </button>
        </div>
      </section>

      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-widest text-faint">
        Targets: LSU AgCenter / NRC 1994. Catalog values are editable per ration — your corn is not
        book corn. Prices are placeholder defaults, not quotes.
      </p>
    </main>
  );
}

function SummaryChip({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <span
      className={
        bad
          ? "border border-accent/40 bg-accent/10 px-2 py-1 text-accent"
          : "border border-border bg-elevated px-2 py-1 text-muted"
      }
    >
      {k} <span className="text-fg">{v}</span>
    </span>
  );
}
