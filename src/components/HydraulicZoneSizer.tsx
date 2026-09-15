import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { FarmState } from "@/types/farm";
import type { IrrigationZone, PipeDiameterInches, ZoneHydraulicAudit } from "@/types/irrigation";
import { cropBySlug, getCrop } from "@/lib/crops";
import {
  auditFarm,
  formatPipe,
  gpmToDisplay,
  peakSequentialGpm,
  peakSimultaneousGpm,
  PIPE_DIAMETERS,
  psiToDisplay,
  resolveNetwork,
} from "@/lib/hydraulics";
import { cn } from "@/lib/utils";

type Props = {
  farm: FarmState;
  onSupply: (patch: {
    supply_capacity_gpm?: number;
    supply_pressure_psi?: number;
    mainline_diameter_in?: PipeDiameterInches;
    mainline_length_ft?: number;
    regulator_setpoint_psi?: number;
  }) => void;
  onAddZone: () => void;
  onRemoveZone: (id: string) => void;
  onPatchZone: (id: string, patch: Partial<Omit<IrrigationZone, "id">>) => void;
};

export function HydraulicZoneSizer({ farm, onSupply, onAddZone, onRemoveZone, onPatchZone }: Props) {
  const network = useMemo(() => resolveNetwork(farm), [farm]);
  const audits = useMemo(() => auditFarm(farm, cropBySlug), [farm]);
  const sequential = peakSequentialGpm(audits);
  const simultaneous = peakSimultaneousGpm(audits);
  const units = farm.units;
  const alarms = audits.filter((a) => a.is_over_capacity || a.requires_zone_split);

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Supply · source
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <NumField
            label="Capacity"
            value={network.supply_capacity_gpm}
            step={0.5}
            min={0.5}
            onChange={(n) => onSupply({ supply_capacity_gpm: n })}
            hint={units === "metric" ? "GPM (calc)" : "GPM"}
          />
          <NumField
            label="Source psi"
            value={network.supply_pressure_psi}
            step={1}
            min={10}
            onChange={(n) => onSupply({ supply_pressure_psi: n })}
            hint="at pump / bib"
          />
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            MAINLINE
            <select
              value={network.mainline_diameter_in}
              onChange={(e) => onSupply({ mainline_diameter_in: Number(e.target.value) as PipeDiameterInches })}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {PIPE_DIAMETERS.map((d) => (
                <option key={d} value={d}>
                  {formatPipe(d)} PE
                </option>
              ))}
            </select>
          </label>
          <NumField
            label="Mainline L"
            value={network.mainline_length_ft}
            step={5}
            min={10}
            onChange={(n) => onSupply({ mainline_length_ft: n })}
            hint="ft source → last zone"
          />
          <NumField
            label="Regulator"
            value={network.regulator_setpoint_psi}
            step={1}
            min={6}
            onChange={(n) => onSupply({ regulator_setpoint_psi: n })}
            hint="tape setpoint"
          />
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <Stat k="Peak zone" v={gpmToDisplay(sequential, units)} warn={sequential > network.supply_capacity_gpm} />
          <Stat
            k="All zones"
            v={gpmToDisplay(simultaneous, units)}
            warn={simultaneous > network.supply_capacity_gpm}
          />
          <Stat k="Supply" v={gpmToDisplay(network.supply_capacity_gpm, units)} />
          <Stat
            k="Headroom"
            v={gpmToDisplay(network.supply_capacity_gpm - sequential, units)}
            warn={network.supply_capacity_gpm - sequential < 0}
          />
        </dl>
      </section>

      {alarms.length > 0 ? (
        <p className="rounded-md border border-danger/40 bg-elevated px-3 py-2 font-mono text-xs text-danger">
          {alarms.length} zone{alarms.length === 1 ? "" : "s"} over capacity or needing a split. Resize header or split
          the block.
        </p>
      ) : (
        <p className="rounded-md border border-ok/30 bg-elevated px-3 py-2 font-mono text-xs text-ok">
          All zones inside velocity ≤ 5 ft/s and supply. Sequential program OK.
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Zones · hydraulic audit</p>
          <button
            type="button"
            onClick={onAddZone}
            className="inline-flex h-11 items-center gap-1.5 px-2 font-mono text-[10px] tracking-widest text-accent"
          >
            <Plus className="size-3.5" />
            ADD ZONE
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] font-mono text-xs">
            <thead className="bg-elevated text-[10px] tracking-widest text-faint">
              <tr>
                <th className="px-3 py-2 text-left">ZONE</th>
                <th className="px-3 py-2 text-right">BEDS</th>
                <th className="px-3 py-2 text-right">EMITTERS</th>
                <th className="px-3 py-2 text-right">DEMAND</th>
                <th className="px-3 py-2 text-right">UTIL</th>
                <th className="px-3 py-2 text-right">HEADER</th>
                <th className="px-3 py-2 text-right">ΔP</th>
                <th className="px-3 py-2 text-right">V</th>
                <th className="px-3 py-2 text-left">STATUS</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => {
                const zone = network.zones.find((z) => z.id === a.zone_id);
                return (
                  <tr key={a.zone_id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link
                        to="/irrigation/$slug"
                        params={{ slug: a.zone_id }}
                        className="text-fg hover:text-accent"
                      >
                        {a.zone_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular text-muted">{a.bed_count}</td>
                    <td className="px-3 py-2 text-right tabular text-muted">{a.active_emitters_count}</td>
                    <td className="px-3 py-2 text-right tabular">{gpmToDisplay(a.gross_demand_gpm, units)}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular",
                        a.capacity_utilization_pct > 90 ? "text-danger" : "text-muted",
                      )}
                    >
                      {Math.round(a.capacity_utilization_pct)}%
                    </td>
                    <td className="px-3 py-2 text-right">
                      {zone ? (
                        <select
                          value={zone.header_diameter_in}
                          onChange={(e) =>
                            onPatchZone(zone.id, { header_diameter_in: Number(e.target.value) as PipeDiameterInches })
                          }
                          className="h-9 rounded-sm border border-border bg-elevated px-1 text-fg outline-none focus:border-accent"
                          aria-label={`${a.zone_name} header diameter`}
                        >
                          {PIPE_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              {formatPipe(d)}
                              {d === a.recommended_header_diameter_in ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        formatPipe(a.recommended_header_diameter_in)
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular",
                        a.header_friction_loss_psi > 3 ? "text-danger" : "text-muted",
                      )}
                    >
                      {psiToDisplay(a.header_friction_loss_psi, units)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular",
                        a.header_velocity_fps > 5 ? "text-danger" : "text-muted",
                      )}
                    >
                      {a.header_velocity_fps.toFixed(2)} fps
                    </td>
                    <td className="px-3 py-2">
                      <Status audit={a} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveZone(a.zone_id)}
                        className="inline-flex size-9 items-center justify-center text-muted hover:text-danger"
                        aria-label={`Delete ${a.zone_name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-3 py-2 font-mono text-[10px] tracking-widest text-faint">
          Sized so water stays under 5 ft/s and header loss under 3 psi. Demand comes from the crop's emitters.
        </p>
      </section>
    </div>
  );
}

function Status({ audit }: { audit: ZoneHydraulicAudit }) {
  if (audit.requires_zone_split) {
    return <span className="text-danger">SPLIT ×{audit.suggested_split_count}</span>;
  }
  if (audit.is_over_capacity) {
    return <span className="text-danger">OVER</span>;
  }
  if (audit.selected_header_diameter_in !== audit.recommended_header_diameter_in) {
    return <span className="text-accent">UPSIZE {formatPipe(audit.recommended_header_diameter_in)}</span>;
  }
  return <span className="text-ok">OK</span>;
}

function NumField({
  label,
  value,
  onChange,
  step,
  min,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  hint: string;
}) {
  return (
    <label className="block font-mono text-[10px] tracking-widest text-subtle">
      {label.toUpperCase()}
      <input
        type="number"
        step={step}
        min={min}
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
      <dd className={cn("mt-1 font-mono text-sm tabular", warn ? "text-danger" : "text-fg")}>{v}</dd>
    </div>
  );
}

export function getCropLabel(cropId: string): string {
  if (cropId === "standard-tape") return "Standard 8 in tape";
  return getCrop(cropId)?.cultivar ?? cropId;
}
