import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FeedRationBalancer } from "@/components/FeedRationBalancer";
import { useFarmStore } from "@/lib/farm-store";
import { DEFAULT_TARGET_ID, INGREDIENT_BY_ID, resolveFeed, TARGET_BY_ID } from "@/lib/feedMath";
import { decodeRationFromUnknown, feedShareHref, paramsFromRation } from "@/lib/shareUrl";
import { uid } from "@/lib/storage";
import type { SavedRation } from "@/types/feed";

export const Route = createFileRoute("/feed/$slug")({
  component: FeedRation,
  validateSearch: (search) => decodeRationFromUnknown(search),
  head: () => ({
    meta: [
      { title: "Feed Studio — MicroRadicle" },
      {
        name: "description",
        content:
          "Balance this ration: Pearson-square protein, a nutrient panel against the target bands, batch weigh-out, and cost per bird per day.",
      },
      { property: "og:title", content: "Feed Studio — MicroRadicle" },
      {
        property: "og:description",
        content:
          "Balance this ration: Pearson-square protein, a nutrient panel against the target bands, batch weigh-out, and cost per bird per day.",
      },
    ],
  }),
});

function FeedRation() {
  const { slug } = Route.useParams();
  const shared = Route.useSearch();
  const farm = useFarmStore((s) => s.farm);
  const hydrated = useFarmStore((s) => s.hydrated);
  const patchFeed = useFarmStore((s) => s.patchFeed);
  const navigate = useNavigate();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const shareAttempted = useRef<string | null>(null);

  useEffect(() => {
    if (!farm.feed) patchFeed({});
  }, [farm.feed, patchFeed]);

  const settings = resolveFeed(farm);
  const ration = settings.rations.find((r) => r.id === slug);
  const target = ration ? TARGET_BY_ID.get(ration.target_id) : undefined;

  // Shared ration link: this id isn't on the farm yet, but the URL carries
  // the whole ration — materialize it once (per slug) so the link opens
  // with the sender's exact blend. Params without a single usable line
  // fall through to the 404 below.
  useEffect(() => {
    if (!hydrated || ration) return;
    if (shareAttempted.current === slug) return;
    shareAttempted.current = slug;
    const lines = (shared.lines ?? []).filter((l) => INGREDIENT_BY_ID.has(l.ingredient_id) || Boolean(l.name));
    if (!lines.length) return;
    const targetId = shared.targetId && TARGET_BY_ID.has(shared.targetId) ? shared.targetId : DEFAULT_TARGET_ID;
    const sharedRation: SavedRation = {
      id: slug,
      name: shared.name || "Shared ration",
      target_id: targetId,
      lines,
      batch_lbs: shared.batchLbs ?? 100,
      flock_size: shared.flockSize ?? 25,
      intake_lb_per_day: shared.intakeLbPerDay ?? TARGET_BY_ID.get(targetId)?.default_intake_lb_per_day ?? 0.24,
      updated_at: new Date().toISOString(),
    };
    patchFeed({ rations: [...settings.rations, sharedRation] });
  }, [hydrated, ration, slug, shared, settings.rations, patchFeed]);

  async function copyShareLink() {
    if (!ration) return;
    const href = feedShareHref(ration.id, paramsFromRation(ration), window.location.origin);
    try {
      await navigator.clipboard.writeText(href);
      setShareMsg("Share URL copied — it opens with this exact ration.");
    } catch {
      setShareMsg(href);
    }
  }

  if (!ration) {
    return (
      <main className="px-6 py-24 text-center">
        <p className="font-mono text-xs tracking-widest text-subtle">{hydrated ? "404" : "LOAD"}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">
          {hydrated ? "Ration not on this farm." : "Reading farm…"}
        </h1>
        <Link to="/feed" className="mt-6 inline-block text-accent">
          Back to Feed Studio
        </Link>
      </main>
    );
  }

  function duplicate(source: SavedRation) {
    const copy: SavedRation = {
      ...source,
      id: uid("ration"),
      name: `${source.name} (copy)`,
      lines: source.lines.map((l) => ({ ...l })),
      updated_at: new Date().toISOString(),
    };
    patchFeed({ rations: [...settings.rations, copy] });
    navigate({ to: "/feed/$slug", params: { slug: copy.id } });
  }

  function remove(targetRation: SavedRation) {
    patchFeed({ rations: settings.rations.filter((r) => r.id !== targetRation.id) });
    navigate({ to: "/feed" });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/feed"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase hover:text-accent"
      >
        <ArrowLeft className="size-3.5" />
        All rations
      </Link>
      <header className="mt-3 mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Ration · {target?.label ?? ration.target_id}
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide break-words sm:text-5xl">
          {ration.name.toUpperCase()}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Set the birds, build the blend by hand or with the Pearson square, and read the panel before
          you mix. Every edit saves to this farm as you type.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void copyShareLink()}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 font-mono text-[10px] tracking-widest text-muted uppercase transition-colors hover:text-accent"
          >
            <Link2 className="size-3.5" />
            Copy share link
          </button>
          {shareMsg && (
            <p className="mt-2 font-mono text-[11px] break-all text-subtle" role="status">
              {shareMsg}
            </p>
          )}
        </div>
      </header>

      <FeedRationBalancer
        farm={farm}
        onPatchFeed={patchFeed}
        rationId={ration.id}
        onDuplicate={duplicate}
        onDelete={remove}
      />
    </main>
  );
}
