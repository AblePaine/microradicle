import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "How Often to Move a Chicken Tractor";
const DESCRIPTION =
  "How often to move a chicken tractor: the move is the feed. Broiler pulls versus layer stays, and what a late move does to the grass.";
const SLUG = "chicken-tractor-move-frequency";

export const Route = createFileRoute("/guides/chicken-tractor-move-frequency")({
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
          How Often to Move a Chicken Tractor
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        How often to move a chicken tractor is a feed decision, not a chore on the calendar.
        The birds eat what is under the house. When that forage is gone, the move is late.
        Manure has already piled on bare ground.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The move is the ration
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Pasture planning starts from daily dry matter. The flock eats a set amount of dry matter
        each day. That intake, on the stand you actually have, is the paddock. A short move on a
        small pull spreads that intake across fresh grass. A long stay on the same square eats
        the reserve, then the crowns.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Net, when you use it, is counted in 164-foot rolls. A floorless broiler tractor does not
        take a roll. An egg-mobile yard does. The house type changes the fence. It does not
        change the rule. Size the stay from what the birds eat, then leave.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What a late move costs
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Wait too long and the center of the paddock goes bare. The birds have scratched the same
        square until there is no leaf. Intake drops because the forage is gone. They are standing
        on dirt, not grazing.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Manure lands on that same bare spot. Nitrogen concentrates instead of spreading. The next
        rain moves it, or it burns the crowns that were trying to come back. You do not get a
        thicker stand from a late move. You get a scar and a hot spot.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bare ground also stops working as a filter. The next flock, or the next rain, hits soil
        with no cover. That is how a rotation turns into a sacrifice lot with a roof on it.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Broiler moves
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A broiler tractor is a short-stay house. The birds are on feed for a few weeks, gaining
        fast, and the pull is small. The move frequency on the sheet is short because the paddock
        is sized to one intake period, not to a long yard. Pull on that interval. Stretching it
        does not save labor. It spends the stand under the only birds you will finish this
        batch.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Shelter square footage is on the breed sheet. Do not shrink the house to force a longer
        stay. Crowding does not replace a move. It just puts more manure on less grass.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A batch also has an end. The last week of a broiler pull is the heaviest intake. If you
        lengthen the move then, you stack the most manure on the most damaged square. Keep the
        interval. The birds are finished soon. The stand is not.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Layer moves
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Layers are a different stay. They live on the pasture, they scratch harder, and the move
        interval on the sheet is longer than a broiler pull. A longer stay still has a size.
        Daily dry matter times days on the paddock is the yard. Undersize it and the hens strip
        it before the planned move. You will see the bare center before you see a drop in the
        bucket.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not copy the broiler interval onto the egg-mobile, and do not copy the layer stay
        onto the tractor. Same species. Different house, different intake, different move.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Rest is not the move
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The move is how often you pull the house. Rest is how long that paddock stays empty
        after you leave. A daily pull is not rotation if you bring the tractor back onto the
        same grass before it has leaf area. The rest window is on the pasture sheet. Stay off
        it. The move interval does not shrink the rest.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The pasture tool sizes the pull from daily dry matter: move interval, paddock size,
          and net rolls.{" "}
          <Link
            to="/pasture"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the pasture tool, set the breed and head count, and pull on the interval →
          </Link>
        </p>
      </section>
    </main>
  );
}
