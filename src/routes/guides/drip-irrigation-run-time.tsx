import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Drip Irrigation Run Time: Turning Gallons into Timer Hours";
const DESCRIPTION =
  "Emitter flow times emitters per foot times hours is the gallons you applied. Read the inches and the gallons per hour off the cultivar — then divide.";
const SLUG = "drip-irrigation-run-time";

export const Route = createFileRoute("/guides/drip-irrigation-run-time")({
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
          Drip Irrigation Run Time: Turning Gallons into Timer Hours
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        &quot;My beds need an inch&quot; is not a timer setting. Emitter flow, spacing, and hours
        are. Multiply the first two and you get gallons per hour on the bed. Divide the gallons
        in that inch by that rate and you get the run.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The drip tool sizes the zone so the last emitter still has pressure. Tape stays above 8
        psi. Keep flow under 5 feet a second. One zone at a time is the normal day. Everything
        at once is the stress test. Run time is the other half: how long that zone stays open.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The inch, in gallons
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Salanova Butterhead on a 30-inch bed wants 1 inch a week. Two drip lines. Emitters at 8
        inches. Each emitter is 0.42 gallons per hour. The sheet rates that bed at 63 gallons
        per hour per 50 feet, and 77.9 gallons per week per 50 feet for the inch.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bolero Nantes is the same tape geometry. Two lines. 8-inch emitters. 0.42 gallons per
        hour. Same 63 gallons per hour per 50 feet. Weekly water is 0.9 inch, which the sheet
        puts at 70.1 gallons per 50 feet. The tape did not change. The crop did.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Sun Gold is a different tape. One line. Emitters at 12 inches. 0.5 gallons per hour. 25
        gallons per hour per 50 feet. Weekly water is 1.5 inches, 116.9 gallons per 50 feet. Do
        not time a tomato zone with a lettuce rate.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Hours on the timer
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Emitter flow times emitters per foot times hours is the gallons you applied. Spacing
        sets the emitter count. On the Salanova bed, emitters sit every 8 inches, so each line
        has 1.5 emitters per foot. Two lines make 3 emitters per bed-foot. At 0.42 gallons per
        hour that is 1.26 gallons per hour per bed-foot, which is the sheet&apos;s 63 gallons
        per hour on 50 feet. The spacing is already in the rate. You do not add it again.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Run time is gallons needed divided by gallons per hour.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        For the Salanova inch on 50 feet, 77.9 gallons divided by 63 gallons per hour is 1.24
        hours. That is about 74 minutes. The sheet prints the gallons and the gallons per hour.
        It does not print the timer. The division is the timer.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        For the Bolero 0.9 inch on 50 feet, 70.1 divided by 63 is 1.11 hours. Same tape,
        shorter set, because the crop asked for less water.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A 4-bed lettuce zone on the drip board is 600 emitters and 4.2 gallons per minute. A
        1-bed carrot zone is 150 emitters and 1.05 gallons per minute. Open one zone. Set the
        hours from that zone&apos;s crop sheet. Do not average them.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Deep set, not a daily sip
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The target on these sheets is a weekly inch, or 0.9, or 1.5, applied as a set. It is not
        seven short runs. A daily sip wets the top and leaves the root zone short. The 77.9
        gallons is the inch. Split it into seven visits and you have watered the surface seven
        times and applied the same total only if every visit actually ran. Most timers set that
        way never reach the total. The bed looks wet at noon. The crop is short by Friday.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Header loss and velocity are the other failure. The board flags a zone that wants a
        larger header, and it holds header loss under 3 psi. A perfect run time on a zone that
        is below 8 psi at the last emitter is not an inch. It is a short bed and a dry far end.
        Size the zone first. Then set the hours from the crop&apos;s gallons.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Read the weekly inches and the gallons per hour off the cultivar. Divide. That is the
        run.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Run time = gallons needed ÷ gallons per hour. That is the whole formula.</li>
          <li>Salanova inch on 50 ft: 77.9 ÷ 63 = 1.24 hours (~74 minutes).</li>
          <li>Tape floor: 8 psi at the last emitter. Velocity ceiling: 5 ft/s. Header loss cap: 3 psi.</li>
          <li>One zone at a time; never average two crops&apos; rates.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The drip tool sizes the zone and prints the gallons per hour per cultivar.{" "}
          <Link
            to="/irrigation"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the irrigation planner →
          </Link>
        </p>
      </section>
    </main>
  );
}
