import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  computeReminderDate,
  daysUntil,
  defaultGestationDays,
  GESTATION_DEFAULTS,
  GESTATION_BY_SPECIES,
  recordDueDate,
  sortRecordsByDue,
  upcomingItems,
} from "@/lib/herdMath";
import { canonicalLink, jsonLdScript, ogMeta, webApplicationJsonLd } from "@/lib/seo";
import { loadHerdLedger, saveHerdLedger, uid } from "@/lib/storage";
import type { HerdRecord, HerdSpecies, ReminderAnchor } from "@/types/herd";

const DESCRIPTION =
  "A herd and flock log that works in the barn: record breeding dates, let the log do the due-date math with your own day counts and reminder intervals, and print a paper log sheet. No subscription, no account — records stay in your browser and work offline. Dates and notes only; no animal-care advice.";

export const Route = createFileRoute("/herd/")({
  component: HerdIndex,
  head: () => ({
    meta: [
      { title: "Herd Packet — MicroRadicle" },
      { name: "description", content: DESCRIPTION },
      ...ogMeta({ title: "Herd Packet — MicroRadicle", description: DESCRIPTION, path: "/herd" }),
    ],
    scripts: [
      jsonLdScript(
        webApplicationJsonLd({ name: "MicroRadicle Herd Packet", description: DESCRIPTION, path: "/herd" }),
      ),
    ],
    links: [canonicalLink("/herd")],
  }),
});

const inputCls =
  "mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent";
