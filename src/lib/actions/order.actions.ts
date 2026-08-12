// lib/actions/order.actions.ts
//
// All order persistence.
// createOrder is ONLY called from the server-side verify-payment route
// after Paystack confirms the transaction — never directly from the client.

import { connectToDatabase } from '../database/mongoose'
import Order from '../database/order.model'
import { markDraftOrdered } from './design.actions'
import { incrementOrderStats } from './user.actions'
import { verifyTransaction } from '../paystack'

export interface CreateOrderParams {
  clerkId:        string
  designId:       string
  paystackRef:    string
  amount:         number          // in kobo
  garment: {
    id:    string
    name:  string
    color: { label: string; hex: string; filter?: string }
    size:  string
  }
  quantities:     Record<string, number>
  sizeColorSplit: Record<string, Record<string, number>>
  totalPieces:    number
  customer: {
    firstName: string
    lastName:  string
    email:     string
    phone:     string
    address:   string
    city:      string
    state:     string
    zip:       string
    delivery:  'standard' | 'express' | 'pickup'
  }
  notes?: string
}

// ── CREATE ORDER ──────────────────────────────────────────────────────────────
// Writes the order, flips the draft status, and increments user stats
// in one logical operation. If any step fails, the error surfaces to
// the verify-payment route which returns 500 to the client.
export async function createOrder(params: CreateOrderParams) {
  try {
    await connectToDatabase()

    // Guard: paystackRef is unique — silently return existing order
    // if Paystack retries the webhook with the same reference.
    const existing = await Order.findOne({ paystackRef: params.paystackRef })
    if (existing) return JSON.parse(JSON.stringify(existing))

    const newOrder = await Order.create({
      ...params,
      currency: 'NGN',
      isPaid:   true,
      status:   'pending',
    })

    // Flip the source draft to 'ordered' so My Designs reflects it
    await markDraftOrdered(params.designId)

    // Increment user lifetime stats
    await incrementOrderStats(params.clerkId, params.amount)

    return JSON.parse(JSON.stringify(newOrder))
  } catch (error) {
    console.error('[createOrder]', error)
    throw error
  }
}

// ── CONFIRM ORDER FROM A PAYSTACK REFERENCE ───────────────────────────────────
// The one place that turns "a reference someone gave us" into a verified,
// saved Order. Called from two places:
//   1. app/routes/api/orders/confirm.ts — right after the client's Paystack
//      popup succeeds, for fast feedback. Passes `trustedClerkId` from the
//      authenticated session.
//   2. app/routes/api/webhooks/paystack.ts — Paystack's own charge.success
//      event, the reliable fallback if the client never gets to call #1
//      (closed tab, network drop, etc). No session available, so it trusts
//      clerkId from the transaction metadata instead.
//
// Whichever of the two runs first wins — createOrder()'s paystackRef
// uniqueness check makes the second call a harmless no-op.
export async function confirmPaystackOrder(
  reference: string,
  opts?: { trustedClerkId?: string }
) {
  try {
    await connectToDatabase()

    // Fast idempotency path — skip the Paystack API round-trip entirely
    // if this reference was already recorded (by the other caller).
    const existing = await Order.findOne({ paystackRef: reference })
    if (existing) return JSON.parse(JSON.stringify(existing))

    // Server-to-server verify — the only source of truth for whether this
    // transaction actually succeeded and for how much.
    const txn = await verifyTransaction(reference)

    if (txn.status !== 'success') {
      throw new Error(`Paystack transaction not successful: ${txn.status}`)
    }

    const meta = txn.metadata as Partial<CreateOrderParams> | null
    const clerkId = opts?.trustedClerkId ?? meta?.clerkId
    if (!clerkId) throw new Error('Missing clerkId — cannot attribute this order to a user')
    if (!meta?.designId) throw new Error('Transaction metadata missing designId')

    // TODO: once you have a server-side pricing table, recompute the
    // expected total from meta.quantities/sizeColorSplit + delivery cost
    // and compare it to txn.amount here, rejecting on mismatch. Right now
    // this trusts whatever amount Paystack actually charged, which is
    // safe against payment fraud (Paystack itself enforces that) but not
    // against someone tampering with the *quantities* metadata to claim
    // more pieces than were actually paid for.
    const order = await createOrder({
      clerkId,
      designId:       meta.designId,
      paystackRef:    reference,
      amount:         txn.amount, // kobo, from Paystack's verified response — never the client's number
      garment:        meta.garment        ?? { id: '', name: '', color: { label: '', hex: '' }, size: '' },
      quantities:     meta.quantities     ?? {},
      sizeColorSplit: meta.sizeColorSplit ?? {},
      totalPieces:    meta.totalPieces    ?? 0,
      customer:       meta.customer       ?? ({} as CreateOrderParams['customer']),
      notes:          meta.notes,
    })

    // Attach the masked card receipt (never the PAN/CVV) for the confirm
    // route to hand back to the client — StepConfirmed's card preview reads this.
    return {
      ...order,
      authorization: txn.authorization ? {
        last4: txn.authorization.last4,
        brand: txn.authorization.brand ?? txn.authorization.card_type,
        bank:  txn.authorization.bank,
      } : undefined,
    }
  } catch (error) {
    console.error('[confirmPaystackOrder]', error)
    throw error
  }
}

// ── GET ALL ORDERS FOR USER ───────────────────────────────────────────────────
// Returns most recent first. Used by the My Designs / order history page.
export async function getOrdersByUser(clerkId: string) {
  try {
    await connectToDatabase()

    const orders = await Order
      .find({ clerkId })
      .sort({ createdAt: -1 })

    return JSON.parse(JSON.stringify(orders))
  } catch (error) {
    console.error('[getOrdersByUser]', error)
    throw error
  }
}

// ── GET SINGLE ORDER ──────────────────────────────────────────────────────────
// Used by the order-confirmed page to pull full order details.
// Accepts either the MongoDB _id or the paystackRef.
export async function getOrderByRef(paystackRef: string) {
  try {
    await connectToDatabase()

    const order = await Order.findOne({ paystackRef })
    if (!order) throw new Error(`Order not found: ${paystackRef}`)

    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.error('[getOrderByRef]', error)
    throw error
  }
}

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
// Called from an admin route as the order moves through fulfilment.
// pending → in_production → quality_check → shipped → delivered
export async function updateOrderStatus(
  paystackRef: string,
  status: 'pending' | 'in_production' | 'quality_check' | 'shipped' | 'delivered'
) {
  try {
    await connectToDatabase()

    const updated = await Order.findOneAndUpdate(
      { paystackRef },
      { $set: { status } },
      { new: true }
    )

    if (!updated) throw new Error(`Order not found: ${paystackRef}`)
    return JSON.parse(JSON.stringify(updated))
  } catch (error) {
    console.error('[updateOrderStatus]', error)
    throw error
  }
}
