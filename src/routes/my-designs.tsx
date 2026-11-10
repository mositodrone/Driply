// routes/my-designs.tsx
import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { getMyDesignsFeed, type MyDesignCard } from '@/lib/actions/mydesigns.actions'
import { getOrderByRef } from '@/lib/actions/order.actions'

// ── Server fns ────────────────────────────────────────────────────────────────
const fetchMyDesigns = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) throw redirect({ to: '/sign-in' })
  return await getMyDesignsFeed(userId)
})

const fetchOrder = createServerFn({ method: 'GET' })
  .handler(async ({ data: ref }) => {
    const { userId } = await auth()
    if (!userId) throw redirect({ to: '/sign-in' })
    const order = await getOrderByRef(ref)
    if (!order || order.clerkId !== userId) return null
    return order
  })

export const Route = createFileRoute('/my-designs')({
  component: MyDesignsPage,
  // NOTE: no beforeLoad auth check here anymore — it directly called
  // auth() outside the createServerFn RPC boundary, which broke on any
  // client-side navigation to this route (no server request/cookie
  // context exists in the browser for Clerk to read). The loader below
  // is now the sole auth gate, via fetchMyDesigns.
  loader: async () => await fetchMyDesigns(),
})

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  pending:        { label: 'Payment Received', color: '#FFD60A', step: 1 },
  in_production:  { label: 'In Production',    color: '#5FA8FF', step: 2 },
  quality_check:  { label: 'Quality Check',     color: '#B98BFF', step: 3 },
  shipped:        { label: 'Shipped',           color: '#35D0BA', step: 4 },
  delivered:      { label: 'Delivered',         color: '#C8F135', step: 5 },
}

