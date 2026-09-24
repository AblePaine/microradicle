import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { HydraulicZoneSizer } from "@/components/HydraulicZoneSizer";
import { MainlinePressureLossChart } from "@/components/MainlinePressureLossChart";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/irrigation/")({
  component: IrrigationIndex,
  head: () => ({
    meta: [
      { title: "Drip — MicroRadicle" },
      {
        name: "description",
        content:
          "Drip planning for 30-inch beds. How much water each crop wants, and whether the header and mainline can keep up.",
      },
    ],
  }),
});

function IrrigationIndex() {
  const farm = useFarmStore((s) => s.farm);
  const ensureIrrigation = useFarmStore((s) => s.ensureIrrigation);
  const patchIrrigation = useFarmStore((s) => s.patchIrrigation);
  const addZone = useFarmStore((s) => s.addZone);
  const removeZone = useFarmStore((s) => s.removeZone);
  const patchZone = useFarmStore((s) => s.patchZone);

  useEffect(() => {
    ensureIrrigation();
  }, [ensureIrrigation]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Drip</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">DRIP ZONES</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Each cultivar already knows how much water it wants. The header and the poly mainline
          get sized so pressure holds at the far end. Keep flow under 5 feet a second and tape
          above 8 psi. One zone at a time is the normal day; everything at once is the stress
          test.
        </p>
      </header>

      <div className="mb-4">
        <MainlinePressureLossChart farm={farm} units={farm.units} />
      </div>

      <HydraulicZoneSizer
        farm={farm}
        onSupply={patchIrrigation}
        onAddZone={() => addZone()}
        onRemoveZone={removeZone}
        onPatchZone={patchZone}
      />
    </main>
  );
}
