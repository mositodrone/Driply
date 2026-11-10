// lib/database/models/user.model.ts
//
// Based on your Safeplate user model — adapted for Driply.
// Changes:
//   - Removed: planId, redFlags, goodBites, creditBalance (Safeplate concepts)
//   - Added:   role, totalOrders, totalSpend (Driply-specific)
// The clerkId, email, username, photo, firstName, lastName fields
// are identical — the webhook handler uses them as-is.

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const UserSchema = new Schema(
	{
		clerkId: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		photo: {
			type: String,
			default: "",
		},
		firstName: { type: String, default: "" },
		lastName: { type: String, default: "" },

		// ── Driply-specific ────────────────────────────────────────────────────
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		totalOrders: { type: Number, default: 0 },
		totalSpend: { type: Number, default: 0 }, // in kobo (Paystack unit)

		// ── AI suggestion feature (Pro, credit-based) ───────────────────────────
		// Deducted by deductCredit() in credits.actions.ts on each generation
		// call, refunded automatically if the provider call fails.
		aiCredits: { type: Number, default: 0 },

		// ── Onboarding ───────────────────────────────────────────────────────
		// Read via loader on /dashboard to decide whether to auto-start the
		// tour. DB-backed (not just localStorage) so it survives across
		// devices/browsers, same reasoning as everything else account-scoped.
		hasSeenTutorial: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

const User = models?.User || model("User", UserSchema);

export default User;
