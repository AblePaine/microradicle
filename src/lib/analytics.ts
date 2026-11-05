declare global {
  interface Window {
    umami?: {
      track: {
        (event: string, data?: Record<string, string | number>): void;
        (payload?: { url?: string; title?: string }): void;
      };
    };
  }
}

export function track(event: string, data?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(event, data);
  } catch {
    /* ignore blocked / unloaded tracker */
  }
}
