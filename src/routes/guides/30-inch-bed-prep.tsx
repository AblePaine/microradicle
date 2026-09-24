import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "30-Inch Bed Prep: Broadfork, Compost Rates, and a Stale Seedbed";
const DESCRIPTION =
  "How to prep a 30-inch market bed — broadfork depth, compost pounds per bed-foot, and a stale seedbed timeline that actually cuts weeds.";
const SLUG = "30-inch-bed-prep";

export const Route = createFileRoute("/guides/30-inch-bed-prep")({
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
          Field guide · Bed prep
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          30-Inch Bed Prep: Broadfork, Compost Rates, and a Stale Seedbed
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A 30-inch bed is 30 inches of planted soil with 12–18 inch paths. Prep is the hour you
        spend so the next twelve weeks of hoeing stay short. Skip structure work and you fight a
        crust. Dump compost without a rate and you grow weeds and soft necks.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This sequence assumes drip irrigation, hand tools, and soil you can sink a broadfork
        into. If the ground is holding standing water, wait for it to drain.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Dimensions you actually work to
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Bed width: 30 inches planted.</li>
        <li>Path: 14–18 inches. Sixteen is a comfortable default for a wheel hoe.</li>
        <li>
          Bed length: whatever fits the block. Math below uses 50-foot beds because the numbers
          stay round: 125 square feet of bed surface each.
        </li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A quarter acre of beds at this spacing is roughly 50–60 beds of 50 feet, depending on
        headlands. Prep them in batches of ten so compost does not sit and sprout.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Broadfork first, not tiller first
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        On ground that was in cover or sod last season, broadfork 8–12 inches deep. Tines every
        8–10 inches across the 30-inch face. Step, rock back, step. Do not invert the soil. You
        are opening pores, not making a furrow slice.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        One 50-foot bed takes 12–20 minutes if the soil is at field capacity — dark, forms a
        ball, breaks with a thumb. If it ribbons into clay snakes, it is too wet. If it puffs as
        dust, water the day before and wait 12 hours.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Established beds that were not compacted by harvest totes only need a fork every second
        or third rotation, or after a heavy rain plus foot traffic. Forking every crop is wasted
        back.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Compost rates that match the crop
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Finished compost, screened 1/2 inch or finer. Not raw manure. Not wood chips.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">CROP CLASS</th>
              <th className="px-4 py-2 text-left">COMPOST ON A 30 IN × 50 FT BED</th>
              <th className="px-4 py-2 text-left">PER 10 BED-FEET</th>
              <th className="px-4 py-2 text-left">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Heavy feeders (brassicas, fruiting solanums, sweet corn)</td>
              <td className="px-4 py-2 text-muted tabular">80–100 lb</td>
              <td className="px-4 py-2 text-muted tabular">16–20 lb</td>
              <td className="px-4 py-2 text-muted">About 1/4 inch if the compost is 40 lb/cu ft</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Moderate (lettuce, chard, onions, carrots)</td>
              <td className="px-4 py-2 text-muted tabular">40–60 lb</td>
              <td className="px-4 py-2 text-muted tabular">8–12 lb</td>
              <td className="px-4 py-2 text-muted">Skip if the previous crop was heavily fed and residue remains</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Light / legumes</td>
              <td className="px-4 py-2 text-muted tabular">0–30 lb</td>
              <td className="px-4 py-2 text-muted tabular">0–6 lb</td>
              <td className="px-4 py-2 text-muted">Inoculate beans and peas instead of feeding them nitrogen</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 5-gallon bucket of finished compost is 20–25 lb. A 50-foot heavy-feeder bed is four
        buckets. Spread across the 30 inches, rake 1 inch into the surface. Deeper burial of
        compost grows weeds from the seed bank you just uncovered.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If a soil test last season showed phosphorus above 80–100 ppm Bray, cut compost in half
        and use a low-P source. Compost is not a neutral mulch. It is a fertilizer with a weed
        seed tax.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The stale seedbed, on a clock
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Stale seedbed means you water, let weed seeds germinate, kill that flush, then plant into
        a quieter surface.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:font-mono marker:text-accent">
        <li>Broadfork and rake the bed smooth. Apply compost if the crop needs it.</li>
        <li>
          Irrigate to field capacity — drip until the top 2 inches are wet, usually 45–90 minutes
          on 12-inch emitter drip.
        </li>
        <li>Wait 7–10 days at soil temps above 60°F, 10–14 days if soil is 50–60°F.</li>
        <li>
          Kill the flush with a sharp 5–7 inch collinear hoe, flame weeder, or a very shallow
          rake. Do not dig. Cutting 1/4 inch below the surface is enough.
        </li>
        <li>
          Plant or transplant the same day or the next morning. Do not irrigate hard again until
          after the crop is in, or you start a second flush on top of the crop.
        </li>
      </ol>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Two stale cycles before carrots or direct-sown onions is worth the extra week. One cycle
        is enough before transplanted lettuce.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A half-day plan for ten beds
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Hour 1–2: fork ten 50-foot beds.</li>
        <li>Hour 2–3: dump and rake compost on the six beds that need it.</li>
        <li>
          Hour 3: lay or reseat two lines of drip per bed, 12 inches apart, 4–6 inches in from
          each shoulder.
        </li>
        <li>Then leave them. Come back in 8–10 days with the hoe.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not plant the afternoon you forked a wet bed. Footprints that shine are compaction you
        just put back.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Paths are part of prep
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Sixteen-inch paths packed by foot traffic become puddles. Once a season, scrape path soil
        back onto the bed shoulders and lay 2 inches of coarse chips or straw in the path. That
        keeps the 30-inch face from slumping 2 inches wider every month.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not dump compost in the path &quot;for next year.&quot; You are fertilizing weeds at
        shin height.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Mark bed numbers with a stamped metal tag on a stake, not a Sharpie on drip tape. Tape
        gets replaced. The tag stays. When you write compost pounds in a notebook next to bed 14,
        you can stop guessing whether that brassica bed was already fed in March.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Bed 30 in, path 14–18 in; a 50 ft bed is 125 sq ft.</li>
          <li>Broadfork 8–12 in deep, only when soil is at field capacity.</li>
          <li>Heavy feeders: 80–100 lb compost per 50 ft bed (four 5-gal buckets).</li>
          <li>Moderate: 40–60 lb. Light: 0–30 lb.</li>
          <li>Stale seedbed: irrigate, wait 7–14 days, shallow hoe, then plant.</li>
        </ul>
      </section>
    </main>
  );
}
