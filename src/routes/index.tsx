import { createFileRoute, Link } from "@tanstack/react-router";
import { FLOWER_COUNT, VEGETABLE_COUNT, CULTIVAR_COUNT } from "@/lib/crops";
import { MICROGREEN_COUNT } from "@/lib/nursery";
import { SPECIES_COUNT } from "@/lib/pasture";

export const Route = createFileRoute("/")({
  component: Gateway,
  head: () => ({
    meta: [
      { title: "MicroRadicle // Tools for ¼–3 acre farms" },
      {
        name: "description",
        content:
          "A straightforward workspace for human-scale growers. Plan 30-inch beds, size drip, balance fertilizer, run a tray nursery, rotate a small flock, and manage the cooler — free, in the browser, no account.",
      },
    ],
  }),
});

function Gateway() {
  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-10 font-mono sm:px-6 sm:py-12">
      <section className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
              <span className="size-2 shrink-0 bg-accent" aria-hidden />
              Open operating tools for 0.25 to 3-acre bio-intensive farms
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-wide text-fg sm:text-6xl">
              MICRORADICLE
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              A straightforward, reliable workspace for human-scale growers. Plan out your bed
              successions around real daylight, size your drip lines, balance your organic fertilizer,
              and manage cold-room storage—all completely free, right in your browser, with no accounts
              or cloud tracking.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <StatusChip k="Storage" v="Saved locally in your browser" ok />
              <StatusChip k="Access" v="No signups or accounts" />
              <StatusChip k="Layout" v={'Built for 30" beds'} accent />
            </div>
          </div>
          <div className="grid min-w-[240px] grid-cols-2 gap-2 sm:min-w-[280px]">
            <Kpi k="Cultivars" v={String(CULTIVAR_COUNT)} d="In the library" />
            <Kpi k="Tools live" v="4 live" d="Beds + pasture" accent />
            <Kpi k="Market veg" v={String(VEGETABLE_COUNT)} d="8 crop types" />
            <Kpi k="Cut flowers" v={String(FLOWER_COUNT)} d="Stem crops" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
          <div>
            <p className="text-[10px] tracking-[0.22em] text-accent uppercase">What you grow</p>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-fg">PRODUCTION HUBS</h2>
          </div>
          <p className="hidden text-[11px] tracking-[0.16em] text-subtle uppercase sm:block">
            Pick a crop, then plant it
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <HubCard
            live
            count={`${VEGETABLE_COUNT} cv.`}
            title="Market vegetables"
            body="Salad greens, brassicas, roots, and tomatoes. Row spacing, seeder rollers, and how long a bed is tied up — including slower fall days."
            cta="Open veg beds →"
            to="/engine"
            search={{ category: "vegetables" }}
          />
          <HubCard
            live
            count={`${FLOWER_COUNT} cv.`}
            title="Specialty cut flowers"
            body="Focals, spikes, fillers, and branching annuals. Netting height, when to pinch, when to cut, and how long they last in the vase."
            cta="Open flower beds →"
            to="/engine"
            search={{ category: "cut-flowers" }}
            accentCta
          />
          <HubCard
            live
            count={`${MICROGREEN_COUNT} cv.`}
            title="Microgreens & nursery"
            body="Indoor 1020 flats. Seed weight per tray, days in the dark, and what a 7–14 day cycle actually pays. Basil and chia never go in the soak bucket."
            cta="Open the nursery →"
            to="/nursery"
            accentCta
          />
          <HubCard
            live
            count={`${SPECIES_COUNT} breeds`}
            title="Rotational pasture"
            body="Broiler tractors, egg-mobiles, hair sheep, and a handful of cattle. Daily dry matter, 164-foot net rolls, rest days, and what the manure puts back."
            cta="Open pasture →"
            to="/pasture"
            accentCta
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
          <div>
            <p className="text-[10px] tracking-[0.22em] text-accent uppercase">The rest of the farm</p>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-fg">
              WATER, SOIL, COOLER, CLIPBOARDS
            </h2>
          </div>
          <p className="hidden text-[11px] tracking-[0.16em] text-subtle uppercase sm:block">
            Same farm, every crop
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            k="Module 02"
            t="Drip lines"
            d="How much water each bed wants. Sizes headers and poly so the last emitter still has pressure."
            href="/irrigation"
            cta="Open drip →"
          />
          <ModuleCard
            k="Module 03"
            t="Soil & fertilizer"
            d="What the crops took out, and which bag puts it back. Won't dump extra phosphorus on you."
            href="/soil"
            cta="Open soil →"
          />
          <ModuleCard
            k="Module 04"
            t="Pack-shed & cooler"
            d="How much heat walked in with harvest, and whether the CoolBot can knock it down before the greens wilt."
            href="/economics"
            cta="Open pack-shed →"
          />
          <ModuleCard
            k="Offline ops"
            t="Field clipboards"
            d="Print today's paddock pulls, 1020 soaks and cuts, and bed sow / pinch / net / harvest on one sheet."
            href="/clipboard"
            cta="Print today's sheet →"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-elevated p-5 sm:p-6">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
          What you can count on
        </p>
        <div className="grid grid-cols-1 gap-6 text-xs leading-relaxed text-muted md:grid-cols-3">
          <div>
            <span className="mb-1 block font-semibold text-fg">01 // Work backwards from market day</span>
            You pick the harvest date. We count back to sow and transplant. Short days in fall slow the
            crop down — the calendar already knows that.
          </div>
          <div>
            <span className="mb-1 block font-semibold text-fg">02 // Real numbers, not guesses</span>
            Every cultivar has row counts, in-row spacing, and a yield per bed-foot from the field. No
            filler paragraphs standing in for a spec.
          </div>
          <div>
            <span className="mb-1 block font-semibold text-fg">03 // Stays on this machine</span>
            Nothing lives on a server that can drop in the field. Your blocks, successions, and settings
            sit in this browser until you export them.
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusChip({
  k,
  v,
  ok,
  accent,
}: {
  k: string;
  v: string;
  ok?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="border border-border bg-bg px-3 py-1.5 text-muted">
      {k}:{" "}
      <span className={ok ? "font-semibold text-ok" : accent ? "font-semibold text-accent" : "font-semibold text-fg"}>
        {v}
      </span>
    </div>
  );
}

function Kpi({ k, v, d, accent }: { k: string; v: string; d: string; accent?: boolean }) {
  return (
    <div className="border border-border bg-bg p-3">
      <p className="text-[10px] tracking-[0.16em] text-subtle uppercase">{k}</p>
      <p className={`font-display text-2xl font-semibold tracking-wide ${accent ? "text-accent" : "text-fg"}`}>
        {v}
      </p>
      <p className="text-[10px] tracking-[0.12em] text-faint uppercase">{d}</p>
    </div>
  );
}

function HubCard({
  live,
  badge,
  count,
  title,
  body,
  cta,
  to,
  search,
  accentCta,
}: {
  live: boolean;
  badge?: string;
  count: string;
  title: string;
  body: string;
  cta: string;
  to?: "/engine" | "/nursery" | "/pasture";
  search?: { category: "leafy-greens" | "cut-flowers" | "vegetables" };
  accentCta?: boolean;
}) {
  return (
    <article
      className={
        live
          ? "flex flex-col justify-between border border-border bg-surface p-5 transition-colors hover:border-accent/50"
          : "flex flex-col justify-between border border-border/60 bg-bg p-5"
      }
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={
              live
                ? "border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-ok uppercase"
                : "border border-border bg-elevated px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-faint uppercase"
            }
          >
            {live ? "Live now" : badge}
          </span>
          <span className={`text-[11px] font-semibold tracking-wide ${live ? "text-subtle" : "text-faint"}`}>
            {count}
          </span>
        </div>
        <h3 className={`font-display text-xl font-semibold tracking-wide uppercase ${live ? "text-fg" : "text-subtle"}`}>
          {title}
        </h3>
        <p className={`text-xs leading-relaxed ${live ? "text-muted" : "text-faint"}`}>{body}</p>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        {live && to === "/engine" ? (
          <Link
            to="/engine"
            search={search}
            className={
              accentCta
                ? "flex h-11 items-center justify-center bg-accent px-3 text-[11px] font-semibold tracking-[0.14em] text-accent-fg uppercase transition-transform duration-150 active:scale-[0.96]"
                : "flex h-11 items-center justify-center border border-border bg-elevated px-3 text-[11px] font-semibold tracking-[0.14em] text-fg uppercase transition-colors hover:border-accent"
            }
          >
            {cta}
          </Link>
        ) : live && to === "/nursery" ? (
          <Link
            to="/nursery"
            className={
              accentCta
                ? "flex h-11 items-center justify-center bg-accent px-3 text-[11px] font-semibold tracking-[0.14em] text-accent-fg uppercase transition-transform duration-150 active:scale-[0.96]"
                : "flex h-11 items-center justify-center border border-border bg-elevated px-3 text-[11px] font-semibold tracking-[0.14em] text-fg uppercase transition-colors hover:border-accent"
            }
          >
            {cta}
          </Link>
        ) : live && to === "/pasture" ? (
          <Link
            to="/pasture"
            className={
              accentCta
                ? "flex h-11 items-center justify-center bg-accent px-3 text-[11px] font-semibold tracking-[0.14em] text-accent-fg uppercase transition-transform duration-150 active:scale-[0.96]"
                : "flex h-11 items-center justify-center border border-border bg-elevated px-3 text-[11px] font-semibold tracking-[0.14em] text-fg uppercase transition-colors hover:border-accent"
            }
          >
            {cta}
          </Link>
        ) : (
          <span className="flex h-11 cursor-not-allowed items-center justify-center bg-elevated/50 px-3 text-[11px] font-semibold tracking-[0.14em] text-faint uppercase">
            {cta}
          </span>
        )}
      </div>
    </article>
  );
}

function ModuleCard({
  k,
  t,
  d,
  href,
  cta,
}: {
  k: string;
  t: string;
  d: string;
  href: "/irrigation" | "/soil" | "/economics" | "/clipboard";
  cta: string;
}) {
  return (
    <Link
      to={href}
      className="block space-y-2 border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">{k}</p>
      <h3 className="text-sm font-semibold tracking-wide text-fg uppercase">{t}</h3>
      <p className="text-[11px] leading-relaxed text-muted">{d}</p>
      <p className="pt-1 text-[10px] font-semibold tracking-[0.14em] text-ok uppercase">{cta}</p>
    </Link>
  );
}
