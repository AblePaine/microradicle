import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Post Harvest Handling for a Small Farm";
const DESCRIPTION =
  "Post harvest handling for a small farm starts at field heat. Wash water, the cooler, and what has to cure first.";
const SLUG = "post-harvest-handling";

export const Route = createFileRoute("/guides/post-harvest-handling")({
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
          Post Harvest Handling for a Small Farm
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        Post harvest handling starts when the knife hits the stem. The harvest is not done at the
        tote. Field heat is still in the crop. That heat is where grade leaves, before the cooler
        ever sees the load.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Field heat is the loss
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A leaf pulled at midday is a hot leaf. It keeps respiring. Respiration is heat, and heat
        is wilt, yellowing, and a shorter hold. The pack-shed question is simple. How much heat
        walked in with this pick, and can you knock it down before the greens go soft.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Hydrocooling is the first pass. The window unit is not the first pass. A CoolBot on a
        walk-in is sized to finish a pull-down in four hours after the crop is already washed
        and wet. Four hours on a dry, hot tote is four hours of respiration you already lost.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Pick earlier if the afternoon temperature is the thing walking into the shed. Shade the
        totes between the bed and the wash. A tote in the sun is a second field.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Wash water
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Wash water should be colder than the pulp. Warm water on a cold crop drives bacteria and
        field heat in through the stem scar and the pores. Cold water on a hot crop pulls the
        heat out. That is the hydrocool. Do not wash a hot tomato, pepper, cucumber, or basil in
        a cold bath and then park it in the cold-wet box. Those crops do not belong at the
        greens set point. The pack-shed splits them on purpose.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Greens, herbs that tolerate cold, and brassicas go to the cold wet zone after the wash.
        Fruiting crops and basil go to the cool humid zone. Mixing them to save a tote costs the
        fruit, not the lettuce.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Change dirty water. Soil in the tank is a shared bath for every head you dunk after it.
        One muddy tote inoculates the rest of the pick.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Drain the totes. A washed crop sitting in its own water reheats and rots from the
        bottom. The wash only counts if the water leaves.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What cures first
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Onions and winter squash do not go into the cold box off the field. They cure. The
        pack-shed keeps a curing hold separate from the cold zones. Curing is warm air and time,
        so the necks dry and the skins set. A cold wet box on a fresh onion is rot in the neck.
        A cold wet box on a fresh squash is a soft spot you will find in December.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Cure them, then store them. Do not &ldquo;cool them down quick&rdquo; because the cooler
        has room. Room is not a reason.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Potatoes and garlic follow the same split if you are holding them. They are not a greens
        tote. If the crop needs a skin to set, it is a curing crop until that skin is set.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Where grade actually leaves
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Grade leaves in four places. In the field, if you cut past the holding window. Between
        the bed and the shed, if the tote sits in the sun. In the wash tank, if the water is warm
        or dirty. In the box, if a curing crop or a chill-sensitive crop shares a wall with the
        greens.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The cooler does not fix any of those. It holds the grade you still have. A wilted leaf
        at 34 degrees is still a wilted leaf.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          Field heat, storage zone, and whether the CoolBot can finish the pull-down are on the
          pack-shed sheet.{" "}
          <Link
            to="/economics"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the pack-shed and load this week&apos;s cuts →
          </Link>
        </p>
      </section>
    </main>
  );
}
