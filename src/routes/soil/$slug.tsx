import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MineralizationCurveChart } from "@/components/MineralizationCurveChart";
import { nAppliedById, SoilNutrientBalancer } from "@/components/SoilNutrientBalancer";
import { cropBySlug } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import { balancePlan, blockDeficit, creditById, resolveSoil, selectedAmendments } from "@/lib/soilMath";

export const Route = createFileRoute("/soil/$slug")({
  component: SoilBlock,
  head: ({ params }) => ({
    meta: [{ title: `Soil ${params.slug} — MicroRadicle` }],
  }),
});

function SoilBlock() {
  const { slug } = Route.useParams();
  const farm = useFarmStore((s) => s.farm);
  const hydrated = useFarmStore((s) => s.hydrated);
  const patchSoil = useFarmStore((s) => s.patchSoil);

  useEffect(() => {
    if (!farm.soil) patchSoil({});
  }, [farm.soil, patchSoil]);

  const block = farm.blocks.find((b) => b.id === slug);
  const settings = resolveSoil(farm);
  const deficit = useMemo(() => blockDeficit(farm, slug, cropBySlug), [farm, slug]);
  const credit = creditById(farm, settings.manure_credit_id);
  const plan = useMemo(
    () => (deficit ? balancePlan(deficit, settings, credit) : null),
    [deficit, settings, credit],
  );

  if (!block || !deficit || !plan) {
    return (
      <main className="px-6 py-24 text-center">
        <p className="font-mono text-xs tracking-widest text-subtle">{hydrated ? "404" : "LOAD"}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">
          {hydrated ? "Block not on this farm." : "Reading farm…"}
        </h1>
        <Link to="/soil" className="mt-6 inline-block text-accent">
          Back to soil
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/soil"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase hover:text-accent"
      >
        <ArrowLeft className="size-3.5" />
        All blocks
      </Link>
      <header className="mt-3 mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Block recipe · {block.bed_count} × {block.bed_length_ft} ft</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">{block.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Extraction from the cultivars occupying this block. Broadcast the recipe into the top 4 in before the next
          transplant. Split soluble K if the rate is heavy.
        </p>
      </header>

      <div className="mb-4">
        <MineralizationCurveChart
          amendments={selectedAmendments(settings)}
          soilTempF={settings.soil_temp_f}
          horizonWeeks={settings.horizon_weeks}
          nAppliedLbsById={nAppliedById(plan.recipe)}
        />
      </div>

      <SoilNutrientBalancer farm={farm} onPatchSoil={patchSoil} blockId={block.id} />
    </main>
  );
}
