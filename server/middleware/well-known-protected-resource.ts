/**
 * Answer 404 for the OAuth protected-resource metadata path.
 *
 * This company is issuerless (poppy.json lists no auth), so per PAP §3.2 the
 * protected-resource metadata document at /.well-known/oauth-protected-resource
 * must not exist — agents read a 404 there as "no sign-in server". Without
 * this middleware the path falls through to the TanStack Start handler, which
 * answers non-HTML requests with 406 "Only HTML requests are supported here";
 * the PAP validator reads that as a discovery failure instead of an absent
 * document. Scoped to exactly this path — every other request passes through.
 */

interface WellKnownEvent {
  url: URL;
}

export default async function wellKnownProtectedResourceMiddleware(
  event: WellKnownEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  if (event.url.pathname === "/.well-known/oauth-protected-resource") {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }
  return next();
}
