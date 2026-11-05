import { useState, type FormEvent } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { umbrellaActionUrl } from "@/lib/newsletter";
import { track } from "@/lib/analytics";

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Signup section for the shared maker list, in MicroRadicle's own
// voice: guide drops and tool releases, plus first word when the
// MicroRadicle app (buy-once, offline) opens. Same Kit form mechanics
// as DoughMatrix; while the umbrella form ID is empty in
// NEWSLETTER_FORMS the section shows the plain "Coming soon" line.
export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const actionUrl = umbrellaActionUrl();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      // Kit's public form endpoint; no-cors because it doesn't send CORS
      // headers for cross-origin POSTs. The signup goes through; we just
      // can't read the response body.
      await fetch(actionUrl as string, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email_address: address }).toString(),
      });
      track("newsletter_signup", { form: "umbrella", source });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-elevated p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
        <span className="size-2 shrink-0 bg-accent" aria-hidden />
        Newsletter
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-wide text-fg uppercase">
        Field Notes
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        New guides as they drop, new tools as they ship, and first word when
        the MicroRadicle app opens — the whole farm OS as a buy-once,
        offline app. No spam, unsubscribe anytime.
      </p>
      {!actionUrl ? (
        <p className="mt-5 text-sm text-faint">Coming soon</p>
      ) : status === "done" ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-ok">
          <Check className="size-4" />
          You&apos;re on the list — welcome aboard.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5">
          <div className="flex max-w-xl gap-2">
            <label className="sr-only" htmlFor={`newsletter-umbrella-${source}`}>
              Email address
            </label>
            <input
              id={`newsletter-umbrella-${source}`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="you@example.com"
              disabled={status === "submitting"}
              className="h-10 w-full min-w-0 rounded-md border border-border bg-panel px-3 text-sm text-fg outline-none placeholder:text-faint focus:border-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent-soft disabled:opacity-60"
            >
              {status === "submitting" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Subscribe
            </button>
          </div>
          {status === "error" && (
            <p className="mt-2 text-sm text-faint">
              Hmm, that didn&apos;t go through — check the address and try
              again.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
