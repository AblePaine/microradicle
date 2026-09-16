import assert from "node:assert/strict";
import { describe, it } from "node:test";
import lettuce from "../src/data/crops/lettuce-salanova-butterhead.json" with { type: "json" };
import zinnia from "../src/data/crops/zinnia-benarys-giant-coral.json" with { type: "json" };
import snapdragon from "../src/data/crops/snapdragon-potomac-red.json" with { type: "json" };
import {
  addIsoDays,
  coerceNurseryLedgerItem,
  coercePastureLedgerItem,
  fieldRowsForDate,
  ingestClipboard,
  isMoveDay,
  nettingOffsetDays,
  nurseryRowsForDate,
  pastureRowsForDate,
  pinchOffsetDays,
} from "../src/lib/clipboardIngestion.ts";
import { computeRotation } from "../src/lib/pastureMath.ts";
import { computeBatch } from "../src/lib/nurseryMath.ts";
import catalog from "../src/data/pasture/species.json" with { type: "json" };
import micros from "../src/data/nursery/microgreens.json" with { type: "json" };
import type { Crop } from "../src/types/crop.ts";
import type { BedSuccession, FieldBlock } from "../src/types/farm.ts";
import type { LivestockSpeciesSpec } from "../src/types/pasture.ts";
import type { MicrogreenCultivar } from "../src/types/nursery.ts";

const SPECS = catalog as LivestockSpeciesSpec[];
const MICROS = micros as MicrogreenCultivar[];
const LETTUCE = lettuce as Crop;
const ZINNIA = zinnia as Crop;
const SNAP = snapdragon as Crop;

function spec(id: string): LivestockSpeciesSpec {
  const s = SPECS.find((x) => x.id === id);
  assert.ok(s, id);
  return s;
}

function micro(id: string): MicrogreenCultivar {
  const c = MICROS.find((x) => x.id === id);
  assert.ok(c, id);
  return c;
}

const BLOCK: FieldBlock = {
  id: "blk-a",
  name: "A LETTUCE",
  bed_count: 4,
  bed_length_ft: 50,
  bed_width_in: 30,
};

describe("pasture move days", () => {
  it("pulls Cornish Cross every day and Katahdin on the 3-day cycle", () => {
    const cornish = computeRotation(
      spec("ps-broiler-cornish-cross"),
      80,
      "standard-perennial-mix",
      "2026-09-15",
      1,
      120,
      "pr-1",
    );
    const sheep = computeRotation(
      spec("ps-sheep-katahdin"),
      12,
      "lush-spring-flush",
      "2026-09-15",
      3,
      0,
      "pr-s",
    );
    assert.equal(isMoveDay("2026-09-15", 1, "2026-09-16"), true);
    assert.equal(isMoveDay("2026-09-15", 3, "2026-09-16"), false);
    assert.equal(isMoveDay("2026-09-15", 3, "2026-09-18"), true);
    const day16 = pastureRowsForDate([cornish, sheep], "2026-09-16");
    assert.equal(day16.length, 1);
    assert.equal(day16[0]?.subject, "Cornish Cross");
    assert.match(day16[0]?.action ?? "", /Tractor pull/);
    const day18 = pastureRowsForDate([cornish, sheep], "2026-09-18");
    assert.equal(day18.length, 2);
    assert.ok(day18.some((r) => r.subject === "Katahdin" && /Shift paddock/.test(r.action)));
  });
});

describe("nursery stages", () => {
  it("emits soak, sow/stack, unstack, and cut on the matching dates", () => {
    const crop = micro("mg-broccoli-waltham");
    const batch = computeBatch(crop, 4, "2026-09-16", "nb-1");
    const sow = nurseryRowsForDate([batch], batch.sow_date);
    assert.ok(sow.some((r) => r.stage === "SOW / STACK"));
    assert.ok(sow[0]?.qty.includes("4"));
    if (batch.soak_start_date) {
      const soak = nurseryRowsForDate([batch], batch.soak_start_date);
      assert.ok(soak.some((r) => r.stage === "SOAK"));
    }
    const unstack = nurseryRowsForDate([batch], batch.unstack_date);
    if (batch.unstack_date !== batch.sow_date) {
      assert.ok(unstack.some((r) => r.stage === "UNSTACK / LIGHTS"));
    }
    const cut = nurseryRowsForDate([batch], batch.harvest_date);
    assert.ok(cut.some((r) => r.stage === "CUT HARVEST"));
    const idle = nurseryRowsForDate([batch], "2026-01-01");
    assert.equal(idle.length, 0);
  });
});

