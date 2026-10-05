import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Succession Planting Schedule: Relay Intervals from Holding Windows";
const DESCRIPTION =
  "One sowing is one harvest. Set the next sow date from days to maturity plus the holding window — the relay-interval math, worked on real cultivar sheets.";
const SLUG = "succession-planting-schedule";

export const Route = createFileRoute("/guides/succession-planting-schedule")({
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
          Field guide · Succession
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Succession Planting Schedule: Relay Intervals from Holding Windows
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        One sowing is one harvest. Then the bed is empty and the market table is empty with it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Head lettuce does not come back. A carrot row does not refill itself. The plants you put
        in on Tuesday are the plants you cut weeks later, and when that holding window closes,
        that planting is finished. A succession planting schedule is the relay that starts the
        next crop before the current one is done.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The relay
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Days to maturity tell you when the first cut lands. The harvest window tells you how long
        that cut stays sellable. Add them and you know how long the bed is tied up. The next sow
        date is not &quot;when the bed looks empty.&quot; It is one harvest window after the last
        sow, so the new planting hits prime as the old one drops off.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Count backward from the harvest you already promised. Field days come off first. Nursery
        days come off next, if the crop is transplanted. Germination sits inside that nursery
        lead. Fall short days stretch the field clock. The interval between sowings is the
        holding window, or a little shorter, so you do not hand the buyer a gap.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Lettuce, counted
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Salanova Butterhead is a transplant. Cell tray is 128s. Nursery lead is 24 days.
        Germination is 5 days, inside that lead. Days to maturity from the field set is 55 days.
        Holding is 10 days. Occupancy is 65 days. Fall photoperiod on the sheet is ×1.15. The
        sheet fits 14 successions, every 7 days.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The season window on that sheet opens in the field on 2026-03-04. First greenhouse sow
        is 2026-02-08. First harvest is 2026-04-28. Check the subtraction. February 8 plus 24
        days is March 4. March 4 plus 55 days is April 28. That is the relay, not a guess.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        One cut. The core snaps, the leaves fall, the head is gone. Holding is 10 days. The next
        sow is 7 days after the last, not 65. Seven days is shorter than the hold, so prime heads
        overlap. Wait for the bed to clear and you miss a market.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Carrot, same rule, slower clock
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bolero Nantes is direct seed only. Germination is 12 days. Days to maturity from the
        field is 75 days. Holding is 21 days. Occupancy is 96 days. Fall photoperiod is ×1.1.
        The sheet fits 4 successions, every 21 days.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The interval matches the hold. Sow again at 21 days and the next row is sizing as the
        current row leaves its window. Sow once and that 96-day occupancy ends in a bare bed.
        Four sowings cover the season the sheet will allow. A fifth does not fit the frost
        window.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What the schedule is actually for
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The schedule is a bed booking. Salanova ties up 65 days per planting. Bolero ties up 96.
        Those days cannot hold a second crop. On a 30-inch bed the geometry is already fixed:
        Salanova is 4 rows at 6 inches, 8 plants per bed-foot. You are not guessing spacing
        while you guess dates.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Write the harvest date first. Subtract field days. Subtract nursery days. Put the next
        sow one interval later. Do that for every planting you mean to sell. One line on a
        calendar is not a season.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 50-foot Salanova block on the sheet is 400 plants at 8 per bed-foot, and the 50-foot
        sale is $644.00 wholesale or $1,104.00 direct (after the sheet&apos;s 8% cull). That
        revenue shows up once per planting. The 7-day relay is what makes it show up again next
        week. Skip two intervals and you skipped two markets, not &quot;a little lettuce.&quot;
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Relay interval = holding window (or a little shorter).</li>
          <li>Salanova Butterhead: 65-day occupancy, sow every 7 days, 14 successions.</li>
          <li>Bolero Nantes: 96-day occupancy, sow every 21 days, 4 successions.</li>
          <li>Count backward: harvest → field days → nursery days → sow date.</li>
          <li>Fall short days stretch the field clock (×1.15 Salanova, ×1.1 Bolero).</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The market-vegetable planner runs this count for each cultivar, with fall&apos;s short
          days already on the clock.{" "}
          <Link
            to="/engine"
            search={{ category: "vegetables" }}
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the beds, set the harvest, and read the sow date back →
          </Link>
        </p>
      </section>
    </main>
  );
}
