import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_PUBLIC_KEY!, {
  apiVersion: '2025-05-28.basil'
});