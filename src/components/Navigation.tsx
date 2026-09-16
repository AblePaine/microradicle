import { Link, useRouterState } from "@tanstack/react-router";
import { Download, Upload, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/farm-store";
import { readFarmFile } from "@/lib/storage";

const LINKS = [
  { to: "/", label: "Hub" },
  { to: "/engine", label: "Engine" },
  { to: "/nursery", label: "Nursery" },
  { to: "/pasture", label: "Pasture" },
  { to: "/crops", label: "Cultivars" },
  { to: "/clipboard", label: "Clip" },
  { to: "/irrigation", label: "Irrigation" },
  { to: "/soil", label: "Soil" },
  { to: "/economics", label: "Pack" },
] as const;

export function Navigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const farm = useFarmStore((s) => s.farm);
  const hydrate = useFarmStore((s) => s.hydrate);
  const hydrated = useFarmStore((s) => s.hydrated);
  const setUnits = useFarmStore((s) => s.setUnits);
  const exportBackup = useFarmStore((s) => s.exportBackup);
  const importFarm = useFarmStore((s) => s.importFarm);
  const resetFarm = useFarmStore((s) => s.resetFarm);
  const fileRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  function ping(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm print:hidden">
      <div className="flex h-12 items-center gap-3 px-3 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2 pr-2">
          <RadicleMark />
          <span className="font-display text-lg font-semibold tracking-[0.14em] text-fg">
            MICRORADICLE
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {LINKS.map((l) => {
            const active =
              l.to === "/"
                ? pathname === "/"
                : l.to === "/clipboard"
                  ? pathname.startsWith("/clipboard") ||
                    pathname.startsWith("/clip") ||
                    pathname.startsWith("/print/clipboard")
                  : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "px-2.5 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors duration-150",
                  active ? "text-accent" : "text-muted hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          {flash ? (
            <span className="hidden font-mono text-[10px] tracking-widest text-accent sm:inline">
              {flash}
            </span>
          ) : null}
          <div className="flex overflow-hidden rounded-sm border border-border">
            <button
              type="button"
              onClick={() => setUnits("imperial")}
              className={cn(
                "px-2 py-1 font-mono text-[10px] tracking-widest transition-colors duration-150",
                farm.units === "imperial" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              IMP
            </button>
            <button
              type="button"
              onClick={() => setUnits("metric")}
              className={cn(
                "px-2 py-1 font-mono text-[10px] tracking-widest transition-colors duration-150",
                farm.units === "metric" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              MM
            </button>
          </div>
          <button
            type="button"
            title="Export farm JSON"
            onClick={() => {
              exportBackup();
              ping("EXPORTED");
            }}
            className="hidden size-8 items-center justify-center rounded-sm text-muted transition-colors hover:text-fg sm:flex"
          >
            <Download className="size-3.5" />
          </button>
          <button
            type="button"
            title="Restore farm JSON"
            onClick={() => fileRef.current?.click()}
            className="hidden size-8 items-center justify-center rounded-sm text-muted transition-colors hover:text-fg sm:flex"
          >
            <Upload className="size-3.5" />
          </button>
          <button
            type="button"
            title="Reset demo field"
            onClick={() => {
              resetFarm();
              ping("RESET");
            }}
            className="hidden size-8 items-center justify-center rounded-sm text-muted transition-colors hover:text-fg md:flex"
          >
            <RotateCcw className="size-3.5" />
          </button>
          {hydrated ? (
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  importFarm(await readFarmFile(file));
                  ping("RESTORED");
                } catch (err) {
                  ping(err instanceof Error ? err.message : "IMPORT FAILED");
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function RadicleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-accent" aria-hidden="true">
      <circle cx="12" cy="5.5" r="2.2" fill="currentColor" />
      <path
        d="M12 7.5v5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 13c-3.2 2.2-4.2 5.4-3.4 8M12 13c3.2 2.2 4.2 5.4 3.4 8M12 14.5c-4.5 1.2-6.2 4-6.6 7M12 14.5c4.5 1.2 6.2 4 6.6 7"
        stroke="currentColor"
        strokeWidth="1.15"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
