// lib/actions/user.actions.ts
//
// Based directly on your Safeplate user.actions.ts.
// The createUser / updateUser / deleteUser / getUserById signatures
// are identical to what clerk.ts (the webhook) already calls —
// so the webhook works with zero changes on your end.
//
// Removed: updateCredits (Safeplate credits system)
// Added:   incrementOrderStats (called after a Paystack order confirms)

import { connectToDatabase } from '../database/mongoose'
import User from '../database/models/user.model'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CreateUserParams {
  clerkId:   string
  email:     string
  username:  string
  firstName: string
  lastName:  string
  photo:     string
}

export interface UpdateUserParams {
  firstName: string
  lastName:  string
  username:  string
  photo:     string
}

// ── CREATE ────────────────────────────────────────────────────────────────────
// Called by the Clerk webhook on user.created.
// Guards against duplicate webhook deliveries with findOne check.
export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase()

    const existing = await User.findOne({ clerkId: user.clerkId })
    if (existing) return JSON.parse(JSON.stringify(existing))

    const newUser = await User.create(user)
    return JSON.parse(JSON.stringify(newUser))
  } catch (error) {
    console.error('[createUser]', error)
    throw error
  }
}

// ── READ ──────────────────────────────────────────────────────────────────────
// Pass the Clerk userId (clerkId), not the MongoDB _id.
export async function getUserById(clerkId: string) {
  try {
    await connectToDatabase()

    const user = await User.findOne({ clerkId })
    if (!user) throw new Error(`User not found: ${clerkId}`)

    return JSON.parse(JSON.stringify(user))
  } catch (error) {
    console.error('[getUserById]', error)
    throw error
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
// Called by the Clerk webhook on user.updated.
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase()

    const updated = await User.findOneAndUpdate({ clerkId }, user, { new: true })
    if (!updated) throw new Error(`User update failed: ${clerkId}`)

    return JSON.parse(JSON.stringify(updated))
  } catch (error) {
    console.error('[updateUser]', error)
    throw error
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// Called by the Clerk webhook on user.deleted.
// Also cleans up the user's draft designs and orders in the future —
// add those deletions here once those models exist.
export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase()

    const userToDelete = await User.findOne({ clerkId })
    if (!userToDelete) throw new Error(`User not found for deletion: ${clerkId}`)

    const deleted = await User.findByIdAndDelete(userToDelete._id)
    return deleted ? JSON.parse(JSON.stringify(deleted)) : null
  } catch (error) {
    console.error('[deleteUser]', error)
    throw error
  }
}

// ── INCREMENT ORDER STATS ─────────────────────────────────────────────────────
// Called after a Paystack payment is verified and the order is saved.
// amountKobo = total in kobo (Paystack's unit — divide by 100 for naira display)
export async function incrementOrderStats(clerkId: string, amountKobo: number) {
  try {
    await connectToDatabase()

    const updated = await User.findOneAndUpdate(
      { clerkId },
      {
        $inc: {
          totalOrders: 1,
          totalSpend:  amountKobo,
        },
      },
      { new: true }
    )

    if (!updated) throw new Error(`incrementOrderStats — user not found: ${clerkId}`)
    return JSON.parse(JSON.stringify(updated))
  } catch (error) {
    console.error('[incrementOrderStats]', error)
    throw error
  }
}
