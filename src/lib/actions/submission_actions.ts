// lib/actions/submission_actions.ts
//
// Handles "unprocessed" design submissions — orders placed before
// Paystack is live. No payment fields. You fulfil manually, then
// call markSubmissionComplete() to flip the status.

import { connectToDatabase } from '../database/mongoose'
import DesignSubmission from '../database/submission.model'
import { markDraftOrdered } from './design.actions'

export interface SizeQty { size: string; qty: number }

export interface CreateSubmissionParams {
  clerkId:    string
  designId:   string
  // Garment config (mirrors existing order shape so migration is easy later)
  garment: {
    id:    string
    name:  string
    color: { label: string; hex: string }
    size:  string           // primary / default size
  }
  // Per-size breakdown: [{ size: 'M', qty: 2 }, { size: 'L', qty: 1 }]
  sizeBreakdown: SizeQty[]
  totalPieces:   number
  // Contact
  customer: {
    firstName:   string
    lastName:    string
    email:       string
    whatsapp:    string     // required — main comms channel
    city:        string
    state:       string
  }
  notes?:        string
  // Explicit acknowledgement that this is NOT a confirmed purchase
  acknowledged:  boolean
}

// ── CREATE SUBMISSION ─────────────────────────────────────────────────────────
export async function createSubmission(params: CreateSubmissionParams) {
  try {
    await connectToDatabase()

    if (!params.acknowledged) {
      throw new Error('Submission requires customer acknowledgement')
    }

    const doc = await DesignSubmission.create({
      ...params,
      status:    'unprocessed',
      isPaid:    false,
      createdAt: new Date(),
    })

    // Flip the draft to 'ordered' in My Designs so the user sees it pending
    await markDraftOrdered(params.designId)

    return JSON.parse(JSON.stringify(doc))
  } catch (error) {
    console.error('[createSubmission]', error)
    throw error
  }
}

// ── GET ALL SUBMISSIONS FOR USER ──────────────────────────────────────────────
export async function getSubmissionsByUser(clerkId: string) {
  try {
    await connectToDatabase()
    const docs = await DesignSubmission
      .find({ clerkId })
      .sort({ createdAt: -1 })
    return JSON.parse(JSON.stringify(docs))
  } catch (error) {
    console.error('[getSubmissionsByUser]', error)
    throw error
  }
}

// ── MARK COMPLETE (admin/manual) ──────────────────────────────────────────────
// Call this manually (from Atlas, an admin route, or a simple script)
// after you've fulfilled the delivery cycle.
// status flow: unprocessed → contacted → in_production → delivered
export async function updateSubmissionStatus(
  id:     string,
  status: 'unprocessed' | 'contacted' | 'in_production' | 'delivered'
) {
  try {
    await connectToDatabase()
    const updated = await DesignSubmission.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
    if (!updated) throw new Error(`Submission not found: ${id}`)
    return JSON.parse(JSON.stringify(updated))
  } catch (error) {
    console.error('[updateSubmissionStatus]', error)
    throw error
  }
}
