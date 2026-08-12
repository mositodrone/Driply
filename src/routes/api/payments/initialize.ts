// src/routes/api/payments/initialize.ts
//
// Initializes a Paystack transaction server-side.
// The secret key never leaves the server — the client only gets back
// an access_code which it passes to the v2 popup via resumeTransaction().
//
// Called by OrderFlowOverlay's payWithPaystackCard() before opening
// the Paystack popup.

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/payments/initialize')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
        if (!PAYSTACK_SECRET_KEY) {
          console.error('[payments/initialize] PAYSTACK_SECRET_KEY not set')
          return Response.json(
            { error: 'Payment service misconfigured' },
            { status: 500 }
          )
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { email, amount, currency, channels, metadata } = body

        if (!email || !amount) {
          return Response.json(
            { error: 'email and amount are required' },
            { status: 400 }
          )
        }

        // ── Call Paystack initialize ──────────────────────────────────────
        const paystackRes = await fetch(
          'https://api.paystack.co/transaction/initialize',
          {
            method:  'POST',
            headers: {
              Authorization:  `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              amount,
              currency:  currency ?? 'NGN',
              channels:  channels ?? ['card'],
              metadata,
            }),
          }
        )

        const data = await paystackRes.json()

        if (!data.status) {
          console.error('[payments/initialize] Paystack error:', data.message)
          return Response.json(
            { error: data.message ?? 'Failed to initialize payment' },
            { status: 502 }
          )
        }

        // Return only what the client needs — never the secret key
        return Response.json({
          access_code: data.data.access_code,
          reference:   data.data.reference,
        })
      },
    },
  },
})
