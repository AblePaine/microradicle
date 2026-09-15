import {
  FLOWER_STAGE_LABEL,
  FLOWER_USE_LABEL,
  PULSE_LABEL,
  type Crop,
  type CutFlowerSpecifics,
} from "@/types/crop";
import type { Units } from "@/types/farm";
import { formatLengthIn } from "@/lib/math";

type Props = {
  crop: Crop;
  flower: CutFlowerSpecifics;
  units: Units;
};

export function FlowerSpecSummary({ crop, flower, units }: Props) {
  const net = flower.supportNetting;
  const pinch = flower.pinching;
  const cut = flower.harvestProtocol;
  const netLabel = !net.required
    ? "None — self-supporting"
    : `${net.layers}-layer Hortonova · ${formatLengthIn(net.meshSizeIn, units)} mesh · ${formatLengthIn(net.firstLayerHeightIn, units)}${
        net.secondLayerHeightIn != null ? ` / ${formatLengthIn(net.secondLayerHeightIn, units)}` : ""
      }`;
  const pinchLabel = !pinch.required
    ? "Do not pinch"
    : `${formatLengthIn(pinch.pinchAtHeightIn, units)} · leave ${pinch.leaveNodeCount} nodes · +${pinch.dtmPenaltyDays} d DTM`;
  const pulse = PULSE_LABEL[cut.recommendedPulse];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-2">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Cut flower protocol</h2>
        <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
          {FLOWER_USE_LABEL[flower.primaryUse]} · {formatLengthIn(flower.targetStemLengthIn, units)} stem
        </p>
      </header>
      <dl>
        <Row k="Support netting" v={netLabel} />
        <Row k="Pinch" v={pinchLabel} />
        <Row
          k="Harvest stage"
          v={`${FLOWER_STAGE_LABEL[cut.stage]}${cut.cutFrequencyDays ? ` · every ${cut.cutFrequencyDays} d` : " · once"}`}
        />
        <Row
          k="Stem yield"
          v={`${cut.stemsPerPlant} / plant · ${cut.stemsPerLinearBedFoot} / bed-ft`}
        />
        <Row k="Pulse" v={`${pulse} · vase ${cut.vaseLifeDays} d`} />
        <Row
          k="DTM on this sheet"
          v={`${crop.timeline.dtmFromField} d field-to-cut${pinch.required ? ` (includes pinch)` : ""}`}
        />
      </dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-2.5 last:border-0">
      <dt className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{k}</dt>
      <dd className="text-right font-mono text-sm text-fg">{v}</dd>
    </div>
  );
}
