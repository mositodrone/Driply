// routes/api/designs.ts
//
// Server-authoritative persistence for canvas drafts. This replaces the
// old native-MongoDB-driver version of this file, which used a different
// Clerk package (getAuth from @clerk/tanstack-start/server — the deprecated
// pre-rename package) and a different collection entirely from the Mongoose
// Design model everything else (design.actions.ts, /my-designs,
// confirmPaystackOrder's markDraftOrdered) actually reads from. That old
// version should be deleted, not kept alongside this one.
//
// clerkId is always derived from the authenticated session server-side via
// auth() — the client never gets to say who it's saving as. This is what
// dashboard.tsx's syncDraftToServer()/openOrderFlow() call.
//
// Endpoints:
//   GET    /api/designs   — list current user's drafts (used by future
//                            client-side needs; /my-designs currently reads
//                            server-side via getMyDesignsFeed instead)
//   POST   /api/designs   — upsert the current draft (dashboard autosave)
//   DELETE /api/designs   — delete a draft, body: { designId }
//                            (wire up /my-designs' handleDelete TODO to this)

import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@clerk/tanstack-react-start/server'
import { saveDraft, getDraftsByUser, deleteDraft } from '@/lib/actions/design.actions'
import { getMyDesignsFeed } from '@/lib/actions/mydesigns.actions'

export const Route = createFileRoute('/api/designs')({
  server: {
    handlers: {
      GET: async () => {
        const { isAuthenticated, userId } = await auth()
        if (!isAuthenticated || !userId) {
          return Response.json({ error: 'Not authenticated' }, { status: 401 })
        }
        try {
          const drafts = await getDraftsByUser(userId)
          return Response.json({ drafts })
        } catch (error: any) {
          console.error('[api/designs GET]', error)
          return Response.json({ error: error?.message ?? 'Failed to load drafts' }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        const { isAuthenticated, userId } = await auth()
        if (!isAuthenticated || !userId) {
          return Response.json({ error: 'Not authenticated' }, { status: 401 })
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { designId, garment, elements, view, previewUrl } = body
        if (!designId || !elements) {
          return Response.json({ error: 'designId and elements are required' }, { status: 400 })
        }

        try {
          const draft = await saveDraft({
            clerkId: userId, // session-derived — ignores anything the body might claim
            designId,
            garment,
            elements,
            view,
            previewUrl,
          })
          return Response.json({ draft })
        } catch (error: any) {
          console.error('[api/designs POST]', error)
          return Response.json({ error: error?.message ?? 'Failed to save draft' }, { status: 500 })
        }
      },

      DELETE: async ({ request }) => {
        const { isAuthenticated, userId } = await auth()
        if (!isAuthenticated || !userId) {
          return Response.json({ error: 'Not authenticated' }, { status: 401 })
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!body.designId) {
          return Response.json({ error: 'designId required' }, { status: 400 })
        }

        try {
          // deleteDraft() already scopes to clerkId + status:'draft' — an
          // ordered design can't be deleted through this endpoint, and
          // neither can another user's draft.
          const deleted = await deleteDraft(body.designId, userId)
          if (!deleted) {
            return Response.json(
              { error: 'Draft not found, not yours, or already ordered' },
              { status: 404 }
            )
          }
          return Response.json({ ok: true })
        } catch (error: any) {
          console.error('[api/designs DELETE]', error)
          return Response.json({ error: error?.message ?? 'Failed to delete draft' }, { status: 500 })
        }
      },
    },
  },
})
