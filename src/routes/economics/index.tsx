import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ColdChainAudit } from "@/components/ColdChainAudit";
import { PackShedPlanner } from "@/components/PackShedPlanner";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/economics/")({
  component: EconomicsIndex,
  head: () => ({
    meta: [
      { title: "Pack-shed — MicroRadicle" },
      {
        name: "description",
        content:
          "Harvest walks into the pack-shed hot. Field heat, CoolBot sizing, and what not to put in the 34°F box.",
      },
    ],
  }),
});

function EconomicsIndex() {
  const farm = useFarmStore((s) => s.farm);
  const patchEconomics = useFarmStore((s) => s.patchEconomics);

  useEffect(() => {
    if (!farm.economics) patchEconomics({});
  }, [farm.economics, patchEconomics]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Pack-shed</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">COLD CHAIN</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Harvest from this week's beds walks in hot. Add up field heat plus the crop still breathing,
          then check whether the CoolBot can knock it down in four hours. Hydrocooling is the first pass —
          the window unit isn't a miracle. Keep tomatoes, peppers, cukes, and basil out of the 34°F box.
        </p>
      </header>

      <div className="mb-4">
        <ColdChainAudit farm={farm} onPatch={patchEconomics} />
      </div>

      <PackShedPlanner farm={farm} onPatch={patchEconomics} />
    </main>
  );
}
