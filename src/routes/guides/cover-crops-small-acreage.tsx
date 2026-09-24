import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Cover Cropping on Small Acreage: Species, Timing, and No-Tractor Kill";
const DESCRIPTION =
  "Which cover crops fit 30-inch beds, when to sow them, and how to terminate with a scythe, tarp, or crimp — no tractor required.";
const SLUG = "cover-crops-small-acreage";

export const Route = createFileRoute("/guides/cover-crops-small-acreage")({
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
          Field guide · Cover crops
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Cover Cropping on Small Acreage: Species, Timing, and No-Tractor Kill
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        On a quarter to three acres, a cover crop is a tool for a specific bed, not a field of
        rye you need a disc to knock down. If you cannot kill it with a scythe, a tarp, or a
        mower you already own, do not sow it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Pick the species for the job and the season
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Rates below are for a 30-inch × 50-foot bed (125 sq ft). Multiply by 350 to get a rough
        per-acre figure if you ever need one.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full font-mono text-xs">
          <thead className="bg-elevated text-[10px] tracking-widest text-faint">
            <tr>
              <th className="px-4 py-2 text-left">MIX</th>
              <th className="px-4 py-2 text-left">RATE ON A 50 FT BED</th>
              <th className="px-4 py-2 text-left">SOW WHEN</th>
              <th className="px-4 py-2 text-left">READY TO KILL</th>
              <th className="px-4 py-2 text-left">WHAT IT DOES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Buckwheat</td>
              <td className="px-4 py-2 text-muted tabular">4–5 oz</td>
              <td className="px-4 py-2 text-muted">Late spring–summer, soil 60°F+</td>
              <td className="px-4 py-2 text-muted">4–6 weeks, at first flower</td>
              <td className="px-4 py-2 text-muted">Fast shade, pollinators, loosens the surface</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Oats + field peas</td>
              <td className="px-4 py-2 text-muted tabular">6 oz oats + 4 oz peas</td>
              <td className="px-4 py-2 text-muted">Spring, or fall 6+ weeks before hard frost</td>
              <td className="px-4 py-2 text-muted">Oats winterkill at ~20°F; peas vary</td>
              <td className="px-4 py-2 text-muted">Biomass and some nitrogen</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Winter rye + hairy vetch</td>
              <td className="px-4 py-2 text-muted tabular">5 oz rye + 3 oz vetch</td>
              <td className="px-4 py-2 text-muted">Fall, 4–6 weeks before first frost</td>
              <td className="px-4 py-2 text-muted">Late spring, rye at anthesis</td>
              <td className="px-4 py-2 text-muted">Winter cover, N from vetch, heavy residue</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Sorghum-sudangrass</td>
              <td className="px-4 py-2 text-muted tabular">4–5 oz</td>
              <td className="px-4 py-2 text-muted">Summer, soil 65°F+</td>
              <td className="px-4 py-2 text-muted">6–8 weeks, before it lignifies</td>
              <td className="px-4 py-2 text-muted">Heat-season biomass; roots are thick</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Crimson clover</td>
              <td className="px-4 py-2 text-muted tabular">3 oz</td>
              <td className="px-4 py-2 text-muted">Late summer–early fall</td>
              <td className="px-4 py-2 text-muted">Spring bloom</td>
              <td className="px-4 py-2 text-muted">N fixer, easier to kill than vetch</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2 text-fg">Mustard / brassica</td>
              <td className="px-4 py-2 text-muted tabular">1–1.5 oz</td>
              <td className="px-4 py-2 text-muted">Late summer</td>
              <td className="px-4 py-2 text-muted">6–8 weeks</td>
              <td className="px-4 py-2 text-muted">Bio-drill; do not let it seed</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not sow sorghum-sudangrass in a bed you must plant in 30 days. You will still be
        fighting stubs in October.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Timing against the cash crop
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The cover has to be dead and settled before the next planting.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
        <li>
          <strong className="text-fg">Spring cash crop (lettuce in April):</strong> fall-sown
          oats that winterkilled, or a bed left under a tarp from February.
        </li>
        <li>
          <strong className="text-fg">Summer cash crop (tomatoes in May):</strong> winter rye +
          vetch killed 3 weeks before transplant, residue parted down the drip line.
        </li>
        <li>
          <strong className="text-fg">Fall cash crop (spinach in September):</strong> buckwheat
          sown mid-July, killed at flower mid-August, 10–14 days of rest, then seed.
        </li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A cover that is still green the week you wanted to transplant is not a cover. It is a
        weed with a nice name.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Termination without a tractor
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Scythe or sharp brush blade.</strong> Best on buckwheat,
        mustard, and young oats. Cut at the soil line. Rake the residue into the path or leave
        it as a mulch if it is not too mat-like.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Mower / string trimmer.</strong> Fine for clover and vetch
        before they vine into a net. Rye at anthesis (pollen shedding) can be mowed and will
        usually not regrow much. Rye before anthesis will.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Tarp (occultation).</strong> 5–6 mil silage tarp or a reused
        billboard tarp. Cut or mow first if the stand is over 12 inches, then tarp 2–4 weeks in
        warm weather, 4–8 weeks in spring. This is the cleanest no-till kill on a 50-foot bed.
        Weight the edges every 4 feet or wind gets under it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Crimp.</strong> A 30-inch-wide roller-crimper exists for
        walk-behind systems. It only works on rye or a similar upright grass at full anthesis.
        Miss that window and you have lodging rye that reroots.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        <strong className="text-fg">Winterkill.</strong> Oats, spring barley, and buckwheat die
        when nights drop into the teens. Plan on it only if your winter actually does that. A
        mild January leaves you a living oat stand in March.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not rototill a 5-foot rye crop into a 30-inch bed and call it prep. You will be
        pulling ropes of residue out of the seeder for a month.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Seeding the cover on a bed
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Broadcast, then rake 1/2 inch or roll. Irrigate once if the top inch is dry. Twelve-inch
        drip already in the bed will germinate oats and clover if you run a 45-minute set.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Inoculate peas and vetch with the right rhizobium the day you sow. Old inoculant from
        last year is a coin flip.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Residue and the next crop
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Thin residue (buckwheat, mustard): rake off or leave. Direct seed 7–10 days later.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Heavy residue (rye): part two channels for the drip lines, transplant into the alleys.
        Direct-sown carrots do not belong in rye straw.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Watch nitrogen. A high-carbon rye mat can starve lettuce for two weeks. A light compost
        pass (30–40 lb per 50-foot bed) after rye kill fixes most of it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        A July–September walk-through
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        July 15: 50-foot bed comes out of spring lettuce. Broadcast 4.5 oz buckwheat, rake, drip
        45 minutes. August 20: first white flowers. Scythe, tarp 12 days. September 3: pull
        tarp, rake residue to the path, stale-seedbed hoe, sow spinach. That is 50 days of cover
        and still a fall crop. Rye in that slot would steal September.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Keep cover seed in a sealed bin, labeled with rate per 50-foot bed on the lid. A
        50-pound rye sack without a scoop note is how a bed gets sown at twice the rate and
        becomes a mat you cannot tarp down in a weekend.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>50 ft bed rates: buckwheat 4–5 oz; oats 6 oz + peas 4 oz; rye 5 oz + vetch 3 oz.</li>
          <li>Kill buckwheat at first flower (4–6 weeks). Kill rye at anthesis.</li>
          <li>Tarp 2–4 weeks after a mow in warm weather.</li>
          <li>Leave 10–21 days between kill and the next planting, longer after rye.</li>
          <li>If you cannot kill it with tools you own, do not sow it.</li>
        </ul>
      </section>
    </main>
  );
}
