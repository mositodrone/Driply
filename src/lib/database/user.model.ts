// lib/database/models/user.model.ts
//
// Based on your Safeplate user model — adapted for Driply.
// Changes:
//   - Removed: planId, redFlags, goodBites, creditBalance (Safeplate concepts)
//   - Added:   role, totalOrders, totalSpend (Driply-specific)
// The clerkId, email, username, photo, firstName, lastName fields
// are identical — the webhook handler uses them as-is.

import { Schema, model, models } from 'mongoose'

const UserSchema = new Schema(
  {
    clerkId: {
      type:     String,
      required: true,
      unique:   true,
    },
    email: {
      type:     String,
      required: true,
      unique:   true,
    },
    username: {
      type:     String,
      required: true,
      unique:   true,
    },
    photo: {
      type:    String,
      default: '',
    },
    firstName: { type: String, default: '' },
    lastName:  { type: String, default: '' },

    // ── Driply-specific ────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    totalOrders: { type: Number, default: 0 },
    totalSpend:  { type: Number, default: 0 },  // in kobo (Paystack unit)
  },
  { timestamps: true }
)

const User = models?.User || model('User', UserSchema)

export default User