describe("field pinch and net", () => {
  it("schedules a zinnia pinch and first net off the transplant date", () => {
    const field = "2026-09-16";
    const suc: BedSuccession = {
      id: "s-z",
      block_id: "blk-a",
      bed_index: 0,
      crop_id: ZINNIA.id,
      target_harvest_date: addIsoDays(field, ZINNIA.timeline.dtmFromField),
      field_transplant_date: field,
      nursery_sow_date: addIsoDays(field, -ZINNIA.propagation.nurseryLeadDays),
      harvest_end_date: addIsoDays(field, ZINNIA.timeline.dtmFromField + 21),
      bed_feet_needed: 50,
      target_units: 400,
    };
    const crops = (id: string) => (id === ZINNIA.id ? ZINNIA : undefined);
    const pinchDay = addIsoDays(field, pinchOffsetDays(ZINNIA.flowerSpecifics!.pinching.pinchAtHeightIn));
    const netDay = addIsoDays(field, nettingOffsetDays(ZINNIA.flowerSpecifics!.supportNetting.firstLayerHeightIn));
    const pinch = fieldRowsForDate([suc], [BLOCK], crops, pinchDay);
    assert.ok(pinch.some((r) => r.stage === "PINCH" && r.subject.includes("Giant Coral")));
    const net = fieldRowsForDate([suc], [BLOCK], crops, netDay);
    assert.ok(net.some((r) => r.stage === "NET"));
    const transplant = fieldRowsForDate([suc], [BLOCK], crops, field);
    assert.ok(transplant.some((r) => r.stage === "FIELD"));
  });

  it("does not pinch Potomac snaps and still hangs two net layers", () => {
    assert.equal(SNAP.flowerSpecifics?.pinching.required, false);
    const field = "2026-09-16";
    const suc: BedSuccession = {
      id: "s-s",
      block_id: "blk-a",
      bed_index: 1,
      crop_id: SNAP.id,
      target_harvest_date: addIsoDays(field, SNAP.timeline.dtmFromField),
      field_transplant_date: field,
      nursery_sow_date: addIsoDays(field, -SNAP.propagation.nurseryLeadDays),
      harvest_end_date: addIsoDays(field, SNAP.timeline.dtmFromField + 14),
      bed_feet_needed: 50,
      target_units: 400,
    };
    const crops = (id: string) => (id === SNAP.id ? SNAP : undefined);
    const pinchDay = addIsoDays(field, pinchOffsetDays(10));
    const pinch = fieldRowsForDate([suc], [BLOCK], crops, pinchDay);
    assert.equal(
      pinch.filter((r) => r.stage === "PINCH").length,
      0,
    );
    const netDay = addIsoDays(field, nettingOffsetDays(SNAP.flowerSpecifics!.supportNetting.firstLayerHeightIn));
    const net = fieldRowsForDate([suc], [BLOCK], crops, netDay);
    assert.ok(net.some((r) => r.stage === "NET"));
  });

  it("lists a lettuce cut on the harvest date", () => {
    const suc: BedSuccession = {
      id: "s-l",
      block_id: "blk-a",
      bed_index: 2,
      crop_id: LETTUCE.id,
      target_harvest_date: "2026-09-20",
      field_transplant_date: "2026-08-20",
      nursery_sow_date: "2026-08-01",
      harvest_end_date: "2026-09-27",
      bed_feet_needed: 50,
      target_units: 80,
    };
    const crops = (id: string) => (id === LETTUCE.id ? LETTUCE : undefined);
    const cut = fieldRowsForDate([suc], [BLOCK], crops, "2026-09-20");
    assert.ok(cut.some((r) => r.stage === "CUT" && r.subject.includes("Salanova")));
    const idle = fieldRowsForDate([suc], [BLOCK], crops, "2026-09-16");
    assert.equal(idle.length, 0);
  });
});

