import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { MineralizationCurveChart } from "@/components/MineralizationCurveChart";
import { nAppliedById, SoilNutrientBalancer } from "@/components/SoilNutrientBalancer";
import { cropBySlug } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import { balancePlan, creditById, farmDeficit, resolveSoil, selectedAmendments } from "@/lib/soilMath";

export const Route = createFileRoute("/soil/")({
  component: SoilIndex,
  head: () => ({
    meta: [
      { title: "Soil — MicroRadicle" },
      {
        name: "description",
        content:
          "What the beds took out, which bags put N, P, and K back, and how crediting a paddock move cuts the fertilizer bill.",
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
  const credit = creditById(farm, settings.manure_credit_id);
  const plan = useMemo(
    () => balancePlan(farmDeficit(farm, cropBySlug), settings, credit),
    [farm, settings, credit],
  );
  const nById = nAppliedById(plan.recipe);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Soil & fertilizer</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">NUTRIENT BALANCER</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          The successions on this farm pulled nitrogen, phosphorus, and potassium. Credit a saved paddock
          move first — that manure is already on the ground — then buy only the remaining bags. Phosphate
          stays capped so you don't stack bone meal on broiler litter.
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
