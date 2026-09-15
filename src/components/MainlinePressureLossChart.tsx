import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FarmState, Units } from "@/types/farm";
import { cropBySlug } from "@/lib/crops";
import { ftToDisplay, mainlineStations, psiToDisplay, TAPE_MIN_PSI } from "@/lib/hydraulics";

type Props = {
  farm: FarmState;
  units: Units;
};

export function MainlinePressureLossChart({ farm, units }: Props) {
  const peak = useMemo(() => mainlineStations(farm, cropBySlug, "peak-zone"), [farm]);
  const all = useMemo(() => mainlineStations(farm, cropBySlug, "simultaneous"), [farm]);
  const data = peak.map((s, i) => ({
    chainage: s.chainage_ft,
    label: s.label,
    peak: s.pressure_psi,
    simultaneous: all[i]?.pressure_psi ?? s.pressure_psi,
    floor: TAPE_MIN_PSI,
  }));

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      <figcaption className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>Mainline residual pressure</span>
        <span className="text-faint">Friction in PE pipe</span>
      </figcaption>
      <div className="h-[240px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="chainage"
              tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              tickFormatter={(v: number) => ftToDisplay(v, units)}
              stroke="var(--color-border)"
            />
            <YAxis
              tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              tickFormatter={(v: number) => psiToDisplay(v, units)}
              stroke="var(--color-border)"
              width={72}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 11,
              }}
              labelFormatter={(v) => `Chainage ${ftToDisplay(Number(v), units)}`}
              formatter={(value, name) => [
                psiToDisplay(Number(value), units),
                name === "peak" ? "Peak zone" : name === "simultaneous" ? "All zones" : "Tape min",
              ]}
            />
            <Legend
              wrapperStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10 }}
              formatter={(v) => (v === "peak" ? "Peak zone open" : v === "simultaneous" ? "All zones open" : "Tape floor")}
            />
            <Line type="monotone" dataKey="peak" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="simultaneous" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="floor" stroke="var(--color-ok)" strokeDasharray="4 4" strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
