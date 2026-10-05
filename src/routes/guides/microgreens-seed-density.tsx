import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Microgreens Seed Density Chart: Grams per 1020 Tray";
const DESCRIPTION =
  "Grams of seed per 1020 tray for 31 cultivars, soak rules, and the 7–14 day cut cycle — density is the profit line.";
const SLUG = "microgreens-seed-density";

export const Route = createFileRoute("/guides/microgreens-seed-density")({
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
          Field guide · Nursery
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Microgreens Seed Density Chart: Grams per 1020 Tray
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Seed grams per 1020 tray are the number that decides profit. Too light and the flat
        looks thin at the sale. Too heavy and you paid for seed the tray cannot stand up. The
        rate is per cultivar, not per &quot;microgreen.&quot;
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The nursery is indoor 1020 flats. It is not the outdoor 30-inch bed. The rack holds 31
        cultivars. A 16-slot bay is the unit. Weigh the seed. Soak what should be soaked. Cut on
        the cycle.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Grams that change the tray cost
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        These are the sheet rates, one 1020, not a guess from a bag label.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Daikon radish is 60 grams. China Rose radish is 58 grams. Red Arrow radish is 55 grams.
        Waltham 29 broccoli is 40 grams. Red Acre cabbage is 35 grams. Astro arugula is 22 grams.
        Genovese basil is 18 grams. Dark Opal basil is 16 grams. Black chia is 24 grams. Curled
        garden cress is 20 grams.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Heavy seed is a different bill. Dwarf Grey Sugar pea is 280 grams. Speckled pea is 260
        grams. Hard red wheat is 220 grams. Black Oil sunflower is 200 grams. Dehulled Black Oil
        is 180 grams. Common buckwheat is 150 grams. Bull&apos;s Blood beet is 45 grams. Bright
        Lights chard is 42 grams. Golden flax is 40 grams, and it is dry-sow. Lacinato kale is
        30 grams. Red Russian kale is 32 grams.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 4-tray Waltham 29 batch on the board is 160 grams of seed, cut at 40 ounces, wholesale
        $50.00. A 4-tray Daikon batch is 240 grams, cut at 48 ounces, wholesale $48.00. Same
        tray count. Seed weight is not the same, and the cut is not the same. Price the flat
        from the grams, not from the crop name. Density is the profit line. Weigh it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Soak, or lose the tray
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Basil, chia, flax, and cress never go in water. Wet seed turns to gel and you lose the
        tray. Dill is dry-sow on the card too. Red Garnet amaranth is dry-sow. Genovese, Dark
        Opal, and Mrs. Burns Lemon basil are dry-sow, under a dome, no weight.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The rest get a timed soak. Astro arugula, Waltham 29 broccoli, and Red Russian kale are
        cold water, 8–12 hours, then stacked under a paver. Red Giant mustard and the radishes
        are warm water, 4 hours, stacked. Bull&apos;s Blood beet, Bright Lights chard, peas,
        sunflower, and wheatgrass go overnight, 16 hours, stacked. Santo cilantro is cold water,
        8–12 hours, under a dome, no weight.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The cycle
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Most flats cut in 7–14 days. Curled cress is 7 days. Daikon is 7 days. China Rose and
        Red Arrow are 8 days. Astro arugula and Red Giant mustard are 8 days. Waltham 29 broccoli
        and Red Garnet amaranth are 10 days. Dwarf Grey Sugar pea is 12 days. Genovese basil is
        14 days. Dark Opal basil is 16 days. Santo cilantro is 18 days. The 7–14 day band is the
        working cycle. Cilantro and onion greens sit outside it. Do not book them on a broccoli
        turn.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A queued Daikon batch sown 2026-10-04 cuts 2026-10-11. That is the 7-day cycle on the
        calendar, not a slogan. Turn the rack on that clock and a 16-slot bay refills every
        week. Book an 18-day cilantro into a 7-day slot and the bay is still full when the next
        sow shows up.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Weigh seed per tray: 16–60g light seed, 150–280g heavy seed.</li>
          <li>Mucilaginous seed (basil, chia, flax, cress) never soaks.</li>
          <li>Cut cycle: 7–14 days for most; 16–18 days for Dark Opal basil and cilantro.</li>
          <li>4-tray Waltham 29: 160g seed → 40 oz cut → $50 wholesale.</li>
          <li>One 16-slot bay turns weekly on the 7-day clock.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The nursery tool holds the gram rate, the soak, and the cycle for all 31 cultivars.{" "}
          <Link
            to="/nursery"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the nursery planner →
          </Link>
        </p>
      </section>
    </main>
  );
}
