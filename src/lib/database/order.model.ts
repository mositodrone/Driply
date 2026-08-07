// lib/database/order.model.ts
//
// One document per paid order.
// paystackRef is the single field that distinguishes a paid order
// from a draft — it only exists after Paystack verification succeeds.
// Never written directly from the client — only from the server-side
// verify-payment route after Paystack confirms the transaction.

import { Schema, model, models } from 'mongoose'

const OrderSchema = new Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────
    clerkId: {
      type:     String,
      required: true,
      index:    true,   // query all orders by user
    },
    designId: {
      type:     String,
      required: true,   // links back to the Design document
    },

    // ── Payment ────────────────────────────────────────────────────────────
    paystackRef: {
      type:     String,
      required: true,
      unique:   true,   // prevents duplicate orders on webhook retry
    },
    amount: {
      type:     Number,
      required: true,   // in kobo (Paystack unit — divide by 100 for naira)
    },
    currency: {
      type:    String,
      default: 'NGN',
    },
    isPaid: {
      type:    Boolean,
      default: true,    // only written after server-side verification
    },

    // ── Garment snapshot ───────────────────────────────────────────────────
    garment: {
      id:    { type: String },
      name:  { type: String },
      color: {
        label:  { type: String },
        hex:    { type: String },
        filter: { type: String },
      },
      size: { type: String },
    },

    // ── Order breakdown ────────────────────────────────────────────────────
    // quantities: { M: 30, L: 20, XL: 10 }
    quantities: {
      type:    Schema.Types.Mixed,
      default: {},
    },
    // sizeColorSplit: { M: { '#FF5B3A': 20, '#C8F135': 10 }, L: { ... } }
    sizeColorSplit: {
      type:    Schema.Types.Mixed,
      default: {},
    },
    totalPieces: {
      type:    Number,
      default: 0,
    },

    // ── Customer info ──────────────────────────────────────────────────────
    customer: {
      firstName: { type: String, default: '' },
      lastName:  { type: String, default: '' },
      email:     { type: String, default: '' },
      phone:     { type: String, default: '' },
      address:   { type: String, default: '' },
      city:      { type: String, default: '' },
      state:     { type: String, default: '' },
      zip:       { type: String, default: '' },
      delivery:  {
        type:    String,
        enum:    ['standard', 'express', 'pickup'],
        default: 'standard',
      },
    },

    notes: { type: String, default: '' },

    // ── Fulfilment status ──────────────────────────────────────────────────
    // Updated manually (or via an admin route) as the order progresses.
    status: {
      type:    String,
      enum:    ['pending', 'in_production', 'quality_check', 'shipped', 'delivered'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

const Order = models?.Order || model('Order', OrderSchema)

export default Order
