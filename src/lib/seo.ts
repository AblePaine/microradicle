import type { JSX } from "react";

/**
 * Shared SEO / share-preview / structured-data builders.
 *
 * Every route head should carry its own og:title + og:description (the root
 * route's tags are only a fallback — TanStack dedupes meta by name/property,
 * leaf route wins) plus a JSON-LD block. JSON-LD goes through the head
 * `scripts` array: the React route typing models head entries as JSX
 * intrinsic props, and a script entry is what renders as
 * `<script type="application/ld+json">` in the SSR head.
 * Keep descriptions factual: they are copied from each page's own copy.
 */

export const SITE_URL = "https://www.microradicle.com";
export const SITE_NAME = "MicroRadicle";
export const OG_IMAGE = `${SITE_URL}/og.jpg`;

export const SITE_DESCRIPTION =
  "Stop guessing your beds, water, fertilizer, and cooler. Real numbers for ¼–3 acre market farms — for growers who would rather farm than calculate. Saved on this machine, no account.";

type HeadMeta = JSX.IntrinsicElements["meta"];
type HeadScript = JSX.IntrinsicElements["script"];
type HeadLink = JSX.IntrinsicElements["link"];

type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[];
export interface JsonLdObject {
  [key: string]: JsonLdValue | undefined;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** og:/twitter: share-preview tags for one page. `title` should match the page <title>. */
export function ogMeta(opts: {
  title: string;
  description: string;
  path: string;
  type?: string;
}): HeadMeta[] {
  const url = absoluteUrl(opts.path);
  return [
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: OG_IMAGE },
  ];
}

export function canonicalLink(path: string): HeadLink {
  return { rel: "canonical", href: absoluteUrl(path) };
}

/** Wrap a schema.org object as a head script entry (renders as application/ld+json). */
export function jsonLdScript(data: JsonLdObject): HeadScript {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
  };
}

/** A free, browser-based calculator/tool module. */
export function webApplicationJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    url: absoluteUrl(opts.path),
    description: opts.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
}): JsonLdObject {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url,
    mainEntityOfPage: url,
    image: OG_IMAGE,
    author: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
    publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function webPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    url: absoluteUrl(opts.path),
    description: opts.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    url: absoluteUrl(opts.path),
    description: opts.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
