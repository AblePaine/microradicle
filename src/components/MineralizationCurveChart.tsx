import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrganicAmendment } from "@/types/soil";
import { mineralizationSeries } from "@/lib/soil-chemistry";

const STROKES = [
  "var(--color-accent)",
  "var(--color-ok)",
  "var(--color-danger)",
  "var(--color-accent-soft)",
  "var(--color-muted)",
];

type Props = {
  amendments: OrganicAmendment[];
  soilTempF: number;
  horizonWeeks: number;
  /** Total organic N applied (lbs) per amendment id. When omitted, the y-axis is release fraction. */
  nAppliedLbsById?: Record<string, number>;
  compareTempF?: number;
};

export function MineralizationCurveChart({
  amendments,
  soilTempF,
  horizonWeeks,
  nAppliedLbsById,
  compareTempF = 50,
}: Props) {
  const nSources = useMemo(
    () => amendments.filter((a) => a.n_pct > 0).slice(0, 5),
    [amendments],
  );
  const asLbs = Boolean(nAppliedLbsById && nSources.some((a) => (nAppliedLbsById[a.id] ?? 0) > 0));

  const data = useMemo(() => {
    const weeks = Math.max(16, horizonWeeks + 2);
    const warm = nSources.map((a) => {
      const total = asLbs ? (nAppliedLbsById?.[a.id] ?? 0) : 1;
      return mineralizationSeries(a, soilTempF, total, weeks);
    });
    const cool =
      nSources[0] &&
      mineralizationSeries(
        nSources[0],
        compareTempF,
        asLbs ? (nAppliedLbsById?.[nSources[0].id] ?? 0) : 1,
        weeks,
      );
    const rows: Array<Record<string, number>> = [];
    for (let w = 0; w <= weeks; w++) {
      const row: Record<string, number> = { week: w };
      nSources.forEach((a, i) => {
        row[a.id] = warm[i]?.[w]?.n_lbs ?? 0;
      });
      if (nSources[0] && cool) row[`${nSources[0].id}__cool`] = cool[w]?.n_lbs ?? 0;
      rows.push(row);
    }
    return rows;
  }, [nSources, soilTempF, horizonWeeks, asLbs, nAppliedLbsById, compareTempF]);

  const yTick = (v: number) => (asLbs ? `${v.toFixed(2)} lb` : `${Math.round(v * 100)}%`);

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      <figcaption className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>Organic N mineralization</span>
        <span className="text-faint">
          N release at {Math.round(soilTempF)}°F — warmer soil, faster
        </span>
      </figcaption>
      {nSources.length === 0 ? (
        <p className="px-4 py-10 text-center font-mono text-xs text-muted">
          Select an N amendment to plot the release curve.
        </p>
      ) : (
        <div className="h-[240px] w-full p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                tickFormatter={(v: number) => `${v}w`}
                stroke="var(--color-border)"
              />
              <YAxis
                tick={{ fill: "var(--color-subtle)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                tickFormatter={yTick}
                stroke="var(--color-border)"
                width={64}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                }}
                labelFormatter={(v) => `Week ${v}`}
                formatter={(value, name) => {
                  const id = String(name);
                  const cool = id.endsWith("__cool");
                  const aid = cool ? id.replace(/__cool$/, "") : id;
                  const label = nSources.find((a) => a.id === aid)?.name ?? aid;
                  return [yTick(Number(value)), cool ? `${label} @ ${compareTempF}°F` : label];
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10 }}
                formatter={(v) => {
                  const id = String(v);
                  if (id.endsWith("__cool")) return `${nSources[0]?.name ?? "N"} @ ${compareTempF}°F`;
                  return nSources.find((a) => a.id === id)?.name ?? id;
                }}
              />
              <ReferenceLine
                x={horizonWeeks}
                stroke="var(--color-subtle)"
                strokeDasharray="3 3"
                label={{
                  value: `${horizonWeeks} wk`,
                  fill: "var(--color-subtle)",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
              />
              {nSources.map((a, i) => (
                <Line
                  key={a.id}
                  type="monotone"
                  dataKey={a.id}
                  stroke={STROKES[i % STROKES.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              {nSources[0] ? (
                <Line
                  type="monotone"
                  dataKey={`${nSources[0].id}__cool`}
                  stroke="var(--color-muted)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
