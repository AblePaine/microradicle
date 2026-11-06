import { useState, type FormEvent } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { track } from "@/lib/analytics";

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Email me these results" (capture fold-in, Brad's ruling
// 2026-11-05). The request — address + a snapshot of the results on
// screen — is stored server-side via /api/results-email; the drain
// job (send leg, live 2026-11-06) emails the results via Resend
// within a few minutes. The copy says exactly that.
export function EmailResults({
  surface,
  snapshot,
}: {
  surface: string;
  snapshot: Record<string, unknown>;
}) {
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
      const res = await fetch("/api/results-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, surface, snapshot }),
      });
      if (!res.ok) throw new Error("store failed");
      track("results_email_requested", { surface });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-elevated p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
        <span className="size-2 shrink-0 bg-accent" aria-hidden />
        Keep these numbers
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-wide text-fg uppercase">
        Email me these results
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        We&apos;ll email these results to you — they go out within a few
        minutes.
      </p>
      {status === "done" ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-ok">
          <Check className="size-4" />
          Request saved — these results are on their way to your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5">
          <div className="flex max-w-xl gap-2">
            <label className="sr-only" htmlFor={`email-results-${surface}`}>
              Email address
            </label>
            <input
              id={`email-results-${surface}`}
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
              Save request
            </button>
          </div>
          {status === "error" && (
            <p className="mt-2 text-sm text-faint">
              Hmm, that didn&apos;t save — check the address and try again.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
