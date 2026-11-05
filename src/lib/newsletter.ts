// Newsletter signup configuration.
//
// Signups post straight to Kit (ConvertKit) form endpoints — the same
// capture rail as DoughMatrix. Form IDs are public (they appear in
// every Kit embed code), so keeping them in the repo is fine. Leave an
// entry empty to keep showing the plain "Coming soon" line.
//
// The `umbrella` entry is the shared maker list Brad approved
// 2026-10-20: one list for the DoughMatrix / Saponis / MicroRadicle
// audience (bakers, soapmakers, small farms), fed by all three sites.

export const NEWSLETTER_FORMS: Record<string, string> = {
  umbrella: "10079829",
};

// NEWSLETTER_FORMS key for the shared maker list.
export const UMBRELLA_FORM_KEY = "umbrella";

export function newsletterActionUrl(formKey: string): string | null {
  const formId = NEWSLETTER_FORMS[formKey]?.trim();
  if (!formId) return null;
  return `https://app.kit.com/forms/${formId}/subscriptions`;
}

export function umbrellaActionUrl(): string | null {
  return newsletterActionUrl(UMBRELLA_FORM_KEY);
}
