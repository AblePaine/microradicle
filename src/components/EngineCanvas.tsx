import { useMemo } from "react";
import { Link2, Printer } from "lucide-react";
import type { Crop, EngineTradeFilter } from "@/types/crop";
import type { BedSuccession, FarmState, FieldBlock, Units } from "@/types/farm";
import { cropBySlug, cropMatchesTrade, tradeViewLabel } from "@/lib/crops";
import { formatBedFt, occupancy, successionPhase } from "@/lib/math";
import { cn } from "@/lib/utils";

type Props = {
  farm: FarmState;
  selectedBlockId: string | null;
  selectedBedIndex: number;
  selectedSuccessionId: string | null;
  onSelectBed: (blockId: string, bedIndex: number) => void;
  onSelectSuccession: (blockId: string, bedIndex: number, succession: BedSuccession) => void;
  onOpenClipboard?: () => void;
  onCopyShare?: () => void;
  shareReady?: boolean;
  /** Gateway deep-link: dim beds whose crop is outside the trade. */
  tradeFilter?: EngineTradeFilter;
};

export function EngineCanvas({
  farm,
  selectedBlockId,
  selectedBedIndex,
  selectedSuccessionId,
  onSelectBed,
  onSelectSuccession,
  onOpenClipboard,
  onCopyShare,
  shareReady,
  tradeFilter,
}: Props) {
  const maxFt = Math.max(50, ...farm.blocks.map((b) => b.bed_length_ft));
  const today = useMemo(() => new Date(), []);
  const units: Units = farm.units;
  const totalBeds = farm.blocks.reduce((s, b) => s + b.bed_count, 0);
  const totalFt = farm.blocks.reduce((s, b) => s + b.bed_count * b.bed_length_ft, 0);
  const trade = tradeViewLabel(tradeFilter);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>
          Plot map · overhead
          {trade ? <span className="text-accent"> · {trade}</span> : null}
        </span>
        <div className="flex items-center gap-1.5">
          {onCopyShare ? (
            <button
              type="button"
              onClick={onCopyShare}
              disabled={!shareReady}
              title="Copy succession URL"
              className="inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-muted hover:text-accent disabled:opacity-40"
            >
              <Link2 className="size-3" />
              Share
            </button>
          ) : null}
          {onOpenClipboard ? (
            <button
              type="button"
              onClick={onOpenClipboard}
              title="Field clipboard"
              className="inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-muted hover:text-accent"
            >
              <Printer className="size-3" />
              Clip
            </button>
          ) : null}
          <span className="tabular text-faint">
            {farm.blocks.length} blk · {totalBeds} beds · {totalFt} lin ft
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
        <div className="mb-1.5 flex px-[88px] font-mono text-[9px] tracking-widest text-faint">
          <span>0</span>
          <span className="mx-auto">{formatBedFt(maxFt / 2, units)}</span>
          <span>{formatBedFt(maxFt, units)}</span>
        </div>
        <div className="flex flex-col gap-3">
          {farm.blocks.map((block) => (
            <BlockGroup
              key={block.id}
              block={block}
              farm={farm}
              maxFt={maxFt}
              units={units}
              today={today}
              selectedBlockId={selectedBlockId}
              selectedBedIndex={selectedBedIndex}
              selectedSuccessionId={selectedSuccessionId}
              onSelectBed={onSelectBed}
              onSelectSuccession={onSelectSuccession}
              tradeFilter={tradeFilter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockGroup({
  block,
  farm,
  maxFt,
  units,
  today,
  selectedBlockId,
  selectedBedIndex,
  selectedSuccessionId,
  onSelectBed,
  onSelectSuccession,
  tradeFilter,
}: {
  block: FieldBlock;
  farm: FarmState;
  maxFt: number;
  units: Units;
  today: Date;
  selectedBlockId: string | null;
  selectedBedIndex: number;
  selectedSuccessionId: string | null;
  onSelectBed: (blockId: string, bedIndex: number) => void;
  onSelectSuccession: (blockId: string, bedIndex: number, succession: BedSuccession) => void;
  tradeFilter?: EngineTradeFilter;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-faint uppercase">
        {block.name} · {block.bed_count} × {formatBedFt(block.bed_length_ft, units)}
      </p>
      <div className="flex flex-col gap-1">
        {Array.from({ length: block.bed_count }, (_, i) => (
          <BedStrip
            key={i}
            block={block}
            bedIndex={i}
            successions={farm.successions.filter((s) => s.block_id === block.id && s.bed_index === i)}
            maxFt={maxFt}
            units={units}
            today={today}
            selected={selectedBlockId === block.id && selectedBedIndex === i}
            selectedSuccessionId={selectedSuccessionId}
            onSelectBed={onSelectBed}
            onSelectSuccession={onSelectSuccession}
            tradeFilter={tradeFilter}
          />
        ))}
      </div>
    </div>
  );
}

function BedStrip({
  block,
  bedIndex,
  successions,
  maxFt,
  units,
  today,
  selected,
  selectedSuccessionId,
  onSelectBed,
  onSelectSuccession,
  tradeFilter,
}: {
  block: FieldBlock;
  bedIndex: number;
  successions: BedSuccession[];
  maxFt: number;
  units: Units;
  today: Date;
  selected: boolean;
  selectedSuccessionId: string | null;
  onSelectBed: (blockId: string, bedIndex: number) => void;
  onSelectSuccession: (blockId: string, bedIndex: number, succession: BedSuccession) => void;
  tradeFilter?: EngineTradeFilter;
}) {
  const live = successions.filter((s) => {
    const occ = occupancy(s);
    return today >= occ.start && today <= occ.end;
  });
  const shown = live.length ? live : successions.slice(0, 1);

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => onSelectBed(block.id, bedIndex)}
        className={cn(
          "w-[80px] shrink-0 truncate rounded-sm px-1.5 text-left font-mono text-[10px] tracking-wide",
          selected ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
        )}
      >
        {bedIndex + 1}
      </button>
      <button
        type="button"
        onClick={() => onSelectBed(block.id, bedIndex)}
        className={cn(
          "relative h-9 min-w-0 flex-1 overflow-hidden rounded-sm border",
          selected ? "border-accent" : "border-border hover:border-border-strong",
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #111113 0px, #111113 11px, #1a1a1d 11px, #1a1a1d 12px)",
        }}
      >
        <span
          className="pointer-events-none absolute inset-y-0 right-0 bg-bg/40"
          style={{ width: `${((maxFt - block.bed_length_ft) / maxFt) * 100}%` }}
        />
        {shown.map((s) => {
          const crop: Crop | undefined = cropBySlug.get(s.crop_id);
          if (!crop) return null;
          const width = (s.bed_feet_needed / maxFt) * 100;
          const phase = successionPhase(s, today);
          const occ = occupancy(s);
          const isLive = today >= occ.start && today <= occ.end;
          const inTrade = !tradeFilter || cropMatchesTrade(crop, tradeFilter);
          return (
            <span
              key={s.id}
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBed(block.id, bedIndex);
                onSelectSuccession(block.id, bedIndex, s);
              }}
              className={cn(
                "absolute top-1 bottom-1 left-0 flex items-center overflow-hidden rounded-xs px-1.5 font-mono text-[10px] text-bg",
                selectedSuccessionId === s.id && "ring-2 ring-fg",
                (!isLive || !inTrade) && "opacity-45",
              )}
              style={{
                width: `${width}%`,
                backgroundColor: crop.swatch,
              }}
              title={`${crop.cultivar} · ${phase} · harvest ${s.target_harvest_date}`}
            >
              <span className="truncate font-medium leading-none">{crop.cultivar}</span>
            </span>
          );
        })}
      </button>
    </div>
  );
}