const TIMELINE_STEPS = [
  { status: 'pending',        label: 'Order Confirmed',   icon: '✓'  },
  { status: 'in_production',  label: 'Production Begins', icon: '🧵' },
  { status: 'quality_check',  label: 'Quality Check',     icon: '🔍' },
  { status: 'shipped',        label: 'Shipped',           icon: '📦' },
  { status: 'delivered',      label: 'Delivered',         icon: '🎉' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function nairaFromKobo(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString()}`
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Tag badge ─────────────────────────────────────────────────────────────────
function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1 rounded-r-md text-[0.66rem] font-medium"
      style={{ background: `${color}1F`, color, marginLeft: 6 }}>
      <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{ background: '#0B0B0C', boxShadow: `inset 0 0 0 1px ${color}55` }}/>
      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }}/>
      {label}
    </span>
  )
}

// ── Order details sheet ────────────────────────────────────────────────────────
function OrderSheet({ paystackRef, onClose }: { paystackRef: string; onClose: () => void }) {
  const [order, setOrder]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const sheetRef  = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOrder({ data: paystackRef }).then(o => {
      setOrder(o)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [paystackRef])

  // ── Animate in + scroll lock ────────────────────────────────────────────────
  //  Same iOS Safari fix as GarmentSelector — overflow:hidden alone is a
  //  no-op there; position:fixed with the scroll offset preserved is what
  //  actually stops the background from scrolling behind the sheet.
  useEffect(() => {
    if (!sheetRef.current || !backdropRef.current) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'

    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    gsap.fromTo(sheetRef.current,
      { x: '100%' },
      { x: '0%', duration: 0.4, ease: 'power3.out' }
    )

    return () => {
      document.body.style.position = ''
      document.body.style.top      = ''
      document.body.style.width    = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  function handleClose() {
    if (!sheetRef.current || !backdropRef.current) { onClose(); return }
    gsap.to(sheetRef.current,    { x: '100%', duration: 0.3, ease: 'power2.in' })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.25, onComplete: onClose })
  }

  // Keyboard dismiss
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const currentStep  = order ? TIMELINE_STEPS.findIndex(t => t.status === order.status) : -1
  const statusColor  = order ? (STATUS_META[order.status]?.color ?? '#C8F135') : '#C8F135'
  const deliveryLabel = order?.customer?.delivery === 'express' ? 'Express (3–5 days)'
    : order?.customer?.delivery === 'pickup' ? 'Self-collect'
    : 'Standard (7–14 days)'

  return (
    <>
      {/* Backdrop */}
      <div ref={backdropRef}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div ref={sheetRef} style={{
        position:   'fixed', top: 0, right: 0, bottom: 0,
        width:      'min(520px, 100vw)',
        zIndex:      51,
        background: '#0F0F10',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        overflowY:  'auto',
        display:    'flex',
        flexDirection: 'column',
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .os-close-btn { transition: background-color 0.15s, transform 0.1s; }
          .os-close-btn:hover  { background: rgba(255,255,255,0.12) !important; }
          .os-close-btn:active { transform: scale(0.9); }
          /* Fixed 2-column grid below is cramped on narrow phones —
             stack to one column under 420px sheet width. */
          .os-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          @media (max-width: 420px) {
            .os-two-col { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding:      '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          position:     'sticky', top: 0,
          background:   '#0F0F10',
          zIndex:        1,
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              Order Details
            </p>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
              #{paystackRef?.split('-').pop() ?? paystackRef}
            </h2>
          </div>
          <button onClick={handleClose} className="os-close-btn" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid rgba(200,241,53,0.2)',
                borderTopColor: '#C8F135',
                animation: 'spin 0.7s linear infinite',
              }}/>
            </div>
          )}

          {!loading && !order && (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '4rem', fontSize: '0.875rem' }}>
              Order not found.
            </p>
          )}

          {!loading && order && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Garment preview + status */}
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '1rem',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {order.previewUrl
                    ? <img src={order.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <span style={{ fontSize: '1.75rem' }}>👕</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                        {order.garment?.name ?? 'Custom Garment'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        {order.garment?.color?.label ?? ''} · {order.garment?.size ?? ''}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600,
                      padding: '3px 10px', borderRadius: 99,
                      background: `${statusColor}1A`, color: statusColor,
                      border: `1px solid ${statusColor}33`,
                      whiteSpace: 'nowrap',
                    }}>
                      {STATUS_META[order.status]?.label ?? order.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                      { l: 'Pieces', v: `${order.totalPieces ?? 0} pcs` },
                      { l: 'Paid',   v: nairaFromKobo(order.amount ?? 0) },
                      { l: 'Placed', v: timeAgo(order.createdAt) },
                    ].map(item => (
                      <div key={item.l}>
                        <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.l}</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>{item.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '1rem 1.25rem',
              }}>
                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Order History
                </p>
                {TIMELINE_STEPS.map((step, i) => {
                  const done    = i <= currentStep
                  const current = i === currentStep
                  const dotColor = done ? (current ? statusColor : '#C8F135') : 'rgba(255,255,255,0.1)'
                  return (
                    <div key={step.status} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div style={{
                          position: 'absolute', left: 13, top: 26,
                          width: 2, height: '100%',
                          background: done && i < currentStep ? '#C8F13555' : 'rgba(255,255,255,0.04)',
                        }}/>
                      )}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: done ? `${dotColor}18` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${dotColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', zIndex: 1,
                      }}>
                        {done ? (current ? step.icon : '✓') : ''}
                      </div>
                      <div style={{ paddingBottom: '1rem' }}>
                        <p style={{
                          fontSize: '0.8rem', fontWeight: current ? 600 : 400,
                          color: done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                        }}>{step.label}</p>
                        {current && (
                          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                            {fmt(order.updatedAt ?? order.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Size breakdown */}
              {order.quantities && Object.keys(order.quantities).length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '1rem 1.25rem',
                }}>
                  <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Size & Colour Breakdown
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {Object.entries(order.quantities as Record<string,number>)
                      .filter(([,q]) => q > 0)
                      .map(([size, qty]) => {
                        const split = order.sizeColorSplit?.[size] ?? {}
                        return (
                          <div key={size} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 10, padding: '0.5rem 0.75rem',
                          }}>
                            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Size {size}</p>
                            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{qty} pcs</p>
                            {Object.entries(split).filter(([,q]) => (q as number) > 0).map(([hex,q]) => (
                              <div key={hex} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: hex, flexShrink: 0 }}/>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>{q as number} pcs</span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Delivery + payment */}
              <div className="os-two-col">
                {[
                  { title: 'Delivery', rows: [
                    { l: 'Name',    v: `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}` },
                    { l: 'Phone',   v: order.customer?.phone ?? '—' },
                    { l: 'City',    v: order.customer?.city ?? '—' },
                    { l: 'Method',  v: deliveryLabel },
                  ]},
                  { title: 'Payment', rows: [
                    { l: 'Reference', v: order.paystackRef ?? '—' },
                    { l: 'Amount',    v: nairaFromKobo(order.amount ?? 0) },
                    { l: 'Status',    v: 'Confirmed ✓' },
                    { l: 'Date',      v: fmt(order.createdAt) },
                  ]},
                ].map(section => (
                  <div key={section.title} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: '1rem',
                  }}>
                    <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      {section.title}
                    </p>
                    {section.rows.map(row => (
                      <div key={row.l} style={{ marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>{row.l}</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>{row.v}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '1rem 1.25rem',
                }}>
                  <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Notes</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{order.notes}</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Design card ───────────────────────────────────────────────────────────────
function DesignCard({ card, onViewOrder, onDuplicate, onDelete }: {
  card: MyDesignCard
  onViewOrder: (ref: string) => void
  onDuplicate: (designId: string) => void
  onDelete:    (designId: string) => void
}) {
  const isOrdered  = card.kind === 'ordered' && card.order
  const statusMeta = isOrdered ? STATUS_META[card.order!.status] : null

  return (
    <div className="group rounded-2xl bg-white/[0.045] border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.06] transition-colors overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-white/[0.03]">
        {card.previewUrl
          ? <img src={card.previewUrl} alt={card.garmentName} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-white/15 text-3xl">👕</div>
        }
        <div className="absolute top-3 left-0">
          {isOrdered && statusMeta
            ? <TagBadge label={statusMeta.label} color={statusMeta.color}/>
            : <TagBadge label="Draft" color="#ffffff"/>}
        </div>
        {!isOrdered && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button title="Duplicate" onClick={() => onDuplicate(card.designId)}
              className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:border-white/30 active:scale-90 transition-[color,border-color,transform]">⧉</button>
            <button title="Delete" onClick={() => onDelete(card.designId)}
              className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-[#FF5B3A] hover:border-[#FF5B3A]/40 active:scale-90 transition-[color,border-color,transform]">✕</button>
          </div>
        )}
      </div>
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
            <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: card.colorHex }}/>
            {card.size && <span>{card.size}</span>}
          </span>
          {isOrdered ? (
            <button
              onClick={() => onViewOrder(card.order!.paystackRef)}
              className="dash-btn-ghost !text-[0.72rem] !py-1.5 !px-3"
            >
              View Order →
            </button>
          ) : (
            <Link to="/dashboard" search={{ design: card.designId }}
              className="dash-btn-lime !text-[0.72rem] !py-1.5 !px-3">
              Continue Editing →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="text-4xl mb-4 opacity-30">👕</div>
      <h2 className="text-lg font-semibold text-white/80 mb-1.5">No designs yet</h2>
      <p className="text-sm text-white/35 max-w-xs leading-relaxed mb-6">
        Customize a garment and it'll show up here — drafts autosave as you work.
      </p>
      <Link to="/dashboard" className="dash-btn-lime !text-[0.8rem]">Start a design →</Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
function MyDesignsPage() {
  const cards = Route.useLoaderData() as MyDesignCard[]
  const [filter,       setFilter]       = useState<'all' | 'draft' | 'ordered'>('all')
  const [activeOrderRef, setActiveOrderRef] = useState<string | null>(null)

  const filtered     = cards.filter(c => filter === 'all' ? true : c.kind === filter)
  const draftCount   = cards.filter(c => c.kind === 'draft').length
  const orderedCount = cards.filter(c => c.kind === 'ordered').length

  function handleDuplicate(designId: string) {
    console.warn('TODO: duplicateDraft() not implemented yet', designId)
  }
  function handleDelete(designId: string) {
    console.warn('TODO: wire to deleteDraft() + confirmation dialog', designId)
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white/95 tracking-tight">My Designs</h1>
            <p className="text-sm text-white/40 mt-1">Your drafts and orders, all in one place.</p>
          </div>
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 self-start w-full sm:w-auto overflow-x-auto">
            {([
              { id: 'all',     label: `All (${cards.length})` },
              { id: 'draft',   label: `Drafts (${draftCount})` },
              { id: 'ordered', label: `Orders (${orderedCount})` },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`flex-1 sm:flex-initial whitespace-nowrap px-3 py-2 sm:py-1.5 rounded-lg text-[0.74rem] font-medium active:scale-95 transition-[background-color,color,transform] ${
                  filter === t.id ? 'bg-[#C8F135]/15 text-[#C8F135]' : 'text-white/40 hover:text-white/70'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? <EmptyState/> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(card => (
              <DesignCard
                key={card.designId}
                card={card}
                onViewOrder={ref => setActiveOrderRef(ref)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order details sheet */}
      {activeOrderRef && (
        <OrderSheet
          paystackRef={activeOrderRef}
          onClose={() => setActiveOrderRef(null)}
        />
      )}
    </div>
  )
}