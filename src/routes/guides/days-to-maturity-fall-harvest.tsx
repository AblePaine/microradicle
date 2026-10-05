import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Days to Maturity Chart: When to Plant for Fall Harvest";
const DESCRIPTION =
  "A days to maturity chart is a countdown, not a start date. Pick the harvest, then count back — with fall's short days already in the math.";
const SLUG = "days-to-maturity-fall-harvest";

export const Route = createFileRoute("/guides/days-to-maturity-fall-harvest")({
  component: Guide,
  head: () => ({
    meta: [
      { title: `${TITLE} — MicroRadicle` },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MicroRadicle" },
      { property: "og:title", content: `${TITLE} — MicroRadicle` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `https://microradicle.com/guides/${SLUG}` },
      { property: "og:image", content: "https://microradicle.com/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${TITLE} — MicroRadicle` },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: "https://microradicle.com/og.jpg" },
    ],
    links: [{ rel: "canonical", href: `https://microradicle.com/guides/${SLUG}` }],
  }),
});

function Guide() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to="/guides"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase hover:text-accent"
      >
        <ArrowLeft className="size-3.5" /> Guides
      </Link>

      <header className="mt-4 mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Field guide · Planning
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Days to Maturity Chart: When to Plant for Fall Harvest
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A days to maturity chart is a countdown, not a start date. You pick the harvest. Then you
        count backward.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Planting by the calendar is the common miss. &quot;We always sow lettuce the first week
        of March&quot; works once, in one year, for one market. It does not work for a fall CSA
        box, a Saturday market, or a buyer who wants heads on October 10. The harvest date is the
        constraint. Sow date is the remainder.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What to subtract
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Field days come off the harvest date first. That is days to maturity from the field set,
        not from the day the seed hit a tray. If the crop is transplanted, nursery lead comes off
        next. Germination is inside the nursery lead. It is not a third block you add on top.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Salanova Butterhead shows the split. Days to maturity from the field is 55 days. Nursery
        lead is 24 days. Germination is 5 days. Cell tray is 128s. Occupancy, once it is in the
        ground, is 65 days, because holding runs 10 days past first cut.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The sheet&apos;s own season lines up. First harvest 2026-04-28 minus 55 days is
        2026-03-04, the first field date. That date minus 24 days is 2026-02-08, the first
        greenhouse sow. Same cultivar. Same subtraction. Fall uses the same steps with a longer
        field clock.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Fall is not spring with a later month
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Short days slow the crop. The sheet already carries the factor. Salanova Butterhead fall
        photoperiod is ×1.15. Bolero Nantes is ×1.1. French Breakfast radish is ×1.2. Corvair
        spinach is ×1.25. Sun Gold tomato is ×1. A fall sow that copies the spring interval will
        be late by that factor. The planner applies it when you count back from the market day.
        You do not add a folk-rule week and hope.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bolero is the clean fall root example. Direct seed only. Germination is 12 days. Days to
        maturity from the field is 75 days. Holding is 21 days. Occupancy is 96 days. Four
        successions fit, every 21 days. A fall market date has to clear germination, 75 field
        days, and the ×1.1 stretch before frost ends the window. If the remainder lands after
        your last safe field date, that harvest is already lost. Sow earlier, or drop the date.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The chart is per cultivar
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A single &quot;lettuce: 55 days&quot; line is not a plan. Salanova is 55 days from field
        set, plus 24 days on the bench, plus a 10-day hold. Astro arugula on the same library is
        32 days to maturity, direct, 5 rows. Provider bean is 50 days from the field, direct,
        8-day germination, 18-day hold. Redwing onion is 110 days from the field after a 70-day
        nursery lead. Put those on one calendar without the nursery split and the onion misses by
        two months.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Holding is part of the date, not a bonus. Salanova&apos;s sellable window is 10 days.
        Bolero&apos;s is 21. French Breakfast radish holds 7 days and the sheet spaces it every 7
        days, 12 times. Miss the sow and you do not &quot;catch up&quot; inside a 7-day hold.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Use the harvest you already sold
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Write the market day. Subtract field days. Apply the fall factor if that market day sits
        in short days. Subtract nursery lead if the method is transplant. That date is the sow.
        The next market is a new countdown, not the same sowing stretched.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Harvest date minus field days minus nursery lead = sow date.</li>
          <li>Germination lives inside the nursery lead — never add it twice.</li>
          <li>Fall photoperiod stretch: ×1.15 lettuce, ×1.1 carrot, ×1.2 radish, ×1.25 spinach.</li>
          <li>Holding is part of occupancy: 65 days Salanova, 96 days Bolero.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The vegetable beds do this per cultivar, on 30-inch beds, across the 216 market
          vegetables in the library.{" "}
          <Link
            to="/engine"
            search={{ category: "vegetables" }}
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Set the harvest. Read the sow →
          </Link>
        </p>
      </section>
    </main>
  );
}
