import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Drip Irrigation Layout for a Quarter Acre: Zones, Flow, and Emitter Spacing";
const DESCRIPTION =
  "Zone counts, gallons per hour, and emitter spacing for drip on 30-inch beds across a quarter-acre market garden.";
const SLUG = "drip-irrigation-quarter-acre";

export const Route = createFileRoute("/guides/drip-irrigation-quarter-acre")({
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
          Field guide · Irrigation
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Drip Irrigation Layout for a Quarter Acre: Zones, Flow, and Emitter Spacing
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A quarter acre of 30-inch beds drinks a predictable amount of water if the drip is laid
        on purpose. Guessing with a hose wastes pressure, floods the first 20 feet, and leaves
        the far tail dry.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This layout assumes municipal or pumped water at 20–40 PSI after a filter and a pressure
        regulator, 30-inch beds, two drip lines per bed.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        How much garden you're actually watering
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A quarter acre is 10,890 square feet. With 30-inch beds and 16-inch paths, about 60–65%
        of that is bed surface — call it 6,500–7,000 square feet of planted soil, or roughly
        fifty-five 50-foot beds after headlands.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Two lines of drip per bed, 50 feet long: 100 feet of tape per bed. Fifty-five beds:
        5,500 feet of tape.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Tape and emitters
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Use 8 mil or 15 mil drip tape, 12-inch emitter spacing, 0.34 or 0.45 GPH emitters.
        Twelve-inch spacing is the default for salad, carrots, and onions on 30-inch beds.
        Switch to 8-inch spacing only for dense baby mix on very sandy ground.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Two lines on a 30-inch bed sit 8–10 inches apart, each 5–6 inches in from the shoulder.
        That wets the whole face without dumping into the path.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">TAPE SPEC</th>
              <th className="px-4 py-2 text-right">EMITTERS PER 50 FT LINE</th>
              <th className="px-4 py-2 text-right">GPH PER LINE</th>
              <th className="px-4 py-2 text-right">GPH PER BED (2 LINES)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">12 in spacing, 0.34 GPH</td>
              <td className="px-4 py-2 text-right text-muted tabular">50</td>
              <td className="px-4 py-2 text-right text-muted tabular">17</td>
              <td className="px-4 py-2 text-right text-accent tabular">34</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">12 in spacing, 0.45 GPH</td>
              <td className="px-4 py-2 text-right text-muted tabular">50</td>
              <td className="px-4 py-2 text-right text-muted tabular">22.5</td>
              <td className="px-4 py-2 text-right text-accent tabular">45</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">8 in spacing, 0.25 GPH</td>
              <td className="px-4 py-2 text-right text-muted tabular">75</td>
              <td className="px-4 py-2 text-right text-muted tabular">18.8</td>
              <td className="px-4 py-2 text-right text-accent tabular">37.6</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Zones so the pump doesn't starve
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Most 3/4-inch headers and 1-inch mainlines want zones of 8–12 GPM (480–720 GPH) to stay
        in a comfortable pressure band.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        At 34 GPH per bed, 8 GPM (480 GPH) waters 14 beds. At 45 GPH per bed, the same zone
        waters 10 beds.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 55-bed field is four to six zones. Group by crop water need, not just by geography:
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Zone A: lettuce and brassicas, frequent short sets.</li>
        <li>Zone B: fruiting crops, deeper less often.</li>
        <li>Zone C: alliums and roots.</li>
        <li>Zone D: house tunnels or any bed on a different clock.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not put a 200-foot run of tape on one line. Keep individual tape runs at 50–150 feet
        depending on the manufacturer&apos;s chart. Long runs starve the far emitters.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Header hardware
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Filter: 155–200 mesh disk or screen, before the regulator.</li>
        <li>Regulator: 10–15 PSI at the tape. Tape is not hose; 40 PSI blows it up.</li>
        <li>Mainline: 1 inch poly for the backbone. 3/4 inch laterals to each zone valve.</li>
        <li>Zone valves: 3/4 inch electric or manual. One valve per zone.</li>
        <li>
          Flush ends: open the tape tails monthly and run 30 seconds until the water runs clear.
        </li>
      </ul>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        How long to run it
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Vegetables want roughly 1–1.5 inches of water a week in mild weather, 1.5–2 inches in hot
        wind. One inch over 125 square feet (a 30×50 bed) is 78 gallons.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        At 34 GPH per bed, 78 gallons takes 2.3 hours. Split that into three 45-minute sets
        (Monday, Wednesday, Friday) rather than one 2-hour soak that crusts and runs off.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">Sandy soil: shorter, more often — 25–30 minutes daily in July.</p>
      <p className="mt-3 text-sm leading-relaxed text-fg">Loam: 40–50 minutes every other day.</p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Clay: 50–60 minutes, twice a week, and never when the surface glistens.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Check with a trowel. The top 6 inches should be moist, not shiny, the morning after a
        set.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A starter bill of materials for 55 beds
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>5,500 ft of 12-inch, 0.34 GPH tape (buy 6,000).</li>
        <li>1 inch mainline, length of the block plus 20%.</li>
        <li>Four to six 3/4-inch valves.</li>
        <li>One 1-inch filter + one 12 PSI regulator.</li>
        <li>110 tape-to-header fittings, 110 end closures.</li>
      </ul>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Pressure and the first-bed / last-bed test
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        After a new zone is live, run it 10 minutes and dig at the first emitter and the last
        emitter on the farthest tape. Both should show a wet bulb 6 inches across in loam. If the
        tail is dry, the zone is too big, the tape is too long, or the filter is packed. Clean
        the filter first. It is the usual culprit by week six.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Map zones on paper the first season: valve, bed numbers, crop class, run minutes. Hang
        it in the shed. Next July you will not remember that Zone B is 12 beds of 0.45 GPH tape
        and needs 10 fewer minutes than Zone A.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Two lines per 30-inch bed; 12-inch, 0.34 GPH emitters → 34 GPH per 50 ft bed.</li>
          <li>Zones of 10–14 beds, 8–12 GPM each.</li>
          <li>Regulator 10–15 PSI at the tape.</li>
          <li>1 inch of water on a 50 ft bed = 78 gallons ≈ 2.3 hours at 34 GPH, split across the week.</li>
          <li>Tape runs 50–150 ft; flush tails monthly.</li>
        </ul>
      </section>
    </main>
  );
}
