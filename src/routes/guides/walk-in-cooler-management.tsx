import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Walk-In Cooler Management: Temperature, Humidity, and Ethylene";
const DESCRIPTION =
  "Set points for a farm walk-in — 34°F greens, 50°F tomatoes, humidity targets, and which crops cannot share a wall.";
const SLUG = "walk-in-cooler-management";

export const Route = createFileRoute("/guides/walk-in-cooler-management")({
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
          Field guide · Postharvest
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Walk-In Cooler Management: Temperature, Humidity, and Ethylene
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A walk-in is not a kitchen fridge with a bigger door. Greens want 34°F and wet air.
        Tomatoes want 50°F and hate the cold. One compressor on one box cannot do both well. You
        either pick a primary set point and keep the misfits in a second space, or you lose
        shelf life every week.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Two climates, not one
      </h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">GROUP</th>
              <th className="px-4 py-2 text-left">TEMP</th>
              <th className="px-4 py-2 text-left">RELATIVE HUMIDITY</th>
              <th className="px-4 py-2 text-left">EXAMPLES</th>
              <th className="px-4 py-2 text-left">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Cold / wet</td>
              <td className="px-4 py-2 text-accent tabular">32–36°F</td>
              <td className="px-4 py-2 text-muted tabular">90–98%</td>
              <td className="px-4 py-2 text-muted">Lettuce, spinach, brassica heads, carrots, beets, scallions, herbs</td>
              <td className="px-4 py-2 text-muted">Ice or a wet floor helps RH</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Cool / dry-ish</td>
              <td className="px-4 py-2 text-accent tabular">45–50°F</td>
              <td className="px-4 py-2 text-muted tabular">85–90%</td>
              <td className="px-4 py-2 text-muted">Ripe tomatoes, cucumbers, peppers, eggplant, basil</td>
              <td className="px-4 py-2 text-muted">Basil browns below ~50°F</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Warm hold</td>
              <td className="px-4 py-2 text-accent tabular">55–60°F</td>
              <td className="px-4 py-2 text-muted tabular">85–90%</td>
              <td className="px-4 py-2 text-muted">Unripe tomatoes, winter squash short-term, sweet potatoes</td>
              <td className="px-4 py-2 text-muted">Not a long-term squash cellar</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If you own one box, set it to 34–36°F and keep tomatoes, cukes, peppers, and basil out
        of it. A spare chest fridge at 50°F, or a shaded 55°F room, is cheaper than watching
        tomatoes go mealy.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Humidity that does not rot the walls
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Greens wilt from vapor pressure deficit, not from &quot;not enough water in the
        leaf&quot; after harvest. At 34°F and 70% RH they still dry out. Target 95% RH for leafy
        crops.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Ways that work in a small farm cooler:
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Wet the floor after you load, not before you walk in with cardboard.</li>
        <li>Cover totes of greens with a clean damp sheet or a plastic lid cracked 1/2 inch.</li>
        <li>A $20 humidistat-plus-ultrasonic unit beats a running hose.</li>
        <li>Do not fog so hard that water drips on electricals.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Condensation on the evaporator that never stops is a coil iced over. Defrost. A iced
        coil cools the air and strips water out of the crop.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Ethylene: who cannot share a wall
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Ethylene is a gas ripe fruit makes. Leafy crops and brassicas yellow and pit in it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Producers (keep away from greens):</strong> ripe tomatoes,
        apples you stashed, cantaloupe, bananas if they ever enter the building, ripening
        peppers in quantity.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Sensitive:</strong> lettuce, spinach, kale, broccoli,
        carrots, cucumbers.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Practical rule for a 6×8 or 8×10 farm cooler: no ripe tomatoes in the greens box.
        Period. If a case of tomatoes must go in overnight before market, seal them in a lidded
        tote at the opposite end and move them at dawn. That is a compromise, not a design.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Onions and garlic off-gas and want dry air. They do not belong in the 95% RH greens
        cooler for more than a night.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Loading and airflow
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Leave 4 inches off the back wall and 2 inches between tote stacks so the evaporator can
        pull air. A wall of sealed totes against the coil makes a warm pocket at the door and a
        freezer burn zone at the fan.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Precool. Field heat is the enemy. Greens at 80°F put into a 34°F box take hours to fall,
        and the compressor ices. Dunk or spray-wash, drain 5 minutes, then load. Target pulp
        temperature under 40°F within 60 minutes of harvest for baby mix, 90 minutes for heads.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A cheap probe in the center of a tote tells you more than the thermostat on the wall.
        Wall air can read 34°F while the middle of a stacked tote is still 52°F.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A working set of numbers for a 8×10 box
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>Thermostat: 34°F.</li>
        <li>Cut-out so it does not freeze greens solid: do not set below 32°F.</li>
        <li>
          Door-open discipline: pack the market list on a table outside; do not shop the cooler
          with the door latched open.
        </li>
        <li>
          Sanitation: empty floor, weekly bleach or peroxyacetic acid on shelves, no rotting
          crates in the corner. One rotting melon raises ethylene for the whole box.
        </li>
      </ul>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Market-morning load order
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Night before: greens already at 34°F. Morning: door open only for the pick list.
        Tomatoes stay in the 50°F box until the van is running. Ice packs on baby mix, not on
        basil. A 20-minute drive in a closed van at 90°F will undo last night&apos;s precool if
        totes sit against the metal wall. Stack off the floor on a slat.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Once a week, throw anything slimy. One bag of yellowing spinach raises humidity in a bad
        way and invites the next bag to follow. Empty space in a cooler is cheaper than a lost
        case on Saturday.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Greens: 32–36°F, 90–98% RH.</li>
          <li>Tomatoes, cukes, peppers, basil: 45–55°F, separate space.</li>
          <li>Precool leafy crops to &lt;40°F pulp in 60 minutes.</li>
          <li>No ethylene producers loose in the greens box.</li>
          <li>Leave 4 in behind totes for airflow; watch tote pulp temp, not just wall air.</li>
        </ul>
      </section>
    </main>
  );
}
