import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDaysIso,
  computeDueDate,
  computeReminderDate,
  daysUntil,
  defaultGestationDays,
  isIsoDate,
  parseHerdRecord,
  recordDueDate,
  sortRecordsByDue,
  upcomingItems,
} from "../src/lib/herdMath.ts";
import type { HerdRecord } from "../src/types/herd.ts";

function record(partial: Partial<HerdRecord>): HerdRecord {
  return {
    id: "rec-1",
    animal_id: "Tag 12",
    species: "cattle",
    breeding_date: "2026-01-01",
    gestation_days: 283,
    reminders: [],
    updated_at: "",
    ...partial,
  };
}

describe("species day-count defaults", () => {
  it("carries the published averages the design names", () => {
    assert.equal(defaultGestationDays("cattle"), 283);
    assert.equal(defaultGestationDays("sheep"), 147);
    assert.equal(defaultGestationDays("goat"), 150);
    assert.equal(defaultGestationDays("pig"), 114);
    assert.equal(defaultGestationDays("poultry"), 21);
    assert.equal(defaultGestationDays("other"), 0);
  });
});

describe("due-date arithmetic (hand-checked against a calendar)", () => {
  it("cattle: bred 2026-01-01 + 283 days = 2026-10-11", () => {
    assert.equal(computeDueDate("2026-01-01", 283), "2026-10-11");
  });
  it("cattle: bred 2026-03-15 + 283 days = 2026-12-23", () => {
    assert.equal(computeDueDate("2026-03-15", 283), "2026-12-23");
  });
  it("crosses the year boundary: bred 2025-11-20 + 283 = 2026-08-30", () => {
    assert.equal(computeDueDate("2025-11-20", 283), "2026-08-30");
  });
  it("sheep: bred 2026-02-10 + 147 days = 2026-07-07", () => {
    assert.equal(computeDueDate("2026-02-10", 147), "2026-07-07");
  });
  it("pig: bred 2026-04-01 + 114 days = 2026-07-24", () => {
    assert.equal(computeDueDate("2026-04-01", 114), "2026-07-24");
  });
  it("poultry incubation: set 2026-05-05 + 21 days = 2026-05-26", () => {
    assert.equal(computeDueDate("2026-05-05", 21), "2026-05-26");
  });
  it("leap year: 2027-12-01 + 90 days lands on 2028-02-29", () => {
    assert.equal(addDaysIso("2027-12-01", 90), "2028-02-29");
  });
  it("returns null without a breeding date or a positive day count", () => {
    assert.equal(computeDueDate("", 283), null);
    assert.equal(computeDueDate("2026-01-01", 0), null);
    assert.equal(computeDueDate("not-a-date", 283), null);
    assert.equal(recordDueDate(record({ breeding_date: "" })), null);
  });
  it("rejects impossible calendar dates", () => {
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("2026-10-11"), true);
    assert.equal(isIsoDate("10/11/2026"), false);
  });
});

describe("reminder dates", () => {
  const rec = record({
    reminders: [
      { id: "r1", label: "My note A", anchor: "breeding", offset_days: 100 },
      { id: "r2", label: "My note B", anchor: "due", offset_days: -14 },
      { id: "r3", label: "My note C", anchor: "custom", offset_days: 0, custom_date: "2026-06-15" },
    ],
  });
  it("anchors to the breeding date: 2026-01-01 + 100 = 2026-04-11", () => {
    assert.equal(computeReminderDate(rec.reminders[0]!, rec), "2026-04-11");
  });
  it("anchors to the due date with a negative offset: 2026-10-11 − 14 = 2026-09-27", () => {
    assert.equal(computeReminderDate(rec.reminders[1]!, rec), "2026-09-27");
  });
  it("uses the keeper's custom date as-is", () => {
    assert.equal(computeReminderDate(rec.reminders[2]!, rec), "2026-06-15");
  });
  it("returns null when the anchor date was never recorded", () => {
    const noBreeding = record({ breeding_date: "", reminders: rec.reminders });
    assert.equal(computeReminderDate(rec.reminders[0]!, noBreeding), null);
    assert.equal(computeReminderDate(rec.reminders[1]!, noBreeding), null);
  });
});

describe("daysUntil + upcoming window", () => {
  it("counts whole days, negative when passed", () => {
    assert.equal(daysUntil("2026-10-11", "2026-10-01"), 10);
    assert.equal(daysUntil("2026-10-11", "2026-10-11"), 0);
    assert.equal(daysUntil("2026-10-11", "2026-10-12"), -1);
  });
  it("lists due dates and reminders inside the window, soonest first, past items excluded", () => {
    const a = record({ id: "a", animal_id: "Tag 12" }); // due 2026-10-11
    const b = record({
      id: "b",
      animal_id: "Ewe 4",
      species: "sheep",
      breeding_date: "2026-05-20",
      gestation_days: 147, // due 2026-10-14
      reminders: [{ id: "rb", label: "Pen note", anchor: "breeding", offset_days: 140 }], // 2026-10-07
    });
    const items = upcomingItems([a, b], "2026-10-01", 30);
    assert.deepEqual(
      items.map((i) => [i.animal_id, i.kind, i.date]),
      [
        ["Ewe 4", "reminder", "2026-10-07"],
        ["Tag 12", "due", "2026-10-11"],
        ["Ewe 4", "due", "2026-10-14"],
      ],
    );
    assert.deepEqual(upcomingItems([a, b], "2026-10-01", 5), []);
    assert.deepEqual(upcomingItems([a], "2026-10-12", 30), []);
  });
  it("sorts records by due date, undated last", () => {
    const late = record({ id: "late", animal_id: "B", breeding_date: "2026-03-15" });
    const early = record({ id: "early", animal_id: "A" });
    const none = record({ id: "none", animal_id: "C", breeding_date: "" });
    assert.deepEqual(sortRecordsByDue([late, none, early]).map((r) => r.id), ["early", "late", "none"]);
  });
});

describe("record coercion (localStorage / import data)", () => {
  it("keeps a clean record and fills the species day-count default", () => {
    const parsed = parseHerdRecord({ id: "x", animal_id: " Tag 9 ", species: "goat", breeding_date: "2026-02-01" });
    assert.ok(parsed);
    assert.equal(parsed.animal_id, "Tag 9");
    assert.equal(parsed.gestation_days, 150);
    assert.deepEqual(parsed.reminders, []);
  });
  it("clears an impossible breeding date instead of rolling it forward", () => {
    const parsed = parseHerdRecord({ id: "x", animal_id: "Tag 9", species: "cattle", breeding_date: "2026-02-30" });
    assert.ok(parsed);
    assert.equal(parsed.breeding_date, "");
  });
  it("maps an unknown species to other and rejects records with no id or animal id", () => {
    assert.equal(parseHerdRecord({ id: "x", animal_id: "Pen 2", species: "alpaca" })?.species, "other");
    assert.equal(parseHerdRecord({ animal_id: "Tag 1" }), null);
    assert.equal(parseHerdRecord({ id: "x" }), null);
    assert.equal(parseHerdRecord("junk"), null);
  });
  it("drops malformed reminders, keeps well-formed ones", () => {
    const parsed = parseHerdRecord({
      id: "x",
      animal_id: "Tag 1",
      reminders: [{ id: "r", label: " Note ", anchor: "due", offset_days: -7 }, { label: "no id" }, "junk"],
    });
    assert.ok(parsed);
    assert.equal(parsed.reminders.length, 1);
    assert.equal(parsed.reminders[0]?.label, "Note");
    assert.equal(parsed.reminders[0]?.offset_days, -7);
  });
});
