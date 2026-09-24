import { addDays, format, parseISO, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import type { FarmState } from "@/types/farm";
import { cropBySlug, getCrop } from "@/lib/crops";
import {
  farmInputs,
  farmTasks,
  formatBedFt,
  formatUsd,
  formatWeight,
  lbToKg,
  round0,
  round1,
  TASK_LABEL,
  type FarmTask,
  type FarmTaskKind,
} from "@/lib/math";
import { cn } from "@/lib/utils";

type Horizon = 7 | 14 | 21 | 42;

type Props = {
  farm: FarmState;
  today: Date;
  onSelectTask: (blockId: string, bedIndex: number, successionId: string) => void;
};

export function OpsBoard({ farm, today, onSelectTask }: Props) {
  const [horizon, setHorizon] = useState<Horizon>(21);
  const [view, setView] = useState<"ops" | "inputs">("ops");
  const from = useMemo(() => addDays(startOfDay(today), -2), [today]);
  const to = useMemo(() => addDays(startOfDay(today), horizon), [today, horizon]);
  const tasks = useMemo(() => farmTasks(farm, from, to), [farm, from, to]);
  const inputs = useMemo(() => farmInputs(farm, cropBySlug), [farm]);
  const blocks = useMemo(() => new Map(farm.blocks.map((b) => [b.id, b])), [farm.blocks]);
  const todayIso = format(today, "yyyy-MM-dd");

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex gap-1">
          {(["ops", "inputs"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "h-8 rounded-sm px-2 font-mono text-[10px] tracking-[0.16em] uppercase",
                view === v ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "ops" ? (
          <div className="flex gap-0.5">
            {([7, 14, 21, 42] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizon(d)}
                className={cn(
                  "h-8 min-w-8 rounded-sm px-1.5 font-mono text-[10px] tabular",
                  horizon === d ? "text-accent" : "text-faint hover:text-fg",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        ) : (
          <span className="font-mono text-[10px] tracking-widest text-faint uppercase">Season totals</span>
        )}
      </div>

      {view === "ops" ? (
        <ul className="min-h-[220px] flex-1 overflow-auto">
          {tasks.length === 0 ? (
            <li className="px-3 py-10 text-center font-mono text-xs text-muted">
              Nothing scheduled in this window.
            </li>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                todayIso={todayIso}
                blockName={blocks.get(task.blockId)?.name ?? task.blockId}
                onSelect={onSelectTask}
              />
            ))
          )}
        </ul>
      ) : (
        <dl className="grid grid-cols-2 gap-px bg-border font-mono text-xs sm:grid-cols-3">
          <Stat k="Bed-ft" v={formatBedFt(inputs.bedFt, farm.units)} />
          <Stat k="Plants" v={String(round0(inputs.plants))} />
          <Stat k="Seed" v={`${round0(inputs.seeds)}`} />
          <Stat
            k="Water / wk"
            v={farm.units === "metric" ? `${round0(inputs.weeklyGallons * 3.785)} L` : `${round0(inputs.weeklyGallons)} gal`}
          />
          <Stat
            k="N-P-K"
            v={
              farm.units === "metric"
                ? `${round1(lbToKg(inputs.n))} / ${round1(lbToKg(inputs.p))} / ${round1(lbToKg(inputs.k))} kg`
                : `${round1(inputs.n)} / ${round1(inputs.p)} / ${round1(inputs.k)} lb`
            }
          />
          <Stat k="Wholesale" v={formatUsd(inputs.wholesaleUsd)} />
          <Stat k="Direct" v={formatUsd(inputs.directUsd)} />
          <Stat k="Successions" v={String(farm.successions.length)} />
          <Stat
            k="N / 100 ft"
            v={formatWeight(inputs.bedFt ? (inputs.n / inputs.bedFt) * 100 : 0, farm.units)}
          />
        </dl>
      )}
    </div>
  );
}

function TaskRow({
  task,
  todayIso,
  blockName,
  onSelect,
}: {
  task: FarmTask;
  todayIso: string;
  blockName: string;
  onSelect: (blockId: string, bedIndex: number, successionId: string) => void;
}) {
  const crop = getCrop(task.cropId);
  const overdue = task.date < todayIso;
  const isToday = task.date === todayIso;
  return (
    <li className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => onSelect(task.blockId, task.bedIndex, task.successionId)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-elevated"
      >
        <KindChip kind={task.kind} />
        <span
          className={cn(
            "w-[52px] shrink-0 font-mono text-[11px] tabular",
            overdue ? "text-danger" : isToday ? "text-accent" : "text-muted",
          )}
        >
          {format(parseISO(task.date), "MMM d")}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-fg">{crop?.cultivar ?? task.cropId}</span>
        <span className="shrink-0 font-mono text-[10px] tracking-wide text-faint">
          {blockName} {task.bedIndex + 1}
        </span>
      </button>
    </li>
  );
}

function KindChip({ kind }: { kind: FarmTaskKind }) {
  return (
    <span
      className={cn(
        "w-[48px] shrink-0 rounded-xs px-1 py-0.5 text-center font-mono text-[9px] tracking-widest",
        kind === "sow" && "bg-elevated text-muted",
        kind === "field" && "bg-ok-dim text-ok",
        kind === "harvest" && "bg-accent text-accent-fg",
        kind === "clear" && "bg-panel text-subtle",
      )}
    >
      {TASK_LABEL[kind]}
    </span>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-3 py-3">
      <dt className="text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd className="mt-1 tabular text-fg">{v}</dd>
    </div>
  );
}