describe("ingestClipboard", () => {
  it("returns three discipline buckets for one day", () => {
    const rotation = computeRotation(
      spec("ps-broiler-cornish-cross"),
      80,
      "standard-perennial-mix",
      "2026-09-16",
      1,
      120,
      "pr-1",
    );
    const batch = computeBatch(micro("mg-pea-speckled"), 2, "2026-09-16", "nb-2");
    const suc: BedSuccession = {
      id: "s-l",
      block_id: "blk-a",
      bed_index: 0,
      crop_id: LETTUCE.id,
      target_harvest_date: "2026-09-16",
      field_transplant_date: "2026-08-16",
      nursery_sow_date: "2026-08-01",
      harvest_end_date: "2026-09-23",
      bed_feet_needed: 50,
      target_units: 80,
    };
    const sheet = ingestClipboard({
      successions: [suc],
      blocks: [BLOCK],
      nursery: [batch],
      pasture: [rotation],
      getCrop: (id) => (id === LETTUCE.id ? LETTUCE : undefined),
      targetIso: "2026-09-16",
    });
    assert.ok(sheet.pasture.length >= 1);
    assert.ok(sheet.nursery.length >= 1);
    assert.ok(sheet.field.some((r) => r.stage === "CUT"));
  });
});

describe("spec-shaped ledger rows", () => {
  it("ingests a 1020 batch with cultivar_name and no cultivar_id", () => {
    const row = coerceNurseryLedgerItem({
      id: "nb-spec",
      cultivar_name: "Waltham broccoli",
      tray_count: 4,
      sow_date: "2026-09-16",
      soak_start_date: "2026-09-15",
      unstack_date: "2026-09-19",
      harvest_date: "2026-09-24",
      total_seed_grams_needed: 80,
      projected_yield_oz: 48,
    });
    assert.ok(row);
    assert.equal(row?.cultivar_id, "Waltham broccoli");
    const soak = nurseryRowsForDate([row!], "2026-09-15");
    assert.ok(soak.some((r) => r.stage === "SOAK"));
    const sow = nurseryRowsForDate([row!], "2026-09-16");
    assert.ok(sow.some((r) => r.stage === "SOW / STACK" && r.action.includes("80")));
  });

  it("prints a Cornish tractor pull from batch_id + species_name with no start date", () => {
    const row = coercePastureLedgerItem({
      batch_id: "mv-1",
      species_name: "Cornish Cross",
      head_count: 80,
      move_interval_days: 1,
      allocated_paddock_sqft: 120,
      recommended_netting_rolls: 0,
    });
    assert.ok(row);
    assert.equal(row?.id, "mv-1");
    const today = pastureRowsForDate([row!], "2026-09-16");
    assert.equal(today.length, 1);
    assert.match(today[0]?.action ?? "", /Tractor pull/);
  });

  it("uses timestamp as the rotation start for a 3-day Katahdin shift", () => {
    const row = coercePastureLedgerItem({
      batch_id: "mv-s",
      species_name: "Katahdin",
      head_count: 12,
      move_interval_days: 3,
      allocated_paddock_sqft: 4000,
      recommended_netting_rolls: 2,
      timestamp: "2026-09-15T06:00:00.000Z",
    });
    assert.ok(row);
    assert.equal(row?.start_date, "2026-09-15");
    const skip = pastureRowsForDate([row!], "2026-09-16");
    assert.equal(skip.length, 0);
    const due = pastureRowsForDate([row!], "2026-09-18");
    assert.equal(due.length, 1);
    assert.match(due[0]?.action ?? "", /Shift paddock/);
  });

  it("maps a 10 in zinnia pinch to 18 days", () => {
    assert.equal(pinchOffsetDays(10), 18);
    assert.equal(nettingOffsetDays(12), 13);
  });
});
