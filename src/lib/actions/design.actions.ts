// lib/actions/design.actions.ts
//
// All canvas draft persistence.
// saveDraft is called on every auto-save from the dashboard (debounced 1.2s).
// Uses upsert so the same designId never creates duplicate documents.

import { connectToDatabase } from '../database/mongoose'
import Design from '../database/design.model'

export interface SaveDraftParams {
  clerkId:    string
  designId:   string
  garment:    {
    id:    string
    name:  string
    color: { label: string; hex: string; filter?: string }
    size:  string
  }
  elements:   unknown[]
  view:       'front' | 'back' | 'leftArm' | 'rightArm'
  previewUrl?: string
}

// ── SAVE / UPDATE DRAFT ───────────────────────────────────────────────────────
// Upserts on designId — safe to call on every auto-save.
// Does NOT overwrite status if it's already 'ordered'.
export async function saveDraft(params: SaveDraftParams) {
  try {
    await connectToDatabase()

    const { designId, ...rest } = params

    const draft = await Design.findOneAndUpdate(
      { designId },
      {
        $set: {
          ...rest,
          updatedAt: new Date(),
        },
        // Only set status to 'draft' if document is new
        $setOnInsert: { status: 'draft' },
      },
      { upsert: true, new: true }
    )

    return JSON.parse(JSON.stringify(draft))
  } catch (error) {
    console.error('[saveDraft]', error)
    throw error
  }
}

// ── GET SINGLE DRAFT ──────────────────────────────────────────────────────────
export async function getDraftById(designId: string) {
  try {
    await connectToDatabase()

    const draft = await Design.findOne({ designId })
    if (!draft) return null

    return JSON.parse(JSON.stringify(draft))
  } catch (error) {
    console.error('[getDraftById]', error)
    throw error
  }
}

// ── GET ALL DRAFTS FOR USER ───────────────────────────────────────────────────
// Returns most recent first. Used by the My Designs page.
export async function getDraftsByUser(clerkId: string) {
  try {
    await connectToDatabase()

    const drafts = await Design
      .find({ clerkId })
      .sort({ updatedAt: -1 })

    return JSON.parse(JSON.stringify(drafts))
  } catch (error) {
    console.error('[getDraftsByUser]', error)
    throw error
  }
}

// ── MARK DRAFT AS ORDERED ─────────────────────────────────────────────────────
// Called from order.actions.ts after payment is verified.
// Flips status so My Designs can distinguish drafts from completed orders.
export async function markDraftOrdered(designId: string) {
  try {
    await connectToDatabase()

    await Design.findOneAndUpdate(
      { designId },
      { $set: { status: 'ordered' } }
    )
  } catch (error) {
    console.error('[markDraftOrdered]', error)
    throw error
  }
}

// ── DELETE DRAFT ──────────────────────────────────────────────────────────────
// Only deletes if status is still 'draft' — protects ordered designs.
export async function deleteDraft(designId: string, clerkId: string) {
  try {
    await connectToDatabase()

    const deleted = await Design.findOneAndDelete({
      designId,
      clerkId,
      status: 'draft',
    })

    return deleted ? JSON.parse(JSON.stringify(deleted)) : null
  } catch (error) {
    console.error('[deleteDraft]', error)
    throw error
  }
}
