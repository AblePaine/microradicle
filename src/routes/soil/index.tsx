import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { MineralizationCurveChart } from "@/components/MineralizationCurveChart";
import { nAppliedById, SoilNutrientBalancer } from "@/components/SoilNutrientBalancer";
import { cropBySlug } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import { balancePlan, farmDeficit, resolveSoil, selectedAmendments } from "@/lib/soilMath";

export const Route = createFileRoute("/soil/")({
  component: SoilIndex,
  head: () => ({
    meta: [
      { title: "Soil — MicroRadicle" },
      {
        name: "description",
        content:
          "What the beds took out, and which organic amendments put N, P, and K back — without piling on extra phosphorus.",
      },
    ],
  }),
});

function SoilIndex() {
  const farm = useFarmStore((s) => s.farm);
  const patchSoil = useFarmStore((s) => s.patchSoil);

  useEffect(() => {
    if (!farm.soil) patchSoil({});
  }, [farm.soil, patchSoil]);

  const settings = resolveSoil(farm);
  const plan = useMemo(
    () => balancePlan(farmDeficit(farm, cropBySlug), settings),
    [farm, settings],
  );
  const nById = nAppliedById(plan.recipe);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Module 03 · fertility</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">NPK BALANCER</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          The successions on this farm pulled nitrogen, phosphorus, and potassium. This recipe puts them
          back with organic bags, lets nitrogen release as the soil warms, and will not pile on extra
          phosphate just to chase the N number.
        </p>
      </header>

      <div className="mb-4">
        <MineralizationCurveChart
          amendments={selectedAmendments(settings)}
          soilTempF={settings.soil_temp_f}
          horizonWeeks={settings.horizon_weeks}
          nAppliedLbsById={nById}
        />
      </div>

      <SoilNutrientBalancer farm={farm} onPatchSoil={patchSoil} />
    </main>
  );
}
