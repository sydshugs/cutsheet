// src/lib/stripe.ts — Stripe Payment Link redirects (client-side, no backend needed)
//
// Create Payment Links in Stripe Dashboard → Products → [Pro/Team] → Payment Links
// Set success URL: https://cutsheet.xyz/checkout/success
//
// client_reference_id = userId allows the webhook to identify the user
// without email matching (more reliable than email lookup).

const PRO_LINK = import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK || '';
const TEAM_LINK = import.meta.env.VITE_STRIPE_TEAM_PAYMENT_LINK || '';

function buildCheckoutUrl(
  baseLink: string,
  userId: string,
  email: string,
  varName: string
): string {
  if (!baseLink) {
    console.error(`${varName} is not set in environment variables`);
    return '';
  }
  const url = new URL(baseLink);
  if (email) url.searchParams.set('prefilled_email', email);
  if (userId) url.searchParams.set('client_reference_id', userId);
  return url.toString();
}

export const redirectToProCheckout = (userId: string, email: string): void => {
  const url = buildCheckoutUrl(PRO_LINK, userId, email, 'VITE_STRIPE_PRO_PAYMENT_LINK');
  if (url) window.location.href = url;
};

export const redirectToTeamCheckout = (userId: string, email: string): void => {
  const url = buildCheckoutUrl(TEAM_LINK, userId, email, 'VITE_STRIPE_TEAM_PAYMENT_LINK');
  if (url) window.location.href = url;
};

/** @deprecated Use redirectToProCheckout */
export const redirectToCheckout = redirectToProCheckout;
