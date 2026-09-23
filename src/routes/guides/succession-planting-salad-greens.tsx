import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Succession Planting Salad Greens: Intervals for a Continuous Harvest";
const DESCRIPTION =
  "Exact sowing intervals for lettuce, spinach, and baby mix on 30-inch beds so harvest stays weekly instead of arriving in one glut.";
const SLUG = "succession-planting-salad-greens";

export const Route = createFileRoute("/guides/succession-planting-salad-greens")({
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
          Succession Planting Salad Greens: Intervals for a Continuous Harvest
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Salad greens do not wait. A full 50-foot bed of butterhead cut on one Thursday is 80
        pounds you cannot sell by Saturday. Succession planting is the clock that turns that bed
        into 15–20 pounds a week for a month.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The interval is set by days to harvest and by how fast the crop bolts in your heat, not
        by a generic &quot;sow every two weeks.&quot;
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Bed math first
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">On a 30-inch bed you can run:</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>
          Baby mix, broadcast or 6-row seeder: harvest the whole surface as cut-and-come-again.
        </li>
        <li>
          Head lettuce: 3 rows, 9–10 inches between rows, 8–10 inches in-row. About 180–210 heads
          per 50-foot bed.
        </li>
        <li>Spinach: 4 rows, 6–7 inches apart.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        One 50-foot baby-mix bed yields 25–40 lb on the first cut at 4–5 inches, then 15–25 lb on
        a second cut 10–14 days later if nights stay under 70°F. After two cuts, flip it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Intervals that match the crop
      </h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">CROP</th>
              <th className="px-4 py-2 text-left">DAYS TO FIRST CUT (COOL WEATHER, 50–65°F SOIL)</th>
              <th className="px-4 py-2 text-left">SOW OR TRANSPLANT EVERY</th>
              <th className="px-4 py-2 text-left">BEDS TO KEEP ONE CASE/WEEK</th>
              <th className="px-4 py-2 text-left">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Baby lettuce mix</td>
              <td className="px-4 py-2 text-muted tabular">28–35</td>
              <td className="px-4 py-2 text-muted tabular">7 days</td>
              <td className="px-4 py-2 text-muted tabular">4 beds in rotation</td>
              <td className="px-4 py-2 text-muted">Fastest clock; summer heat shortens quality window</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Head lettuce (transplant)</td>
              <td className="px-4 py-2 text-muted tabular">45–55 from transplant</td>
              <td className="px-4 py-2 text-muted tabular">7–10 days</td>
              <td className="px-4 py-2 text-muted tabular">5–6 beds</td>
              <td className="px-4 py-2 text-muted">Seed in 1.5 in blocks 3–4 weeks before setting</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Spinach</td>
              <td className="px-4 py-2 text-muted tabular">35–45</td>
              <td className="px-4 py-2 text-muted tabular">10 days</td>
              <td className="px-4 py-2 text-muted tabular">4 beds</td>
              <td className="px-4 py-2 text-muted">Stops germinating well above 75°F soil</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Arugula</td>
              <td className="px-4 py-2 text-muted tabular">21–28</td>
              <td className="px-4 py-2 text-muted tabular">7 days</td>
              <td className="px-4 py-2 text-muted tabular">3 beds</td>
              <td className="px-4 py-2 text-muted">Bolts fast; do not leave a third cut</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Mustard / mizuna</td>
              <td className="px-4 py-2 text-muted tabular">21–28</td>
              <td className="px-4 py-2 text-muted tabular">7 days</td>
              <td className="px-4 py-2 text-muted tabular">3 beds</td>
              <td className="px-4 py-2 text-muted">Same as arugula</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Kale for salad (baby)</td>
              <td className="px-4 py-2 text-muted tabular">30–35</td>
              <td className="px-4 py-2 text-muted tabular">10 days</td>
              <td className="px-4 py-2 text-muted tabular">3 beds</td>
              <td className="px-4 py-2 text-muted">Tougher in heat than lettuce</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        &quot;One case/week&quot; here means about 3 lbs packed as mix or 12–16 heads. Scale the
        bed count to your actual orders.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A 4-bed baby-mix rotation
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">Label the beds W1, W2, W3, W4.</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Monday week 1: sow W1.</li>
        <li>
          Monday week 2: sow W2. First cut W1 if it is at 4 inches; if not, wait 3–4 days.
        </li>
        <li>
          Monday week 3: sow W3. Cut W1 second time or flip if quality dropped. First cut W2.
        </li>
        <li>Monday week 4: sow W4. Continue.</li>
        <li>
          Monday week 5: clear W1, re-prep (stale seedbed if chickweed is moving), sow W1 again.
        </li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        In spring at 55°F soil, stretch the interval to 10 days. In late spring at 70°F days,
        tighten to 5–6 days and switch to heat-tolerant romaine and oakleaf. Butterhead in 85°F
        weather is a donation to the compost pile.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Transplant vs direct seed
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Head lettuce earns more per bed if you transplant. Seed 1.5-inch soil blocks or 128s
        every 7 days, 40–50 cells per sowing if you sell 40 heads a week. Set them at 3–4 true
        leaves, 28–35 days from seed.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Direct-sow heads only if your stale seedbed is clean. Lettuce seed sitting 10 days next
        to germinating pigweed loses.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Spinach prefers direct seed, 1/2 inch deep, 8–10 seeds per foot in each row. Soak seed 8
        hours if soil is over 70°F; even then germination is a gamble. Have a heat-standby (New
        Zealand spinach or malabar) or just stop spinach in June.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Harvest rules that keep the interval honest
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Cut baby mix at 3–5 inches, in the morning, into totes in the shade. First cut leaves a
        1-inch stub. Second cut if the stand is clean. Third cut is usually bitter.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Heads: cut at full cupping, cool to 34–36°F within 60 minutes. A head that sat in the sun
        for 20 minutes after harvest loses a day of shelf life.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If a sowing is 5 days late because rain closed the bed, do not &quot;catch up&quot; by
        sowing a double bed the same day unless you have a double market. Sow the missed amount
        and accept a thin week. Two full beds arriving together is how greens dump prices.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Heat plan for June
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        When afternoon highs hold above 85°F, stop butterhead. Keep the 7-day clock but switch
        the sowing to romaine, oakleaf, and a 20% arugula / 80% lettuce mix. Shade cloth at 30%
        over the bed from 11 a.m. to 4 p.m. cuts bitterness more than another gallon of water.
        Pull the cloth 3 days before harvest so the leaves do not stay wet overnight.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Record first-cut date next to the sow date. If baby mix is hitting 4 inches at day 24
        instead of day 30, tighten the next interval by 3 days. The bed is telling you the
        weather changed. The calendar is not the crop.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Baby mix: sow every 7 days in cool weather, 5–6 days as heat rises.</li>
          <li>Head lettuce transplants: every 7–10 days; 180–210 heads per 30 in × 50 ft bed.</li>
          <li>First cut baby mix: 28–35 days, 25–40 lb per 50 ft bed.</li>
          <li>Two cuts max, then flip.</li>
          <li>Four beds in rotation cover a weekly baby-mix case; add beds to match orders, not hope.</li>
        </ul>
      </section>
    </main>
  );
}
