import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { getCropLabel } from "@/components/HydraulicZoneSizer";
import { cropBySlug } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import {
  auditZone,
  formatPipe,
  ftToDisplay,
  gpmToDisplay,
  PIPE_DIAMETERS,
  psiToDisplay,
  resolveNetwork,
} from "@/lib/hydraulics";
import { cn } from "@/lib/utils";
import type { PipeDiameterInches } from "@/types/irrigation";

export const Route = createFileRoute("/irrigation/$slug")({
  component: ZoneDetail,
  head: ({ params }) => ({
    meta: [{ title: `Zone ${params.slug} — MicroRadicle` }],
  }),
});

function ZoneDetail() {
  const { slug } = Route.useParams();
  const farm = useFarmStore((s) => s.farm);
  const hydrated = useFarmStore((s) => s.hydrated);
  const ensureIrrigation = useFarmStore((s) => s.ensureIrrigation);
  const patchZone = useFarmStore((s) => s.patchZone);

  useEffect(() => {
    ensureIrrigation();
  }, [ensureIrrigation]);

  const network = resolveNetwork(farm);
  const zone = network.zones.find((z) => z.id === slug);
  const audit = useMemo(
    () => (zone ? auditZone(farm, zone, cropBySlug, new Date(), network) : null),
    [farm, zone, network],
  );

  if (!zone || !audit) {
    return (
      <main className="px-6 py-24 text-center">
        <p className="font-mono text-xs tracking-widest text-subtle">{hydrated ? "404" : "LOAD"}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">
          {hydrated ? "Zone not on this farm." : "Reading farm…"}
        </h1>
        <Link to="/irrigation" className="mt-6 inline-block text-accent">
          Back to zones
        </Link>
      </main>
    );
  }

  const units = farm.units;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/irrigation"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase hover:text-accent"
      >
        <ArrowLeft className="size-3.5" />
        All zones
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <input
            value={zone.name}
            onChange={(e) => patchZone(zone.id, { name: e.target.value })}
            className="font-display h-12 bg-transparent text-4xl font-semibold tracking-wide text-fg outline-none sm:text-5xl"
            aria-label="Zone name"
          />
          <p className="mt-1 font-mono text-xs text-muted">
            {audit.bed_count} beds · {ftToDisplay(audit.total_bed_feet, units)} bed ·{" "}
            {ftToDisplay(audit.total_drip_tape_feet, units)} tape
          </p>
        </div>
        <span
          className={cn(
            "font-mono text-xs tracking-widest",
            audit.requires_zone_split || audit.is_over_capacity ? "text-danger" : "text-ok",
          )}
        >
          {audit.requires_zone_split
            ? `SPLIT ×${audit.suggested_split_count}`
            : audit.is_over_capacity
              ? "OVER CAPACITY"
              : "HYDRAULIC OK"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile k="Demand" v={gpmToDisplay(audit.gross_demand_gpm, units)} warn={audit.is_over_capacity} />
        <Tile k="Emitters" v={String(audit.active_emitters_count)} />
        <Tile k="Header ΔP" v={psiToDisplay(audit.header_friction_loss_psi, units)} warn={audit.header_friction_loss_psi > 3} />
        <Tile k="Velocity" v={`${audit.header_velocity_fps.toFixed(2)} fps`} warn={audit.header_velocity_fps > 5} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Header
          </h2>
          <div className="space-y-3 p-4">
            <label className="block font-mono text-[10px] tracking-widest text-subtle">
              DIAMETER
              <select
                value={zone.header_diameter_in}
                onChange={(e) =>
                  patchZone(zone.id, { header_diameter_in: Number(e.target.value) as PipeDiameterInches })
                }
                className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
              >
                {PIPE_DIAMETERS.map((d) => (
                  <option key={d} value={d}>
                    {formatPipe(d)} PE{d === audit.recommended_header_diameter_in ? " — recommended" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-mono text-[10px] tracking-widest text-subtle">
              LENGTH FT
              <input
                type="number"
                min={5}
                max={400}
                value={zone.header_length_ft}
                onChange={(e) => patchZone(zone.id, { header_length_ft: Number(e.target.value) })}
                className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
              />
            </label>
            <button
              type="button"
              onClick={() => patchZone(zone.id, { header_diameter_in: audit.recommended_header_diameter_in })}
              className="h-11 w-full rounded-md bg-accent font-display text-lg font-semibold tracking-wide text-accent-fg"
            >
              Apply recommended {formatPipe(audit.recommended_header_diameter_in)}
            </button>
            {audit.requires_zone_split ? (
              <p className="font-mono text-xs text-danger">
                Even 1½ in PE cannot carry this zone under 5 ft/s and 3 psi. Split into {audit.suggested_split_count}{" "}
                sub-zones or raise supply.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Blocks on this valve
          </h2>
          <ul className="p-2">
            {farm.blocks.map((b) => {
              const on = zone.block_ids.includes(b.id);
              return (
                <li key={b.id}>
                  <label className="flex h-11 cursor-pointer items-center gap-3 rounded-sm px-2 hover:bg-elevated">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        const block_ids = on
                          ? zone.block_ids.filter((id) => id !== b.id)
                          : [...zone.block_ids, b.id];
                        patchZone(zone.id, { block_ids });
                      }}
                      className="size-4 accent-accent"
                    />
                    <span className="font-mono text-sm text-fg">{b.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-faint">
                      {b.bed_count} × {b.bed_length_ft} ft
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Crop mix · emitter demand
        </h2>
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">CULTIVAR</th>
              <th className="px-4 py-2 text-right">BEDS</th>
              <th className="px-4 py-2 text-right">GPM</th>
            </tr>
          </thead>
          <tbody>
            {audit.crop_mix.map((row) => (
              <tr key={row.crop_id} className="border-t border-border">
                <td className="px-4 py-2 text-fg">{getCropLabel(row.crop_id)}</td>
                <td className="px-4 py-2 text-right tabular text-muted">{row.bed_count}</td>
                <td className="px-4 py-2 text-right tabular">{gpmToDisplay(row.demand_gpm, units)}</td>
              </tr>
            ))}
            {audit.crop_mix.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  No beds assigned.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Bill of materials
        </h2>
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-right">QTY</th>
              <th className="px-4 py-2 text-left">SPEC</th>
            </tr>
          </thead>
          <tbody>
            {audit.bill_of_materials.map((line) => (
              <tr key={line.sku_name} className="border-t border-border">
                <td className="px-4 py-2 text-fg">{line.sku_name}</td>
                <td className="px-4 py-2 text-right tabular text-accent">{line.quantity}</td>
                <td className="px-4 py-2 text-muted">{line.specification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Tile({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <p className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">{k}</p>
      <p className={cn("font-display mt-1 text-2xl font-semibold tabular", warn ? "text-danger" : "text-fg")}>{v}</p>
    </div>
  );
}
