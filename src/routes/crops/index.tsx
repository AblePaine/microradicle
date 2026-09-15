import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CropCard } from "@/components/CropCard";
import { CROP_CATEGORIES, CULTIVAR_COUNT, FAMILIES, FROST_BANDS, cropsByCategory, filterCrops } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import { CATEGORY_LABEL, FROST_LABEL, type CropCategory, type FrostHardiness } from "@/types/crop";

export const Route = createFileRoute("/crops/")({
  component: CropsIndex,
  head: () => ({
    meta: [
      { title: "Cultivars — MicroRadicle" },
      {
        name: "description",
        content:
          "Cultivar sheets for a 30-inch bed: spacing, days to harvest, what it pays, drip, and what it takes from the soil.",
      },
    ],
  }),
});

function CropsIndex() {
  const units = useFarmStore((s) => s.farm.units);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CropCategory | "all">("all");
  const [frost, setFrost] = useState<FrostHardiness | "all">("all");
  const [family, setFamily] = useState<string | "all">("all");

  const list = useMemo(
    () => filterCrops({ query, category, frost, family }),
    [query, category, frost, family],
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Library · {CULTIVAR_COUNT} cv.</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">CULTIVARS</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Spacing, days to harvest, what it pays, and what it takes from the soil. Vegetables and
          cut flowers share the same field map — open a sheet, then plant it.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <CategoryChip
            active={category === "all"}
            onSelect={() => setCategory("all")}
            label="All"
            count={CULTIVAR_COUNT}
          />
          {CROP_CATEGORIES.map((t) => (
            <CategoryChip
              key={t}
              active={category === t}
              onSelect={() => setCategory(t)}
              label={CATEGORY_LABEL[t]}
              count={cropsByCategory[t]}
            />
          ))}
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cultivar, family, botanic…"
            aria-label="Search cultivars"
            className="h-11 w-full rounded-md border border-border bg-surface pr-3 pl-10 text-sm text-fg outline-none placeholder:text-faint focus:border-accent"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CropCategory | "all")}
          aria-label="Filter by category"
          className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg outline-none focus:border-accent"
        >
          <option value="all">All categories</option>
          {CROP_CATEGORIES.map((t) => (
            <option key={t} value={t}>
              {CATEGORY_LABEL[t]} ({cropsByCategory[t]})
            </option>
          ))}
        </select>
        <select
          value={frost}
          onChange={(e) => setFrost(e.target.value as FrostHardiness | "all")}
          aria-label="Filter by frost hardiness"
          className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg outline-none focus:border-accent"
        >
          <option value="all">All frost bands</option>
          {FROST_BANDS.map((t) => (
            <option key={t} value={t}>
              {FROST_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          aria-label="Filter by family"
          className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg outline-none focus:border-accent"
        >
          <option value="all">All families</option>
          {FAMILIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="border border-dashed border-border px-4 py-12 text-center font-mono text-sm text-muted">
          No cultivars match those filters.
        </p>
      ) : (
        <>
          <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
            {list.length} {list.length === 1 ? "cultivar" : "cultivars"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <CropCard key={c.id} crop={c} units={units} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function CategoryChip({
  active,
  onSelect,
  label,
  count,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={
        active
          ? "rounded-sm border border-accent bg-accent px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-accent-fg uppercase"
          : "rounded-sm border border-border bg-surface px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted uppercase hover:border-accent/50 hover:text-fg"
      }
    >
      {label}
      <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 text-faint"}>{count}</span>
    </button>
  );
}
