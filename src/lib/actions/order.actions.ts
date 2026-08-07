// lib/actions/order.actions.ts
//
// All order persistence.
// createOrder is ONLY called from the server-side verify-payment route
// after Paystack confirms the transaction — never directly from the client.

import { connectToDatabase } from '../database/mongoose'
import Order from '../database/order.model'
import { markDraftOrdered } from './design.actions'
import { incrementOrderStats } from './user.actions'

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
