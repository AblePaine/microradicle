import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { VarietyCard } from "@/components/VarietyCard";
import {
  CROP_GROUPS,
  DTM_BANDS,
  VARIETY_COUNT,
  VARIETY_INDEX,
  filterVarieties,
} from "@/lib/varieties";
import { canonicalLink, collectionPageJsonLd, jsonLdScript, ogMeta } from "@/lib/seo";

const DESCRIPTION =
  "Research 3,000+ vegetable varieties before you order seed: days to maturity, disease resistance, spacing and growing notes, from open data.";

const DISPLAY_CAP = 150;

export const Route = createFileRoute("/varieties/")({
  component: VarietiesIndex,
  head: () => ({
    meta: [
      { title: "Seed & Variety Explorer — MicroRadicle" },
      { name: "description", content: DESCRIPTION },
      ...ogMeta({ title: "Seed & Variety Explorer — MicroRadicle", description: DESCRIPTION, path: "/varieties" }),
    ],
    scripts: [
      jsonLdScript(
        collectionPageJsonLd({ name: "Seed & Variety Explorer — MicroRadicle", description: DESCRIPTION, path: "/varieties" }),
      ),
    ],
    links: [canonicalLink("/varieties")],
  }),
});

const groupCounts = new Map<string, number>();
for (const v of VARIETY_INDEX) groupCounts.set(v.cropGroup, (groupCounts.get(v.cropGroup) ?? 0) + 1);
const topGroups = [...groupCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

function VarietiesIndex() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | "all">("all");
  const [band, setBand] = useState<string | "all">("all");
  const [resistantOnly, setResistantOnly] = useState(false);

  const list = useMemo(
    () => filterVarieties({ query, group, band, resistantOnly }),
    [query, group, band, resistantOnly],
  );
  const shown = list.slice(0, DISPLAY_CAP);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Library · {VARIETY_COUNT.toLocaleString()} varieties
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">
          VARIETY EXPLORER
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Research a variety before the seed order goes in: days to maturity, the disease
          resistance it actually carries, spacing, and growing notes — searchable across{" "}
          {VARIETY_COUNT.toLocaleString()} vegetable varieties from open data.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <GroupChip active={group === "all"} onSelect={() => setGroup("all")} label="All" count={VARIETY_COUNT} />
          {topGroups.map(([g, n]) => (
            <GroupChip key={g} active={group === g} onSelect={() => setGroup(g)} label={g} count={n} />
          ))}
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a variety — Cherokee Purple, Amelia, Brandywine…"
            aria-label="Search varieties"
            className="h-11 w-full rounded-md border border-border bg-surface pr-3 pl-10 text-sm text-fg outline-none placeholder:text-faint focus:border-accent"
          />
        </label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label="Filter by crop group"
          className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg outline-none focus:border-accent"
        >
          <option value="all">All crops</option>
          {CROP_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g} ({groupCounts.get(g) ?? 0})
            </option>
          ))}
        </select>
        <select
          value={band}
          onChange={(e) => setBand(e.target.value)}
          aria-label="Filter by days to maturity"
          className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs text-fg outline-none focus:border-accent"
        >
          <option value="all">Any maturity</option>
          {DTM_BANDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setResistantOnly((v) => !v)}
          aria-pressed={resistantOnly}
          className={
            resistantOnly
              ? "h-11 rounded-md border border-accent bg-accent px-3 font-mono text-xs whitespace-nowrap text-accent-fg"
              : "h-11 rounded-md border border-border bg-surface px-3 font-mono text-xs whitespace-nowrap text-fg hover:border-accent/50"
          }
        >
          Resistance noted
        </button>
      </div>

      {list.length === 0 ? (
        <p className="border border-dashed border-border px-4 py-12 text-center font-mono text-sm text-muted">
          No varieties match those filters.
        </p>
      ) : (
        <>
          <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
            {list.length.toLocaleString()} {list.length === 1 ? "variety" : "varieties"}
            {list.length > DISPLAY_CAP ? ` — showing the first ${DISPLAY_CAP}; narrow the filters to see the rest` : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((v) => (
              <VarietyCard key={v.slug} variety={v} />
            ))}
          </div>
        </>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted">
        <p>
          Variety data comes from{" "}
          <a href="https://github.com/cwfrazier1/openplantdb" className="text-accent hover:underline">
            OpenPlantDB
          </a>{" "}
          (CC0 1.0), built from extension and seed-house sources credited on each variety page.
          For gardener ratings and regional reviews, see Cornell&apos;s{" "}
          <a href="https://vegvariety.cce.cornell.edu/" className="text-accent hover:underline">
            Vegetable Varieties for Gardeners
          </a>
          . Growing market crops on beds? The{" "}
          <Link to="/crops" className="text-accent hover:underline">
            Cultivar library
          </Link>{" "}
          has the production sheets.
        </p>
      </footer>
    </main>
  );
}

function GroupChip({
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
      <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 text-faint"}>{count.toLocaleString()}</span>
    </button>
  );
}
