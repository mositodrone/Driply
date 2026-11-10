// src/routes/api/submissions.ts
//
// Handles unprocessed design submissions — no payment, just data capture.
// Status flow: unprocessed → contacted → in_production → delivered
// You update status manually via Atlas or an admin script.

import { createFileRoute } from '@tanstack/react-router'
import {
  createSubmission,
  getSubmissionsByUser,
} from '../../../lib/actions/submission_actions'

export const Route = createFileRoute('/api/submissions')({
  server: {
    handlers: {

      // ── POST /api/submissions ───────────────────────────────────────────
      // Creates a new unprocessed submission and saves to MongoDB.
      POST: async ({ request }) => {
        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }

        // Basic server-side guards — client validates too, but never trust it alone
        if (!body.designId)
          return Response.json({ error: 'designId required' }, { status: 400 })
        if (!body.garment?.id)
          return Response.json({ error: 'garment required' }, { status: 400 })
        if (!body.sizeBreakdown?.length)
          return Response.json({ error: 'At least one size/qty required' }, { status: 400 })
        if (!body.totalPieces || body.totalPieces < 1)
          return Response.json({ error: 'totalPieces must be ≥ 1' }, { status: 400 })
        if (!body.customer?.whatsapp)
          return Response.json({ error: 'WhatsApp number required' }, { status: 400 })
        if (!body.acknowledged)
          return Response.json({ error: 'Acknowledgement required' }, { status: 400 })
        if (!body.clerkId)
          return Response.json({ error: 'Unauthorised' }, { status: 401 })

        try {
          const submission = await createSubmission(body)
          return Response.json({ ok: true, submission }, { status: 201 })
        } catch (err: any) {
          console.error('[POST /api/submissions]', err)
          return Response.json(
            { error: err.message ?? 'Internal error' },
            { status: 500 }
          )
        }
      },

      // ── GET /api/submissions?clerkId=xxx ────────────────────────────────
      // Returns all submissions for the given user.
      GET: async ({ request }) => {
        const url      = new URL(request.url)
        const clerkId  = url.searchParams.get('clerkId')

        if (!clerkId)
          return Response.json({ error: 'clerkId required' }, { status: 400 })

        try {
          const submissions = await getSubmissionsByUser(clerkId)
          return Response.json({ submissions })
        } catch (err: any) {
          console.error('[GET /api/submissions]', err)
          return Response.json(
            { error: err.message ?? 'Internal error' },
            { status: 500 }
          )
        }
      },
    },
  },
})
