import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Vegetable Spacing Chart for 30-Inch Beds";
const DESCRIPTION =
  "Vegetable spacing chart for 30-inch beds. In-row spacing times row count is a yield decision, not a suggestion on the seed packet.";
const SLUG = "vegetable-spacing-chart";

export const Route = createFileRoute("/guides/vegetable-spacing-chart")({
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
          Field guide · Planting
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Vegetable Spacing Chart for 30-Inch Beds
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A vegetable spacing chart is a yield sheet, not a courtesy on the packet. In-row spacing
        times the number of rows on the bed is how many units you cut. Change either number and
        you change the harvest. The bed width is the part that should stop moving.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        One bed width
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The tools are built for 30-inch beds. That width is the constant. Row count is how many
        lines fit across it. In-row spacing is how far apart the plants sit on each line. Units
        per bed-foot fall out of those two numbers. You do not pick a spacing and then invent a
        bed to match it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Two hundred sixteen market-vegetable cultivars carry their own row count and in-row
        spacing. A lettuce bed is not a tomato bed. A carrot bed is not a brassica bed. The chart
        you want is the cultivar sheet, not one number for &ldquo;vegetables.&rdquo;
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What tight spacing buys
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Tighter in-row spacing puts more plants on the same bed-foot. More plants is more units,
        until the plants start sharing light and water past the point where each unit still makes
        grade. On leaf crops, a tighter line also closes the canopy sooner. Closed canopy is weed
        suppression. You hoe less because the soil does not see sun.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Between-row spacing does the same job across the bed. More rows on 30 inches is more
        units, and a faster shade on the shoulders. That is the yield decision. It is also the
        weeding decision. A bed that closes in three weeks does not get a fourth cultivation.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What tight spacing costs
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Airflow is the cost. Plants that touch hold moisture on the leaf. Moisture on the leaf is
        the start of the disease you will spray or cull. A heading crop packed past its sheet
        spacing makes small heads and more rot in the heart. A fruiting crop packed past its
        sheet spacing makes a hedge. You pick less, and you pick wetter fruit.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Tight spacing also spends water and fertility on plants that will not all make a sellable
        unit. The extra seed is not the loss. The loss is bed-feet tied up in culls. Spacing is
        how you decide which plants get to finish.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        How to read the chart
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Read it as two numbers, then a product. Rows across the 30-inch bed. In-row spacing on
        each row. Units per bed-foot is the product. Yield per bed-foot is that count times the
        unit weight or the unit count the sheet already holds.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not average across a crop family. Salanova and a full-size romaine are both lettuce.
        They are not the same row count. A cherry tomato and a beefsteak are both solanum. They
        are not the same in-row spacing. Use the cultivar line.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If you tighten past the sheet, write down what you are buying. More units, faster
        canopy, less hoe time. Then write down what you are spending. Air, disease pressure,
        grade. If you cannot name both sides, you are guessing.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Succession does not change the spacing. A second sowing of the same cultivar uses the
        same row count and the same in-row figure. What changes is the date, not the geometry.
        Do not &ldquo;give them more room&rdquo; on a late sowing to make up for a short season.
        You will cut fewer units on a bed that still closes late.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Where the numbers live
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Packet spacing assumes a row in open ground. A 30-inch bed with a set row count is a
        different geometry. The in-row figure and the row count have to be read together or the
        chart lies.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          Row count, in-row spacing, and units per bed-foot are on the cultivar line.{" "}
          <Link
            to="/engine"
            search={{ category: "vegetables" }}
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the vegetable beds and read the cultivar sheet →
          </Link>
        </p>
      </section>
    </main>
  );
}
