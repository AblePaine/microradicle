/**
 * Render a stored results-email snapshot into a plain, honest email.
 *
 * Pure and dependency-free, so it is unit-testable and behaves the same
 * on every backend. Snapshot shapes differ per surface (DoughMatrix
 * pricing is flat, Saponis costing nests groups, the MicroRadicle
 * engine carries an array rollup), so the renderer is generic:
 * humanized labels, sections for nested objects, item blocks for
 * arrays of objects, null entries omitted (an absent optional result
 * is not a result). Numbers are shown as calculated — rounded to two
 * decimals, no invented currency or units.
 */

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const MAX_DEPTH = 4;
const TITLE_KEYS = ["crop", "product", "name", "label", "title"];

/** camelCase / snake_case key -> "Human readable" label. */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : key;
}

/** Display form for a scalar snapshot value. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The entry of an array item that names it (crop, product, ...), if any. */
function titleEntry(item: Record<string, unknown>): [string, string] | null {
  for (const key of TITLE_KEYS) {
    const v = item[key];
    if (typeof v === "string" && v) return [key, v];
  }
  return null;
}

function pushText(lines: string[], key: string | null, value: unknown, depth: number): void {
  if (value === null || value === undefined) return;
  const indent = "  ".repeat(depth);
  if (depth > MAX_DEPTH) {
    lines.push(`${indent}${key ? `${humanizeKey(key)}: ` : ""}${JSON.stringify(value)}`);
    return;
  }
  if (Array.isArray(value)) {
    if (key) lines.push(`${indent}${humanizeKey(key)}:`);
    for (const item of value) {
      if (isPlainObject(item)) {
        const title = titleEntry(item);
        lines.push(`${indent}  ${title ? title[1] : "Item"}`);
        for (const [k, v] of Object.entries(item)) {
          if (title && k === title[0]) continue;
          pushText(lines, k, v, depth + 2);
        }
      } else {
        pushText(lines, null, item, depth + 1);
      }
    }
    return;
  }
  if (isPlainObject(value)) {
    if (key) lines.push(`${indent}${humanizeKey(key)}:`);
    for (const [k, v] of Object.entries(value)) {
      pushText(lines, k, v, depth + (key ? 1 : 0));
    }
    return;
  }
  lines.push(key ? `${indent}${humanizeKey(key)}: ${formatValue(value)}` : `${indent}${formatValue(value)}`);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlBlock(key: string | null, value: unknown, depth: number): string {
  if (value === null || value === undefined) return "";
  if (depth > MAX_DEPTH) {
    return `<p>${key ? `<strong>${esc(humanizeKey(key))}:</strong> ` : ""}${esc(JSON.stringify(value))}</p>`;
  }
  if (Array.isArray(value)) {
    const parts: string[] = [];
    if (key) parts.push(`<h3 style="margin:20px 0 6px;font-size:15px;">${esc(humanizeKey(key))}</h3>`);
    for (const item of value) {
      if (isPlainObject(item)) {
        const title = titleEntry(item);
        parts.push(`<p style="margin:12px 0 4px;"><strong>${esc(title ? title[1] : "Item")}</strong></p>`);
        parts.push('<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">');
        for (const [k, v] of Object.entries(item)) {
          if (title && k === title[0]) continue;
          parts.push(htmlRow(k, v, depth + 2));
        }
        parts.push("</table>");
      } else {
        parts.push(`<p style="margin:2px 0;">${esc(formatValue(item))}</p>`);
      }
    }
    return parts.join("");
  }
  if (isPlainObject(value)) {
    const parts: string[] = [];
    if (key) parts.push(`<h3 style="margin:20px 0 6px;font-size:15px;">${esc(humanizeKey(key))}</h3>`);
    parts.push('<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">');
    for (const [k, v] of Object.entries(value)) {
      if (isPlainObject(v) || Array.isArray(v)) {
        parts.push(`</table>${htmlBlock(k, v, depth + 1)}<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">`);
      } else {
        parts.push(htmlRow(k, v, depth + 1));
      }
    }
    parts.push("</table>");
    return parts.join("");
  }
  return htmlRow(key ?? "", value, depth);
}

function htmlRow(key: string, value: unknown, depth: number): string {
  if (value === null || value === undefined) return "";
  if (isPlainObject(value) || Array.isArray(value)) return htmlBlock(key, value, depth);
  return `<tr><td style="padding:3px 16px 3px 0;color:#555;">${esc(humanizeKey(key))}</td><td style="padding:3px 0;font-weight:600;">${esc(formatValue(value))}</td></tr>`;
}

export function renderResultsEmail(input: {
  siteName: string;
  siteUrl: string;
  surface: string;
  snapshot: Record<string, unknown>;
}): RenderedEmail {
  const { siteName, siteUrl, surface, snapshot } = input;
  const surfaceLabel = humanizeKey(surface).toLowerCase();
  const subject = `Your ${siteName} ${surfaceLabel} results`;

  const lines: string[] = [];
  for (const [k, v] of Object.entries(snapshot)) pushText(lines, k, v, 0);
  const text = [
    `${siteName} — ${surfaceLabel} results`,
    "",
    "You asked us to email you these results. Here they are, exactly as calculated:",
    "",
    ...lines,
    "",
    "—",
    `${siteName} · ${siteUrl}`,
    "You received this because you requested these results on our site.",
  ].join("\n");

  const body = htmlBlock(null, snapshot, 0);
  const html = [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">',
    `<h2 style="margin:0 0 8px;font-size:20px;">${esc(siteName)} — ${esc(surfaceLabel)} results</h2>`,
    '<p style="margin:0 0 8px;color:#444;">You asked us to email you these results. Here they are, exactly as calculated:</p>',
    body,
    '<hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />',
    `<p style="color:#777;font-size:13px;">${esc(siteName)} · ${esc(siteUrl)}<br />You received this because you requested these results on our site.</p>`,
    "</div>",
  ].join("");

  return { subject, text, html };
}
