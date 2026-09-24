import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Soil Blocking for Transplants: Mix Ratios and Block Sizes That Work";
const DESCRIPTION =
  "A working soil-block mix by volume, block sizes by crop, and the watering rhythm that keeps 1.5-inch and 2-inch blocks from collapsing.";
const SLUG = "soil-blocking-transplants";

export const Route = createFileRoute("/guides/soil-blocking-transplants")({
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
          Soil Blocking for Transplants: Mix Ratios and Block Sizes That Work
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Soil blocks replace plastic cells with compressed mix. The roots air-prune at the face of
        the block, so they do not spiral. The system only works if the mix holds together when
        wet and breaks apart when the plant is set. Most failed blocks are a peat-heavy slop or
        a sandy mix that crumbles on the way to the bed.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A mix that stands up
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Measure by volume, not weight. A 5-gallon bucket is one unit.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Base mix (makes ~4.5–5 cu ft, enough for 800–900 of the 1.5-inch blocks):
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>2 buckets brown peat moss or coconut coir (if coir, buy low-salt, buffered)</li>
        <li>1 bucket finished screened compost</li>
        <li>1 bucket coarse perlite or horticultural vermiculite</li>
        <li>1 cup lime if the peat tests below pH 6.0 (skip or cut if compost is already alkaline)</li>
        <li>
          1/2 cup balanced organic fertilizer (roughly 4-4-4) per bucket of peat, or 2 cups total
          for this batch
        </li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Optional: 1/2 bucket screened soil from a clean bed if you want microbial life and extra
        weight. Do not exceed one part soil in four. More soil makes a brick.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Wet the mix the day before. Target a squeezed handful that holds a ball and releases a
        few drops — like a wrung sponge. Too dry and the blocker will not fill. Too wet and the
        blocks slump into each other in 48 hours.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Block sizes by crop
      </h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">BLOCK</th>
              <th className="px-4 py-2 text-left">CUBE SIZE</th>
              <th className="px-4 py-2 text-left">CROP</th>
              <th className="px-4 py-2 text-left">DAYS IN THE BLOCK</th>
              <th className="px-4 py-2 text-left">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Mini</td>
              <td className="px-4 py-2 text-muted tabular">3/4 in</td>
              <td className="px-4 py-2 text-muted">Lettuce, alliums started for potting-on</td>
              <td className="px-4 py-2 text-muted tabular">10–14</td>
              <td className="px-4 py-2 text-muted">Pot on to 1.5 in; do not set minis in the field</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">1.5 in (20-block tool)</td>
              <td className="px-4 py-2 text-muted tabular">1.5 in</td>
              <td className="px-4 py-2 text-muted">Lettuce, brassicas, herbs, onions, flowers</td>
              <td className="px-4 py-2 text-muted tabular">21–35</td>
              <td className="px-4 py-2 text-muted">Default market-garden block</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">2 in</td>
              <td className="px-4 py-2 text-muted tabular">2 in</td>
              <td className="px-4 py-2 text-muted">Cucurbits, solanums started late</td>
              <td className="px-4 py-2 text-muted tabular">18–28</td>
              <td className="px-4 py-2 text-muted">Cucumbers and squash get root-bound fast; do not linger</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">3–4 in</td>
              <td className="px-4 py-2 text-muted tabular">3–4 in</td>
              <td className="px-4 py-2 text-muted">Tomatoes, peppers, eggplant</td>
              <td className="px-4 py-2 text-muted tabular">5–7 weeks total, often potted from 1.5 in</td>
              <td className="px-4 py-2 text-muted">Bottom-water these; they dry in an afternoon</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Seed one seed per block for coated lettuce and most brassicas. Two seeds for uncoated
        onions, then snip. Cucurbits: one seed, point down, 1/2 inch deep.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 20-block 1.5-inch tool turns out 20 blocks per press. At a steady pace that is 400–500
        blocks an hour including filling the tray. Plan 40–50 blocks per sowing if you sell 40
        heads of lettuce a week, plus 10% extras.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Making the block
      </h2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:font-mono marker:text-accent">
        <li>Fill a tub with mix. The mix should glisten but not puddle.</li>
        <li>Press the blocker straight down until every chamber is packed. Twist 10 degrees, lift.</li>
        <li>Set on a solid 1020 tray, not a webbed tray. Blocks need a floor for the first week.</li>
        <li>Seed. Cover lettuce lightly; cover brassicas 1/4 inch; leave celery almost surface.</li>
      </ol>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not tamp with your fingers after the press. That smears the face and glazes it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Water and climate
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        First 48 hours: mist or bottom-water so the surface never crusts. After germination,
        bottom-water. Set the tray in 1/2 inch of water until the tops darken, then drain.
        Top-watering collapses young 1.5-inch blocks.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Greenhouse target: 65–75°F days for lettuce and brassicas, 70–80°F for solanums. Night
        10°F cooler. Humidity 50–70%. A dome for the first 2–3 days, then off.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Blocks shrink when they dry. A 1.5-inch block that looks 1.25 inches is thirsty. Water
        before it gets there or the edges tear.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Planting blocks into the bed
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Plant the whole block. Do not shake mix off. Seat it so the top of the block is 1/4–1/2
        inch below the bed surface, then pull soil to the stem. Water in with the drip for 30–45
        minutes the same day.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A block that sits proud dries out in one afternoon wind. A block buried an inch too deep
        rots the crown on lettuce.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        When blocks fail
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>
          <strong className="text-fg">Collapse in the tray:</strong> mix too wet or too much
          compost. Cut compost to 1 part in 4 and dry the batch.
        </li>
        <li>
          <strong className="text-fg">Will not come out of the tool:</strong> mix too dry, or
          peat not pre-wetted.
        </li>
        <li>
          <strong className="text-fg">Algae on the face:</strong> constant top-watering and low
          light. Bottom-water and add airflow.
        </li>
        <li>
          <strong className="text-fg">Spindly stems:</strong> 16–18 hours of light too far away.
          Keep fluorescents or LEDs 2–4 inches off the canopy.
        </li>
      </ul>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Potting on without wrecking the cube
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Tomatoes started in 1.5-inch blocks move to 3-inch blocks at 14–18 days, when roots show
        on two faces. Set the small block in a pre-pressed hole in the larger one. Do not tease
        roots. Water from the bottom. Field set 10–14 days later, after a 4-day outdoor harden:
        50% shade day one, full sun by day four, still under 40°F nights they stay inside.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Discard mix older than three weeks if it smells sour or grows fungus gnats. Make smaller
        batches. A 2-bucket batch every Sunday beats a 10-bucket pile that sits and sours by the
        greenhouse door.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Mix by volume: 2 peat or coir : 1 compost : 1 perlite.</li>
          <li>Default block: 1.5 inch, 21–35 days for lettuce and brassicas.</li>
          <li>Moisture: squeezed handful holds a ball and drips a little.</li>
          <li>Bottom-water after germination; set blocks 1/4–1/2 in below bed grade.</li>
          <li>40–50 of the 1.5-inch blocks per weekly lettuce sowing, plus 10%.</li>
        </ul>
      </section>
    </main>
  );
}
