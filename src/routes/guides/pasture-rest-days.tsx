import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Rotational Grazing Rest Period for Pasture Chickens";
const DESCRIPTION =
  "Rest days are the whole game: 24 days in spring, 36 in summer for poultry — paddock sizing from dry matter, net in 164-foot rolls.";
const SLUG = "pasture-rest-days";

export const Route = createFileRoute("/guides/pasture-rest-days")({
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
          Field guide · Pasture
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Rotational Grazing Rest Period for Pasture Chickens
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Rest days are the whole game. Graze a paddock twice before it has leaf area back and
        you are mining the stand, not rotating it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The pasture tool is the grass, not the 30-inch beds. It sizes a daily tractor pull, an
        egg-mobile yard, or a polywire break from dry matter the animals eat. Net is counted in
        164-foot commercial rolls. Leave the paddock alone for the rest window. Come back early
        and the next graze hits a stand that has not grown back.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The rest window
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        On the ledger, Cornish Cross broilers rest 24 days in spring and 36 days in summer. ISA
        Brown layers use the same 24 and 36. Katahdin hair sheep on that ledger rest 18 days in
        spring and 30 days in summer. Spring rest is the short one because the stand is in
        flush. Summer rest is the long one because regrowth is slow.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The stand weights behind those windows are on the sheet. Spring flush is 2,800 pounds of
        dry matter per acre. A perennial mix is 2,000. Summer slump is 1,200. A cover crop is
        3,200. Same flock, less grass in July, longer rest. Skip the summer number and you are
        grazing the reserve, not the regrowth.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Broiler tractor
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Cornish Cross eats 0.16 pounds of dry matter per bird per day. Move is 1 day. Shelter
        is 1.5 square feet. The tractor is floorless. No net.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        An 80-head pull on the ledger is a 1-day move on 120 square feet, no rolls, rest 24/36,
        manure nitrogen 1.8 pounds for that graze. Freedom Ranger is the heavier broiler on the
        sheet, 0.22 pounds of dry matter per day, still a 1-day move, shelter 1.8 square feet,
        still no net. Red Ranger sits between them at 0.198 pounds. The move interval does not
        change the rest. You still stay off 24 days in spring and 36 in summer.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Egg-mobile
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        ISA Brown eats 0.135 pounds of dry matter per bird per day. Move is 2 days. Shelter is
        1.8 square feet. Fence is 48-inch poultry net, one 164-foot roll on the ledger example.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Forty hens, 2-day move, 470 square feet, 1 roll, rest 24/36, manure nitrogen 2.2 pounds
        for that graze. White Leghorn is lighter at 0.128 pounds and the same 2-day move. Black
        Australorp is heavier at 0.18 pounds and a 3-day move. Rest does not shrink because the
        move is longer. The paddock still needs the full window after you leave.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What the manure puts back
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        That nitrogen number is the deposit, not the credit. Year-1 plant-available nitrogen is
        half of the poultry figure. It is 40 percent for sheep and cattle. The soil balancer
        takes the credit, not the raw deposit. The 80-bird broiler pull shows 1.8 pounds of
        nitrogen, 1.3 pounds of P₂O₅, and 1 pound of K₂O on that graze. Half of 1.8 is the
        poultry credit. Do not book the full 1.8 against next year&apos;s fertilizer.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Sheep are a different paddock. Katahdin eats 5.25 pounds of dry matter per head per day.
        Twelve head on the ledger take a 3-day move, 5,881 square feet, two 164-foot rolls of
        35-inch net, rest 18/30, and 1.6 pounds of nitrogen. The poultry rest numbers do not
        transfer.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Rest too short
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A daily tractor move feels like rotation. It is only rotation if the last paddock is
        still empty on day 24 in spring and day 36 in summer. Pull the tractor back on day 12
        and the birds hit regrowth that has not rebuilt leaf area. Intake drops. The stand
        thins. Next year&apos;s flush is smaller. The rest window is the rule. The move interval
        is just how often you pull the house.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Size the paddock from dry matter, count the net in 164-foot rolls, and leave the rest
        days alone.
      </p>

      <section className="mt-8 rounded-lg border border-accent/40 bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
          Key numbers
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg marker:text-accent">
          <li>Poultry rest: 24 days spring, 36 days summer. Sheep: 18 spring, 30 summer.</li>
          <li>Stand dry matter: 2,800 spring flush / 2,000 perennial / 1,200 summer slump per acre.</li>
          <li>Year-1 nitrogen credit: 50% poultry, 40% sheep and cattle.</li>
          <li>Net comes in 164-foot rolls; tractors need none.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The pasture tool sizes the paddock, the net, and the rest from your flock.{" "}
          <Link
            to="/pasture"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the pasture planner →
          </Link>
        </p>
      </section>
    </main>
  );
}
