import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Rotating Laying Hens on Pasture";
const DESCRIPTION =
  "Rotating laying hens on pasture: paddock size, rest, and what the eggs say about the grass. Slower moves than a broiler tractor.";
const SLUG = "rotating-laying-hens";

export const Route = createFileRoute("/guides/rotating-laying-hens")({
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
          Rotating Laying Hens on Pasture
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Rotating laying hens on pasture is a slower clock than a broiler tractor. The hens live
        on the grass. They scratch. They need a yard sized for the days they will stand on it,
        then a rest long enough for that yard to come back. The eggs tell you if you got the
        size wrong.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Layers are not broilers
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A broiler pull is a short stay in a floorless house. No net. The birds are gone in
        weeks. A laying flock is an egg-mobile. The move interval on the sheet is longer. Fence
        is poultry net, counted in 164-foot rolls. Shelter square footage is higher per bird
        because the hens are there to stay, not to finish.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not copy the broiler move onto the layers. A daily tractor pull undersizes an egg
        yard, or it burns labor you do not have. Do not copy the layer stay onto broilers
        either. Same pasture tool. Different breed sheet, different intake, different house.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Size the paddock from intake
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Daily dry matter is the start. Hens eat a set amount of dry matter per bird per day.
        Multiply by head. Multiply by the days you intend to leave them on that break. That
        product, on the stand you actually have, is the paddock. A rich spring flush carries
        more days than a July slump. Same flock. Smaller yard in summer, or a shorter stay. The
        sheet does that math.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Undersize the yard and the hens strip it before the planned move. You will see bare
        centers and a scratch pit at the door. Oversize it and they camp on the house side,
        manure piles there, and the far half of the net never gets grazed. The move interval and
        the paddock have to match. One without the other is a sacrifice lot with a schedule.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Rest that keeps both sides working
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Rest is how long the paddock stays empty after the hens leave. It is not the move
        interval. A two-day or three-day stay does not earn a shorter rest. The grass needs leaf
        area back before the next graze. Come back early and the hens hit regrowth that has not
        rebuilt. Intake drops. The stand thins. Next season&apos;s flush is smaller.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The rest window is on the pasture sheet, spring and summer separately. Summer is the long
        one. Stay off the paddock for that window. The hens can be productive on a new break
        while the last one grows. That is the rotation. Moving the house without an empty
        paddock behind it is just relocating the damage.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What the eggs say
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Yolk color is a forage report. Dark orange yolks mean the hens are hitting green leaf,
        not just the grain in the feeder. Pale yolks on a flock that should be on grass mean the
        break is already gone, or they are not ranging. Look at the paddock before you change the
        feed.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A drop in lay right after a move usually means the new yard is bare, hot, or short on
        cover. The hens spent the day walking, not eating. Shell quality is mostly calcium and
        the hen&apos;s age. Do not blame the grass for a thin shell. Do blame the grass for pale
        yolks and for a yard that is dirt by the second morning.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Dirty eggs climb when the hens are standing in manure. That is a late move or a yard
        that was too small. The fix is the next break, not a wash line.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The pasture tool runs the layer numbers: paddock size, net rolls, move interval, and
          the rest window from daily dry matter.{" "}
          <Link
            to="/pasture"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the pasture tool, set the laying breed and head count, and pull on the
            interval →
          </Link>
        </p>
      </section>
    </main>
  );
}
