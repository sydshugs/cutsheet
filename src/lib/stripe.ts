import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
)

export const redirectToCheckout = async (userId: string, email: string) => {
  const stripe = await stripePromise
  if (!stripe) return

  await stripe.redirectToCheckout({
    lineItems: [{ price: import.meta.env.VITE_STRIPE_PRO_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/checkout/cancel`,
    customerEmail: email,
    clientReferenceId: userId,
  })
}
