// Stripe checkout via Payment Links (no backend required)
// Create a Payment Link in Stripe Dashboard → Products → Cutsheet Pro → Payment Link
// Set success URL: https://cutsheet.xyz/checkout/success
// Set cancel URL (after-payment): configure in Stripe Dashboard

const PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK || ''

export const redirectToCheckout = (_userId: string, email: string) => {
  if (!PAYMENT_LINK) {
    console.error('VITE_STRIPE_PAYMENT_LINK not set')
    return
  }

  // Stripe Payment Links support prefilled_email as a query param
  const url = new URL(PAYMENT_LINK)
  if (email) {
    url.searchParams.set('prefilled_email', email)
  }

  window.location.href = url.toString()
}
