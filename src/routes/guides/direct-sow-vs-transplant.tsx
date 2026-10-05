import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Direct Sow vs Transplant Chart: What Vegetables to Transplant";
const DESCRIPTION =
  "Some crops resent a tray. Some never finish if you wait to direct sow. The method, the cell, and the nursery lead — per cultivar.";
const SLUG = "direct-sow-vs-transplant";

export const Route = createFileRoute("/guides/direct-sow-vs-transplant")({
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
          Direct Sow vs Transplant Chart: What Vegetables to Transplant
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Some crops resent a tray. Some never finish if you wait to direct sow them. The rest will
        do either, and the tray is a calendar tool, not a rule.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The split is on each cultivar sheet. Method, cell size, and nursery lead. Direct-only
        crops show no cell and a nursery lead of &quot;direct only.&quot; Transplant crops name
        the tray and the days on the bench. A third set says direct or transplant and still
        lists a cell, so you can choose.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Roots that resent the tray
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bolero Nantes is direct seed only. Germination is 12 days. Days to maturity from the
        field is 75 days. No cell. No nursery lead. French Breakfast radish is direct seed only.
        Germination is 4 days. Days to maturity from the field is 25 days. Holding is 7 days.
        Corvair spinach is direct seed only. Germination is 8 days. Days to maturity from the
        field is 40 days. Provider bean is direct seed only. Germination is 8 days. Days to
        maturity from the field is 50 days.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        These are taproots, or they move so fast that a tray costs more days than it saves.
        Disturb the carrot root and you get forks. The sheet does not offer a transplant path
        for Bolero. Do not invent one.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Crops that need the bench
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Sun Gold is a transplant. Cell is 72s. Nursery lead is 49 days. Germination is 6 days,
        inside that lead. Days to maturity from the field set is 57 days. Holding runs 70 days.
        Occupancy is 196 days. Frost class is tender. Fall photoperiod is ×1. Wait to direct sow
        a tender crop with a 196-day occupancy and the frost wins.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Redwing onion is a transplant. Cell is 128s. Nursery lead is 70 days. Germination is 8
        days. Days to maturity from the field is 110 days. The sheet fits one succession. That
        onion is a nursery crop that happens to finish in the field. Salanova Butterhead is a
        transplant too, on 128s, with a 24-day nursery lead and 55 days from field set. Head
        lettuce on this sheet is not a direct-sow crop.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The in-between
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Marketmore 76 cucumber is direct or transplant. Cell is 72s if you tray it. Nursery lead
        is 21 days. Germination is 5 days. Days to maturity from the field is 58 days. Holding
        is 42 days. Costata Romanesco summer squash is the same split. Cell is 72s. Nursery lead
        is 18 days. Germination is 7 days. Days to maturity from the field is 52 days. Holding
        is 45 days. Both are tender. Both will take a direct sow after the soil is warm. The
        tray is how you steal weeks, not how you keep them alive.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The weeks you buy
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Transplanting buys the nursery lead. That is time in cells while the field is still cold
        or still full. Salanova&apos;s lead is 24 days. Marketmore&apos;s is 21 days.
        Costata&apos;s is 18 days. Those are the 3-week gains. Sun Gold&apos;s lead is 49 days.
        Redwing&apos;s is 70 days. Long-season crops buy more because they need more. A 3-week
        claim does not cover an onion.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The field clock starts at set-out, not at sow. Sun Gold&apos;s 57 days to maturity are
        from the field. Add the 49-day bench and the seed went in more than three months before
        first ripe fruit. Count only the 57 and you will set plants out late and call the
        variety slow.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Pick the method the sheet names. If it says direct or transplant, the nursery lead is
        the extension you are buying. If it says direct only, sow it in the bed.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Taproots (carrot, radish) and sprinters: direct only, no tray path.</li>
          <li>Long-season tender crops: transplant — 49-day lead (Sun Gold), 70-day lead (Redwing).</li>
          <li>The in-betweeners (cucumber, squash): tray buys 18–21 days of season.</li>
          <li>Field clock starts at set-out; nursery lead is time the field never sees.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The vegetable planner carries the method, the cell, and the lead for each cultivar.{" "}
          <Link
            to="/engine"
            search={{ category: "vegetables" }}
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the vegetable beds →
          </Link>
        </p>
      </section>
    </main>
  );
}
