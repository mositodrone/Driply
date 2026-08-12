// routes/my-designs.tsx
//
// NOTE on conventions, both assumptions — adjust if they don't match your
// project:
//   1. The `~/` import alias (TanStack Start's default scaffold, usually
//      pointing at `src/`).
//   2. The sign-in route path passed to `redirect()` below — swap for
//      whatever yours actually is.

import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { useState } from 'react'
import { getMyDesignsFeed, type MyDesignCard } from '@/lib/actions/mydesigns.actions.ts'

// ── Server fn — the actual security boundary. beforeLoad below only
//  protects the rendered page; this is what stops a direct call to the
//  endpoint from an unauthenticated request. ──────────────────────────────
const fetchMyDesigns = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw redirect({ to: '/sign-in' })
  }
  return await getMyDesignsFeed(userId)
})

export const Route = createFileRoute('/my-designs')({
  component: MyDesignsPage,
  beforeLoad: async ({ location }) => {
    const { isAuthenticated } = await auth()
    if (!isAuthenticated) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
  },
  loader: async () => await fetchMyDesigns(),
})

// ── Status → label/color/order-in-pipeline ────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  pending:        { label: 'Payment Received', color: '#FFD60A', step: 1 },
  in_production:  { label: 'In Production',    color: '#5FA8FF', step: 2 },
  quality_check:  { label: 'Quality Check',     color: '#B98BFF', step: 3 },
  shipped:        { label: 'Shipped',           color: '#35D0BA', step: 4 },
  delivered:      { label: 'Delivered',         color: '#C8F135', step: 5 },
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins   = Math.floor(diffMs / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function nairaFromKobo(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString()}`
}

// ── Garment hang-tag badge — the one signature flourish on this page ──────────
//  A small notch on the left edge nods to a real clothing tag, without
//  going any further than that one detail.
function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="relative inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1 rounded-r-md text-[0.66rem] font-medium"
      style={{ background: `${color}1F`, color, marginLeft: 6 }}
    >
      {/* Notch */}
      <span
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{ background: '#0B0B0C', boxShadow: `inset 0 0 0 1px ${color}55` }}
      />
      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  )
}

function DesignCard({ card, onDuplicate, onDelete }: {
  card: MyDesignCard
  onDuplicate: (designId: string) => void
  onDelete:    (designId: string) => void
}) {
  const isOrdered = card.kind === 'ordered' && card.order
  const statusMeta = isOrdered ? STATUS_META[card.order!.status] : null

  return (
    <div className="group rounded-2xl bg-white/[0.045] border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.06] transition-colors overflow-hidden flex flex-col">

      {/* ── Thumbnail ── */}
      <div className="relative aspect-[4/3] bg-white/[0.03]">
        {card.previewUrl ? (
          <img src={card.previewUrl} alt={card.garmentName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/15 text-3xl">👕</div>
        )}

        {/* Status / draft tag — top left */}
        <div className="absolute top-3 left-0">
          {isOrdered && statusMeta
            ? <TagBadge label={statusMeta.label} color={statusMeta.color} />
            : <TagBadge label="Draft" color="#ffffff" />}
        </div>

        {/* Actions — top right, drafts only. Ordered designs are immutable. */}
        {!isOrdered && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title="Duplicate"
              onClick={() => onDuplicate(card.designId)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
            >⧉</button>
            <button
              title="Delete"
              onClick={() => onDelete(card.designId)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-[#FF5B3A] hover:border-[#FF5B3A]/40 transition-colors"
            >✕</button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[0.92rem] font-semibold text-white/90 truncate">
          {card.garmentName}{card.colorLabel ? ` — ${card.colorLabel}` : ''}
        </h3>

        <p className="text-[0.72rem] text-white/40 mt-1 mb-4">
          {isOrdered
            ? `${card.order!.totalPieces} pieces · ${nairaFromKobo(card.order!.amountKobo)} · Ordered ${timeAgo(card.updatedAt)}`
            : `${card.elementCount ?? 0} element${card.elementCount === 1 ? '' : 's'} · Updated ${timeAgo(card.updatedAt)}`}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[0.68rem] text-white/30">
            <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: card.colorHex }} />
            {card.size && <span>{card.size}</span>}
          </span>

          {isOrdered ? (
            <Link
              to="/orders/$ref"
              params={{ ref: card.order!.paystackRef }}
              className="dash-btn-ghost !text-[0.72rem] !py-1.5 !px-3"
            >
              View Order →
            </Link>
          ) : (
            <Link
              to="/dashboard"
              search={{ design: card.designId }}
              className="dash-btn-lime !text-[0.72rem] !py-1.5 !px-3"
            >
              Continue Editing →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="text-4xl mb-4 opacity-30">👕</div>
      <h2 className="text-lg font-semibold text-white/80 mb-1.5">No designs yet</h2>
      <p className="text-sm text-white/35 max-w-xs leading-relaxed mb-6">
        Customize a garment and it'll show up here — drafts autosave as you work.
      </p>
      <Link to="/dashboard" className="dash-btn-lime !text-[0.8rem]">
        Start a design →
      </Link>
    </div>
  )
}

function MyDesignsPage() {
  const cards = Route.useLoaderData() as MyDesignCard[]
  const [filter, setFilter] = useState<'all' | 'draft' | 'ordered'>('all')

  const filtered = cards.filter(c => filter === 'all' ? true : c.kind === filter)
  const draftCount   = cards.filter(c => c.kind === 'draft').length
  const orderedCount = cards.filter(c => c.kind === 'ordered').length

  // TODO: wire these to real mutations — duplicateDraft/deleteDraft actions
  // exist in design.actions.ts (deleteDraft) but duplicateDraft doesn't
  // exist yet. Both need confirmation UX (at minimum for delete) before
  // shipping — this is a placeholder so the page is functional to look at.
  function handleDuplicate(designId: string) {
    console.warn('TODO: duplicateDraft() not implemented yet', designId)
  }
  function handleDelete(designId: string) {
    console.warn('TODO: wire to deleteDraft() + confirmation dialog', designId)
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white/95 tracking-tight">My Designs</h1>
            <p className="text-sm text-white/40 mt-1">Your drafts and orders, all in one place.</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 self-start">
            {([
              { id: 'all',     label: `All (${cards.length})` },
              { id: 'draft',   label: `Drafts (${draftCount})` },
              { id: 'ordered', label: `Orders (${orderedCount})` },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[0.74rem] font-medium transition-colors ${
                  filter === t.id
                    ? 'bg-[#C8F135]/15 text-[#C8F135]'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid / empty state ── */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(card => (
              <DesignCard
                key={card.designId}
                card={card}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
