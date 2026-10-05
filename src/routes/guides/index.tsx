import { createFileRoute, Link } from "@tanstack/react-router";

const GUIDES = [
  {
    slug: "30-inch-bed-prep",
    kicker: "Bed prep",
    title: "30-Inch Bed Prep: Broadfork, Compost Rates, and a Stale Seedbed",
    description:
      "How to prep a 30-inch market bed — broadfork depth, compost pounds per bed-foot, and a stale seedbed timeline that actually cuts weeds.",
  },
  {
    slug: "succession-planting-salad-greens",
    kicker: "Succession",
    title: "Planting Salad Greens in Succession: Sowing Intervals for a Weekly Harvest",
    description:
      "Sowing intervals for lettuce, spinach, and baby mix on 30-inch beds — so you harvest weekly instead of drowning in one glut.",
  },
  {
    slug: "drip-irrigation-quarter-acre",
    kicker: "Irrigation",
    title: "Drip Irrigation Layout for a Quarter Acre: Zones, Flow, and Emitter Spacing",
    description:
      "Zone counts, gallons per hour, and emitter spacing for drip on 30-inch beds across a quarter-acre market garden.",
  },
  {
    slug: "soil-blocking-transplants",
    kicker: "Nursery",
    title: "Soil Blocking for Transplants: Mix Ratios and Block Sizes That Work",
    description:
      "A working soil-block mix by volume, block sizes by crop, and the watering rhythm that keeps 1.5-inch and 2-inch blocks from collapsing.",
  },
  {
    slug: "walk-in-cooler-management",
    kicker: "Postharvest",
    title: "Walk-In Cooler Management: Temperature, Humidity, and Ethylene",
    description:
      "Set points for a farm walk-in — 34°F greens, 50°F tomatoes, humidity targets, and which crops can't share a wall.",
  },
  {
    slug: "cover-crops-small-acreage",
    kicker: "Cover crops",
    title: "Cover Cropping on Small Acreage: Species, Timing, and No-Tractor Kill",
    description:
      "Which cover crops fit 30-inch beds, when to sow them, and how to terminate with a scythe, tarp, or crimp — no tractor required.",
  },
  {
    slug: "succession-planting-schedule",
    kicker: "Succession",
    title: "Succession Planting Schedule: Relay Intervals from Holding Windows",
    description:
      "One sowing is one harvest. Set the next sow date from days to maturity plus the holding window — the relay-interval math, worked on real cultivar sheets.",
  },
  {
    slug: "days-to-maturity-fall-harvest",
    kicker: "Planning",
    title: "Days to Maturity Chart: When to Plant for Fall Harvest",
    description:
      "A days to maturity chart is a countdown, not a start date. Pick the harvest, then count back — with fall's short days already in the math.",
  },
  {
    slug: "microgreens-seed-density",
    kicker: "Nursery",
    title: "Microgreens Seed Density Chart: Grams per 1020 Tray",
    description:
      "Grams of seed per 1020 tray for 31 cultivars, soak rules, and the 7–14 day cut cycle — density is the profit line.",
  },
  {
    slug: "pasture-rest-days",
    kicker: "Pasture",
    title: "Rotational Grazing Rest Period for Pasture Chickens",
    description:
      "Rest days are the whole game: 24 days in spring, 36 in summer for poultry — paddock sizing from dry matter, net in 164-foot rolls.",
  },
  {
    slug: "drip-irrigation-run-time",
    kicker: "Irrigation",
    title: "Drip Irrigation Run Time: Turning Gallons into Timer Hours",
    description:
      "Emitter flow times emitters per foot times hours is the gallons you applied. Read the inches and the gallons per hour off the cultivar — then divide.",
  },
  {
    slug: "direct-sow-vs-transplant",
    kicker: "Planting",
    title: "Direct Sow vs Transplant Chart: What Vegetables to Transplant",
    description:
      "Some crops resent a tray. Some never finish if you wait to direct sow. The method, the cell, and the nursery lead — per cultivar.",
  },
] as const;

export const Route = createFileRoute("/guides/")({
  component: GuidesIndex,
  head: () => ({
    meta: [
      { title: "Guides — MicroRadicle" },
      {
        name: "description",
        content:
          "Field guides with real numbers for ¼–3 acre market farms: bed prep, succession planting, drip irrigation, soil blocks, cooler management, and cover crops — written to be used at the bed.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MicroRadicle" },
      { property: "og:title", content: "Guides — MicroRadicle" },
      {
        property: "og:description",
        content:
          "Field guides with real numbers for ¼–3 acre market farms: bed prep, succession planting, drip irrigation, soil blocks, cooler management, and cover crops — written to be used at the bed.",
      },
      { property: "og:url", content: "https://microradicle.com/guides" },
      { property: "og:image", content: "https://microradicle.com/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Guides — MicroRadicle" },
      {
        name: "twitter:description",
        content:
          "Field guides with real numbers for ¼–3 acre market farms: bed prep, succession planting, drip irrigation, soil blocks, cooler management, and cover crops — written to be used at the bed.",
      },
      { name: "twitter:image", content: "https://microradicle.com/og.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://microradicle.com/guides" }],
  }),
});

function GuidesIndex() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Field guides
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide uppercase sm:text-5xl">
          Guides
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Field guides with real numbers for ¼–3 acre market farms. Every rate, interval, and set
          point below is written to be used at the bed, not admired from the porch.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            to={`/guides/${g.slug}`}
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/60"
          >
            <p className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
              {g.kicker}
            </p>
            <h2 className="font-display mt-1.5 text-lg leading-snug font-semibold tracking-wide uppercase group-hover:text-accent">
              {g.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{g.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
