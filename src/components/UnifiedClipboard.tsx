import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { getCrop } from "@/lib/crops";
import {
  ingestClipboard,
  type ClipboardRow,
} from "@/lib/clipboardIngestion";
import { cn } from "@/lib/utils";
import type { FarmState } from "@/types/farm";

type Props = {
  farm: FarmState;
  todayIso: string;
};

export function UnifiedClipboard({ farm, todayIso }: Props) {
  const [targetDate, setTargetDate] = useState(todayIso);

  const sheet = useMemo(
    () =>
      ingestClipboard({
        successions: farm.successions,
        blocks: farm.blocks,
        nursery: farm.nursery_batches ?? [],
        pasture: farm.pasture_rotations ?? [],
        getCrop,
        targetIso: targetDate,
      }),
    [farm, targetDate],
  );

  const printedAt = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [targetDate]);

  return (
    <div className="clipboard-sheet">
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
            Field clipboard · beds, racks, paddocks
          </p>
          <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">CLIPBOARD</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            One sheet for the day: tractor pulls, 1020 soaks and cuts, sow / pinch / net / harvest on
            the 30-inch beds. Print it. Check boxes with a grease pencil.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            DATE
            <input
              id="clip-date"
              type="date"
              value={targetDate}
              onInput={(e) => setTargetDate((e.currentTarget as HTMLInputElement).value)}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 h-11 rounded-sm border border-border bg-elevated px-2 font-mono text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <button
            id="clip-print"
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 font-display text-lg font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            <Printer className="size-4" />
            Print sheet
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4 print:rounded-none print:border-black print:bg-white print:p-0 print:text-black sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-3 print:border-black">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase print:text-black">
              Farm operating log
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase print:text-black">
              Daily field & bench assignments
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted print:text-black">{farm.name}</p>
          </div>
          <div className="text-right font-mono text-xs print:text-black">
            <p>
              DATE: <span className="font-semibold underline">{targetDate}</span>
            </p>
            <p className="text-[10px] text-faint print:text-black">Printed {printedAt}</p>
          </div>
        </header>

        <TaskTable
          n="1"
          id="clip-pasture"
          title="Livestock moves & paddock rotations"
          tag="Pasture"
          columns={["Cohort / flock", "Head", "Action / move", "Paddock / fence"]}
          rows={sheet.pasture}
          empty="No livestock move today. Water and feed check only."
          mapRow={(r) => [r.subject, r.qty, r.action, r.detail]}
        />

        <TaskTable
          n="2"
          id="clip-nursery"
          title="Indoor racks & 1020 seeding queue"
          tag="Nursery"
          columns={["Stage", "Cultivar", "Trays", "Seed / cut protocol"]}
          rows={sheet.nursery}
          empty="No nursery flats due today. Check humidity and bottom-water active trays."
          mapRow={(r) => [r.stage, r.subject, r.qty, `${r.action} · ${r.detail}`]}
        />

        <TaskTable
          n="3"
          id="clip-field"
          title="In-ground beds & flower canopy"
          tag="Field · 30 in"
          columns={["Location", "Cultivar", "Length", "Operation", "Canopy / pinch / net"]}
          rows={sheet.field}
          empty="No sow, pinch, net, or cut on the beds today."
          mapRow={(r) => [r.detail, r.subject, r.qty, r.stage, r.action]}
        />

        <section id="clip-crew-notes" className="mt-8 print:break-inside-avoid">
          <div className="flex items-end justify-between border-b border-border pb-1 print:border-black">
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-subtle uppercase print:text-black">
              4. Crew field notes
            </p>
            <p className="font-mono text-[10px] tracking-widest text-faint uppercase print:text-black">
              Weights · weather · odd plants
            </p>
          </div>
          <div className="overflow-x-auto print:overflow-visible">
          <table className="mt-2 w-full border-collapse border border-border text-left font-mono text-xs print:border-black">
            <thead>
              <tr className="bg-elevated text-[10px] tracking-widest text-faint uppercase print:bg-transparent print:text-black">
                <th className="w-8 border-r border-border p-1.5 print:border-black">[✓]</th>
                <th className="border-r border-border p-1.5 print:border-black">Bed / crop</th>
                <th className="w-24 border-r border-border p-1.5 print:border-black">Weight</th>
                <th className="p-1.5">Observation</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-t border-border print:border-black">
                  <td className="border-r border-border p-2 text-center print:border-black">[ ]</td>
                  <td className="h-9 border-r border-border print:border-black" />
                  <td className="border-r border-border print:border-black" />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <footer className="mt-6 border-t border-border pt-3 font-mono text-[10px] tracking-widest text-faint uppercase print:border-black print:text-black">
          Check the box when the row is done. Leave the note grid for harvest weights.
        </footer>
      </section>
    </div>
  );
}

function TaskTable({
  n,
  id,
  title,
  tag,
  columns,
  rows,
  empty,
  mapRow,
}: {
  n: string;
  id: string;
  title: string;
  tag: string;
  columns: string[];
  rows: ClipboardRow[];
  empty: string;
  mapRow: (row: ClipboardRow) => string[];
}) {
  return (
    <section id={id} className="mt-6 print:break-inside-avoid">
      <div className="flex items-end justify-between border-b border-border bg-elevated px-1 py-1 print:border-black print:bg-transparent">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-fg uppercase print:text-black">
          {n}. {title}
        </p>
        <p className="font-mono text-[10px] tracking-widest text-faint uppercase print:text-black">{tag}</p>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full border-collapse border border-border text-left font-mono text-xs print:border-black">
        <thead>
          <tr className="bg-elevated text-[10px] tracking-widest text-faint uppercase print:bg-transparent print:text-black">
            <th className="w-8 border-r border-border p-1.5 text-center print:border-black">[✓]</th>
            {columns.map((c, i) => (
              <th
                key={c}
                className={cn(
                  "p-1.5 font-medium",
                  i < columns.length - 1 ? "border-r border-border print:border-black" : "",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="border-r border-border p-1.5 text-center print:border-black">[ ]</td>
              <td colSpan={columns.length} className="p-1.5 text-muted italic print:text-black">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const cells = mapRow(row);
              return (
                <tr key={row.id} className="border-t border-border print:border-black">
                  <td className="border-r border-border p-1.5 text-center font-semibold print:border-black">
                    [ ]
                  </td>
                  {cells.map((cell, i) => (
                    <td
                      key={i}
                      className={cn(
                        "p-1.5 print:text-black",
                        i === 0 ? "font-semibold text-fg" : "text-muted",
                        i < cells.length - 1 ? "border-r border-border print:border-black" : "",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </section>
  );
}