const labelCls = "block font-mono text-[10px] tracking-widest text-subtle uppercase";

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function HerdIndex() {
  const [records, setRecords] = useState<HerdRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [today] = useState(todayIso);

  // New-record form
  const [animalId, setAnimalId] = useState("");
  const [groupLabel, setGroupLabel] = useState("");
  const [species, setSpecies] = useState<HerdSpecies>("cattle");
  const [breed, setBreed] = useState("");
  const [breedingDate, setBreedingDate] = useState("");
  const [gestationDays, setGestationDays] = useState<number>(defaultGestationDays("cattle"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setRecords(loadHerdLedger());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveHerdLedger(records);
  }, [records, loaded]);

  const sorted = useMemo(() => sortRecordsByDue(records), [records]);
  const upcoming = useMemo(() => upcomingItems(records, today, 60), [records, today]);

  function changeSpecies(next: HerdSpecies) {
    setSpecies(next);
    setGestationDays(defaultGestationDays(next));
  }

  function addRecord() {
    const name = animalId.trim();
    if (!name) return;
    const record: HerdRecord = {
      id: uid("herd"),
      animal_id: name,
      ...(groupLabel.trim() ? { group_label: groupLabel.trim() } : {}),
      species,
      ...(breed.trim() ? { breed: breed.trim() } : {}),
      breeding_date: breedingDate,
      gestation_days: gestationDays,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      reminders: [],
      updated_at: new Date().toISOString(),
    };
    setRecords((prev) => [...prev, record]);
    setAnimalId("");
    setBreed("");
    setBreedingDate("");
    setNotes("");
  }

  function removeRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function addReminder(recordId: string, label: string, anchor: ReminderAnchor, offsetDays: number, customDate: string) {
    if (!label.trim()) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              reminders: [
                ...r.reminders,
                {
                  id: uid("rem"),
                  label: label.trim(),
                  anchor,
                  offset_days: offsetDays,
                  ...(anchor === "custom" && customDate ? { custom_date: customDate } : {}),
                },
              ],
              updated_at: new Date().toISOString(),
            }
          : r,
      ),
    );
  }

  function removeReminder(recordId: string, reminderId: string) {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, reminders: r.reminders.filter((x) => x.id !== reminderId) } : r)),
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 print:hidden">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Herd & flock log</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">HERD PACKET</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          A barn notebook that does the date math. Write down the breeding date and the day count you
          use, and the log works out the due date and your reminder dates — then prints as a paper log
          sheet for the barn wall. No subscription and no account: your records stay in this browser
          and keep working offline. This is a log, not a care guide — it keeps dates and notes only,
          and every interval in it is one you set yourself.
        </p>
      </header>

      {upcoming.length > 0 ? (
        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-surface print:hidden">
          <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Coming up on your log · next 60 days
          </header>
          <ul className="divide-y divide-border">
            {upcoming.map((item) => (
              <li key={`${item.record_id}-${item.kind}-${item.label}-${item.date}`} className="flex flex-wrap items-center gap-x-4 px-3 py-2">
                <span className="font-mono text-sm text-fg">{item.animal_id}</span>
                <span className="text-sm text-muted">{item.label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted">
                  {item.date} · {item.days_until === 0 ? "today" : `in ${item.days_until}d`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface print:rounded-none print:border-zinc-400 print:bg-white print:text-zinc-950">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5 print:border-zinc-400">
          <span className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase print:text-zinc-600">
            Herd log · {sorted.length} {sorted.length === 1 ? "record" : "records"}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 rounded-md bg-accent px-3 font-mono text-[10px] tracking-widest text-accent-fg transition-transform duration-150 active:scale-[0.96] print:hidden"
          >
            PRINT LOG SHEET
          </button>
        </header>
        <ul className="divide-y divide-border print:divide-zinc-300">
          {sorted.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              today={today}
              onRemove={() => removeRecord(record.id)}
              onAddReminder={(label, anchor, offset, custom) => addReminder(record.id, label, anchor, offset, custom)}
              onRemoveReminder={(rid) => removeReminder(record.id, rid)}
            />
          ))}
          {sorted.length === 0 ? (
            <li className="px-3 py-8 text-center font-mono text-xs text-muted print:text-zinc-600">
              No records yet. Add the first animal or group below.
            </li>
          ) : null}
        </ul>

        <div className="border-t border-border p-3 print:hidden">
          <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Add a record</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelCls}>
              Tag / name / group *
              <input value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="Tag 12 · North pen ewes" className={inputCls} />
            </label>
            <label className={labelCls}>
              Group / pen (optional)
              <input value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} placeholder="Home pasture" className={inputCls} />
            </label>
            <label className={labelCls}>
              Species
              <select value={species} onChange={(e) => changeSpecies(e.target.value as HerdSpecies)} className={inputCls}>
                {GESTATION_DEFAULTS.map((g) => (
                  <option key={g.species} value={g.species}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Breed (optional)
              <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Angus cross" className={inputCls} />
            </label>
            <label className={labelCls}>
              Breeding date you recorded
              <input type="date" value={breedingDate} onChange={(e) => setBreedingDate(e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Day count to due date
              <input
                type="number"
                min={0}
                value={gestationDays}
                onChange={(e) => setGestationDays(Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>
          <label className={`${labelCls} mt-2`}>
            Notes (optional)
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your own record notes" className={inputCls} />
          </label>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
            The day count pre-fills with the common published average for the species (cattle 283,
            sheep 147, goats 150, pigs 114, poultry incubation 21) — edit it to match your own
            records. The log does arithmetic on your entries; it does not set schedules.
          </p>
          <button
            type="button"
            onClick={addRecord}
            className="mt-3 h-11 rounded-md bg-accent px-4 font-mono text-[10px] tracking-widest text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            ADD RECORD
          </button>
        </div>
      </section>

      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-widest text-faint print:hidden">
        Records live only in this browser (local storage) — the printed log sheet is the paper
        copy. Dates are computed from the entries you made; check them against your own barn
        records.
      </p>
    </main>
  );
}

function RecordRow({
  record,
  today,
  onRemove,
  onAddReminder,
  onRemoveReminder,
}: {
  record: HerdRecord;
  today: string;
  onRemove: () => void;
  onAddReminder: (label: string, anchor: ReminderAnchor, offsetDays: number, customDate: string) => void;
  onRemoveReminder: (reminderId: string) => void;
}) {
  const due = recordDueDate(record);
  const days = due ? daysUntil(due, today) : null;
  const [rLabel, setRLabel] = useState("");
  const [rAnchor, setRAnchor] = useState<ReminderAnchor>("due");
  const [rOffset, setROffset] = useState(-14);
  const [rCustom, setRCustom] = useState("");

  return (
    <li className="px-3 py-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-sm font-semibold text-fg print:text-zinc-950">{record.animal_id}</span>
        <span className="font-mono text-[10px] tracking-widest text-faint print:text-zinc-600">
          {GESTATION_BY_SPECIES.get(record.species)?.label ?? "Other"}
          {record.breed ? ` · ${record.breed}` : ""}
          {record.group_label ? ` · ${record.group_label}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted print:text-zinc-700">
          {record.breeding_date ? <span>Bred {record.breeding_date}</span> : <span>No breeding date recorded</span>}
          {due ? (
            <span className="border border-border bg-elevated px-2 py-1 print:border-zinc-400 print:bg-white">
              Due <span className="text-fg print:text-zinc-950">{due}</span>
              {days !== null ? <span> · {days === 0 ? "today" : days > 0 ? `in ${days}d` : `${-days}d ago`}</span> : null}
            </span>
          ) : null}
          <button type="button" onClick={onRemove} className="text-faint underline-offset-2 hover:underline print:hidden">
            remove
          </button>
        </span>
      </div>
      {record.notes ? <p className="mt-1 text-sm text-muted print:text-zinc-700">{record.notes}</p> : null}

      {record.reminders.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {record.reminders.map((reminder) => {
            const date = computeReminderDate(reminder, record);
            return (
              <li key={reminder.id} className="flex flex-wrap items-center gap-x-3 font-mono text-[11px] text-muted print:text-zinc-700">
                <span className="text-fg print:text-zinc-950">{reminder.label}</span>
                <span>{date ?? "date not set — anchor date missing"}</span>
                <button
                  type="button"
                  onClick={() => onRemoveReminder(reminder.id)}
                  className="text-faint underline-offset-2 hover:underline print:hidden"
                >
                  remove
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-2 flex flex-wrap items-end gap-2 print:hidden">
        <label className={`${labelCls} min-w-48 flex-1`}>
          Reminder label — yours
          <input value={rLabel} onChange={(e) => setRLabel(e.target.value)} placeholder="e.g. My booster note" className={inputCls} />
        </label>
        <label className={labelCls}>
          Count from
          <select value={rAnchor} onChange={(e) => setRAnchor(e.target.value as ReminderAnchor)} className={inputCls}>
            <option value="breeding">Breeding date</option>
            <option value="due">Due date</option>
            <option value="custom">A date I pick</option>
          </select>
        </label>
        {rAnchor === "custom" ? (
          <label className={labelCls}>
            Date
            <input type="date" value={rCustom} onChange={(e) => setRCustom(e.target.value)} className={inputCls} />
          </label>
        ) : (
          <label className={labelCls}>
            Days (can be negative)
            <input type="number" value={rOffset} onChange={(e) => setROffset(Number(e.target.value))} className={inputCls} />
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            onAddReminder(rLabel, rAnchor, rOffset, rCustom);
            setRLabel("");
          }}
          className="h-11 rounded-md border border-border bg-elevated px-3 font-mono text-[10px] tracking-widest text-fg transition-transform duration-150 active:scale-[0.96]"
        >
          ADD REMINDER
        </button>
      </div>
    </li>
  );
}
