import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "How to Read a Soil Test";
const DESCRIPTION =
  "How to read a soil test: pH, organic matter, NPK, and CEC. Which numbers change this season, and the misread that wastes the bag.";
const SLUG = "how-to-read-a-soil-test";

export const Route = createFileRoute("/guides/how-to-read-a-soil-test")({
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
          Field guide · Soil
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          How to Read a Soil Test
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A soil test is a short list of decisions. Most of the page is background. Two or three
        lines change what you do before this crop goes in. Read those first.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        pH first
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        pH is the gate. It is not a nutrient. It decides whether the nutrients already in the
        soil can move into the plant. Below the range the crop wants, phosphorus ties up.
        Molybdenum drops off. Above it, iron, manganese, and boron get scarce. You can add the
        bag the lab circled and still watch the crop stall.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If one number changes this season&apos;s plan, it is pH. Lime or sulfur is the
        application. Fertilizer is the second pass, after the pH can use it. Do not skip the
        lime because the nitrogen looked low. The nitrogen was never the lock.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Organic matter
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Organic matter is the slow tank. It feeds the soil life, holds water, and releases a
        little nitrogen as it breaks down. It does not move in one season the way pH does. A low
        number tells you to keep cover on the beds and to add compost as a program, not as a
        rescue. A high number does not mean you skip fertility. It means the soil can hold what
        you add.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Do not chase organic matter with a single heavy compost dump to &ldquo;fix the
        test.&rdquo; Compost also carries phosphorus. On a bed that already tests high in
        phosphorus, that dump is the opposite of a fix.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        NPK
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Nitrogen on a standard test is a snapshot. It moves with rain, with the last crop, and
        with soil temperature. Do not build the season on that one line. Build it on what this
        crop will take off the bed. The soil tool does that from the crop mix and the bed-feet,
        then credits manure already deposited.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Phosphorus and potassium are stickier. They are the lines worth reading against a target.
        High phosphorus is common on beds that have taken compost and manure for years. Adding
        more because the bag is balanced is how you load a nutrient the crop cannot use. The
        balancer caps phosphate against removal for that reason. Potassium is the one that often
        still needs a bag on a sandy bed. Read it on its own. Do not let a blended fertilizer
        drag phosphorus along for the ride.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        CEC
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        CEC is capacity. It is how many nutrient ions the soil can hold before they leach. A low
        CEC is a sandy bed. It needs smaller, more often. A high CEC is a clay or a high-organic
        bed. It holds a larger application. CEC does not tell you to add a nutrient. It tells
        you how to split the application you already decided on.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Treat CEC as background unless you are choosing between one feeding and three. It does
        not pick the bag.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The misread
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The common misread is chasing one nutrient while pH locks the rest. The lab flags
        potassium. You buy potash. The pH is still sitting where phosphorus and the minors
        cannot move. The crop looks the same. You buy another bag.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The second misread is treating every line as an order. A test is not a shopping list. pH
        changes the application this season. Organic matter and CEC change how you apply it. NPK
        changes the bag, and only after pH is handled. Phosphorus is the line you refuse to
        overfill.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The test told you the gate. The sheet tells you the replacement: what the crops took
          off, the year-one manure credit, and a bag list without the extra phosphorus.{" "}
          <Link
            to="/soil"
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the soil balancer after you have read the test →
          </Link>
        </p>
      </section>
    </main>
  );
}
