// lib/paystack.ts
//
// Server-only helpers for talking to Paystack. Both functions here use
// PAYSTACK_SECRET_KEY — never import this file from client code, and never
// prefix that env var with VITE_ (that would ship it to the browser).

import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE       = 'https://api.paystack.co'

// Shape of the bits of Paystack's transaction object we actually use.
// (The real response has more fields — extend as needed.)
export interface PaystackTransactionData {
  status:      'success' | 'failed' | 'abandoned' | string
  reference:   string
  amount:      number // kobo
  currency:    string
  customer:    { email: string }
  metadata:    Record<string, any> | null
  authorization?: {
    last4:      string
    bin:        string
    exp_month:  string
    exp_year:   string
    card_type:  string // e.g. "visa DEBIT"
    bank:       string
    brand?:     string
    reusable:   boolean
  }
}

// ── Server-to-server verify ───────────────────────────────────────────────────
// Call this from any route that receives a `reference` from the client —
// never mark an order paid based on the client's word alone.
// https://api.paystack.co/transaction/verify/:reference
export async function verifyTransaction(reference: string): Promise<PaystackTransactionData> {
  if (!PAYSTACK_SECRET_KEY) throw new Error('Missing PAYSTACK_SECRET_KEY in environment variables')

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  )
  const json = await res.json()

  if (!res.ok || !json.status) {
    throw new Error(json?.message ?? `Paystack verify failed (${res.status})`)
  }
  return json.data as PaystackTransactionData
}

// ── Webhook signature verification ────────────────────────────────────────────
// Paystack signs the raw request body with your secret key (HMAC-SHA512) and
// sends it as the `x-paystack-signature` header. You MUST verify this before
// trusting webhook payloads — otherwise anyone can POST a fake `charge.success`
// event to your endpoint and get an order recorded for free.
//
// IMPORTANT: `rawBody` has to be the exact, unparsed request body string.
// If your router already parsed it into JSON, re-stringifying it will
// produce a different byte sequence (key order, whitespace) and the
// signature check will fail even for genuine requests — read the raw body
// before any JSON parsing happens.
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !PAYSTACK_SECRET_KEY) return false

  const expected = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex')

  // Timing-safe comparison — a plain `===` leaks timing information that
  // can theoretically help an attacker guess the signature byte-by-byte.
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
