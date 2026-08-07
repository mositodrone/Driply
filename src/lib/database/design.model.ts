// lib/database/design.model.ts
//
// Stores canvas design state per user.
// One document per draft — updated on every auto-save from the dashboard.
// status flips to 'ordered' when a successful payment is recorded.

import { Schema, model, models } from 'mongoose'

const DesignSchema = new Schema(
  {
    clerkId: {
      type:     String,
      required: true,
      index:    true,   // query all designs by user
    },
    designId: {
      type:     String,
      required: true,
      unique:   true,   // matches sessionStorage key from dashboard
    },

    // ── Garment snapshot ───────────────────────────────────────────────────
    // Stored as a snapshot so the design record stays accurate even if
    // the garment catalog changes later.
    garment: {
      id:    { type: String },
      name:  { type: String },
      color: {
        label:  { type: String },
        hex:    { type: String },
        filter: { type: String },
      },
      size:  { type: String },
    },

    // ── Canvas state ───────────────────────────────────────────────────────
    elements:   { type: Schema.Types.Mixed, default: [] }, // DriplyEl[]
    view:       {
      type: String,
      enum: ['front', 'back', 'leftArm', 'rightArm'],
      default: 'front',
    },

    // Flat PNG exported via stage.toDataURL() when order flow opens.
    // Used as the preview image in OrderFlowOverlay and order-confirmed.
    previewUrl: { type: String, default: '' },

    status: {
      type:    String,
      enum:    ['draft', 'ordered'],
      default: 'draft',
    },
  },
  { timestamps: true }
)

const Design = models?.Design || model('Design', DesignSchema)

export default Design
