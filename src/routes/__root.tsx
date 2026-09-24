import { Analytics } from "@vercel/analytics/react";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Navigation } from "@/components/Navigation";
import appCss from "../styles.css?url";

const APP_NAME = "MicroRadicle";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Stop guessing your beds, water, fertilizer, and cooler. Real numbers for ¼–3 acre market farms — for growers who would rather farm than calculate. Saved on this machine, no account.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MicroRadicle" },
      {
        property: "og:title",
        content: "MicroRadicle — Farm Tools for ¼–3 Acre Market Farms",
      },
      {
        property: "og:description",
        content:
          "Stop guessing your beds, water, fertilizer, and cooler. Real numbers for ¼–3 acre market farms — for growers who would rather farm than calculate. Saved on this machine, no account.",
      },
      { property: "og:url", content: "https://microradicle.com/" },
      { property: "og:image", content: "https://microradicle.com/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "MicroRadicle — Farm Tools for ¼–3 Acre Market Farms",
      },
      {
        name: "twitter:description",
        content:
          "Stop guessing your beds, water, fertilizer, and cooler. Real numbers for ¼–3 acre market farms — for growers who would rather farm than calculate. Saved on this machine, no account.",
      },
      { name: "twitter:image", content: "https://microradicle.com/og.jpg" },
      { name: "theme-color", content: "#09090b" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function VercelAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <Analytics route={pathname} path={pathname} />;
}

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Navigation />
          <Outlet />
        </AuthProvider>
        <VercelAnalytics />
        <Scripts />
      </body>
    </html>
  );
}
