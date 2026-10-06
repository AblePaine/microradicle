import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TITLE = "Cut Flower Succession Planting: Count Back from the Bouquet";
const DESCRIPTION =
  "Cut flower succession planting counted back from the bouquet date. Sunflowers, zinnias, and celosia relay. Single-cut crops do not.";
const SLUG = "cut-flower-succession-planting";

export const Route = createFileRoute("/guides/cut-flower-succession-planting")({
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
          Field guide · Succession
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          Cut Flower Succession Planting: Count Back from the Bouquet
        </h1>
      </header>

      <p className="text-sm leading-relaxed text-muted">
        A cut flower succession planting is the same relay as a vegetable bed, with a tighter
        sell window. The stem is in the bucket that week, or it is compost. You pick the market
        date. The sheet counts back to sow and transplant.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        The window is the product
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        A vegetable can sit in the field for a holding window. A cut stem cannot. Once a
        sunflower disk opens past the cut stage, that plant is finished. Zinnia petals bruise in
        one hot afternoon. Celosia crests size up, then turn woody. The harvest window is days.
        Miss the sow and you miss the Saturday bunch. There is no second pass on that plant that
        saves the week.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Fifty cut-flower cultivars sit on the same planner as the market vegetables. Beds are 30
        inches. The calendar still starts at the harvest you already promised a buyer.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What successions
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Sunflowers succession. A single-stem plant gives one cut. The next bouquet is the next
        sowing, not a side shoot. A weekly market wants a weekly sunflower block. Set the
        interval to the market, then count back.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Zinnias succession. They branch after a pinch, and they will keep throwing stems. Stem
        length and flower size still fall off as the crown ages. A fresh block is how you keep
        focal stems in the bunch. The first sowing is not the season.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Celosia succession. Crest and plume both size with the plant. An old block gives
        fillers. A new block gives the stems the bouquet is built on. Relay it the same way you
        relay the zinnia.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Those three cover most of a mixed bunch: focal, filler, and spike. The cultivar sheet
        holds pinch timing, netting height, cut stage, and vase life. Read those before you lock
        the interval. A crop that wants a pinch needs that nursery lead in the countdown. A crop
        that wants netting needs the net on before the stems lodge.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        What does not
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Single-cut crops do not succession. One planting, one harvest, the bed is done. You do
        not sow them every week to fill a bucket. You sow them once, for the single date that
        planting can hit. A second sowing does not extend the first. It ties up another 30-inch
        bed for a crop that will not relay.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        If the cultivar is a single cut with no branching and no reason to resow, leave it off
        the weekly relay. Put those bed-feet on sunflowers, zinnias, and celosia. Those are the
        crops that can actually meet a standing bouquet order.
      </p>

      <h2 className="mt-8 font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
        Count back from the bunch
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Write the market date first. That is the cut. Field days come off next. If the cultivar
        is a transplant, nursery days come off after that. Germination sits inside the nursery
        lead. Do not add it twice. Fall short days stretch the field clock. The planner already
        applies that stretch. Do not stack a fudge week on top of it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        The interval between sowings is the market interval, or a little shorter, so prime stems
        overlap. Wait until the first block looks tired and the next block is still in the tray.
        That Saturday you are stripping woody stems and calling it a bunch.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        Bed-feet follow the bunches you can sell that week. A relay that outruns the order is
        stems on the compost pile. A relay that undershoots is a hole in the bouquet and a buyer
        who shops elsewhere next week.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-elevated p-4">
        <p className="text-sm leading-relaxed text-fg">
          The cut-flower beds run the same count as the vegetable beds, with pinch and netting
          on the cultivar sheet.{" "}
          <Link
            to="/engine"
            search={{ category: "cut-flowers" }}
            className="font-semibold text-accent hover:text-accent-soft"
          >
            Open the beds, set the bouquet date, and read the sow date back →
          </Link>
        </p>
      </section>
    </main>
  );
}
