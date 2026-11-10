// src/routes/orders/$ref.tsx
//
// Order details page — accessed via "View Order →" on my-designs.
// Shows the full order snapshot: garment, quantities, customer,
// payment ref, and a live status timeline.

import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getOrderByRef } from '@/lib/actions/order.actions'

// ── Server fn ─────────────────────────────────────────────────────────────────
const fetchOrder = createServerFn({ method: 'GET' })
  .handler(async ({ data: ref }) => {
    const { userId } = await auth()
    if (!userId) throw redirect({ to: '/' })

    const order = await getOrderByRef(ref)
    if (!order || order.clerkId !== userId) throw redirect({ to: '/my-designs' })

    return order
  })

export const Route = createFileRoute('/orders/$ref')({
  component: OrderDetailsPage,
  loader: ({ params }) => fetchOrder({ data: params.ref }),
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function nairaFromKobo(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString()}`
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TIMELINE = [
  { status: 'pending',       label: 'Order Confirmed',   icon: '✓'  },
  { status: 'in_production', label: 'Production Begins', icon: '🧵' },
  { status: 'quality_check', label: 'Quality Check',     icon: '🔍' },
  { status: 'shipped',       label: 'Shipped',           icon: '📦' },
  { status: 'delivered',     label: 'Delivered',         icon: '🎉' },
]

const STATUS_COLOR: Record<string, string> = {
  pending:        '#FFD60A',
  in_production:  '#5FA8FF',
  quality_check:  '#B98BFF',
  shipped:        '#35D0BA',
  delivered:      '#C8F135',
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background:   'rgba(255,255,255,0.03)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius:  16,
      padding:      '1.25rem 1.5rem',
    }}>
      <h3 style={{
        fontSize:      '0.72rem',
        fontWeight:     600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.3)',
        marginBottom:  '1rem',
      }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
function OrderDetailsPage() {
  const order = Route.useLoaderData() as any

  const currentStep = TIMELINE.findIndex(t => t.status === order.status)
  const statusColor = STATUS_COLOR[order.status] ?? '#C8F135'
  const deliveryLabel = order.customer?.delivery === 'express'
    ? 'Express (3–5 days)'
    : order.customer?.delivery === 'pickup'
    ? 'Self-collect'
    : 'Standard (7–14 days)'

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0B0B0C',
      color:      'white',
      fontFamily: 'Syne, sans-serif',
      padding:    '2.5rem 1.5rem',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* ── Back ── */}
        <Link to="/my-designs" style={{
          display:     'inline-flex',
          alignItems:  'center',
          gap:          6,
          fontSize:    '0.8rem',
          color:       'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          marginBottom: '1.75rem',
        }}>
          ← My Designs
        </Link>

        {/* ── Header card ── */}
        <div style={{
          background:   'rgba(255,255,255,0.04)',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius:  20,
          padding:      '1.5rem',
          marginBottom: '1.25rem',
          display:      'flex',
          gap:           16,
          alignItems:   'flex-start',
        }}>
          {/* Preview */}
          <div style={{
            width: 80, height: 80, borderRadius: 14, flexShrink: 0,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {order.previewUrl
              ? <img src={order.previewUrl} alt="Design" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <span style={{ fontSize: '2rem' }}>👕</span>
            }
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  Order #{order.paystackRef?.split('-').pop() ?? '—'}
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                  {order.garment?.name ?? 'Custom Garment'} · {order.garment?.color?.label ?? ''} · {order.garment?.size ?? ''}
                </p>
              </div>
              {/* Status badge */}
              <span style={{
                fontSize:      '0.7rem',
                fontWeight:     600,
                padding:       '4px 12px',
                borderRadius:   99,
                background:    `${statusColor}1A`,
                color:          statusColor,
                border:        `1px solid ${statusColor}33`,
                whiteSpace:    'nowrap',
                flexShrink:     0,
              }}>
                {TIMELINE.find(t => t.status === order.status)?.label ?? order.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 20, marginTop: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Pieces',   val: `${order.totalPieces ?? 0} pcs`              },
                { label: 'Amount',   val: nairaFromKobo(order.amount ?? 0)              },
                { label: 'Delivery', val: deliveryLabel                                 },
                { label: 'Placed',   val: fmt(order.createdAt)                          },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* ── Order timeline ── */}
          <Section title="Order History">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {TIMELINE.map((step, i) => {
                const done    = i <= currentStep
                const current = i === currentStep
                const color   = done ? (current ? statusColor : '#C8F135') : 'rgba(255,255,255,0.12)'

                return (
                  <div key={step.status} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                    {/* Line */}
                    {i < TIMELINE.length - 1 && (
                      <div style={{
                        position:   'absolute',
                        left:        13,
                        top:         26,
                        width:        2,
                        height:      '100%',
                        background:  done && i < currentStep ? '#C8F135' : 'rgba(255,255,255,0.06)',
                      }}/>
                    )}
                    {/* Dot */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background:  done ? `${color}22` : 'rgba(255,255,255,0.04)',
                      border:     `2px solid ${color}`,
                      display:    'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize:    '0.7rem',
                      zIndex:      1,
                    }}>
                      {done ? (current ? step.icon : '✓') : ''}
                    </div>
                    {/* Label */}
                    <div style={{ paddingBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: current ? 600 : 400, color: done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)' }}>
                        {step.label}
                      </div>
                      {current && (
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {fmt(order.updatedAt ?? order.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ── Customer details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Section title="Delivery Address">
              <Row label="Name"    value={`${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}`} />
              <Row label="Phone"   value={order.customer?.phone   ?? '—'} />
              <Row label="Address" value={`${order.customer?.address ?? ''}, ${order.customer?.city ?? ''}`} />
              <Row label="Method"  value={deliveryLabel} />
            </Section>

            <Section title="Payment">
              <Row label="Reference" value={order.paystackRef ?? '—'} />
              <Row label="Amount"    value={nairaFromKobo(order.amount ?? 0)} />
              <Row label="Status"    value="Confirmed" />
            </Section>
          </div>
        </div>

        {/* ── Size & color breakdown ── */}
        {order.quantities && Object.keys(order.quantities).length > 0 && (
          <Section title="Size & Colour Breakdown">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {Object.entries(order.quantities as Record<string,number>)
                .filter(([, qty]) => qty > 0)
                .map(([size, qty]) => {
                  const colorSplit = order.sizeColorSplit?.[size] ?? {}
                  const colorEntries = Object.entries(colorSplit).filter(([, q]) => (q as number) > 0)

                  return (
                    <div key={size} style={{
                      background:   'rgba(255,255,255,0.04)',
                      border:       '1px solid rgba(255,255,255,0.07)',
                      borderRadius:  12,
                      padding:      '0.75rem 1rem',
                      minWidth:      80,
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Size {size}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: colorEntries.length ? 8 : 0 }}>
                        {qty} pcs
                      </div>
                      {colorEntries.map(([hex, q]) => (
                        <div key={hex} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: hex, flexShrink: 0 }}/>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{q as number} pcs</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
            </div>
          </Section>
        )}

        {/* ── Notes ── */}
        {order.notes && (
          <div style={{ marginTop: '1.25rem' }}>
            <Section title="Order Notes">
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{order.notes}</p>
            </Section>
          </div>
        )}

        {/* ── Footer ref ── */}
        <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          Order reference: {order.paystackRef}
        </p>

      </div>
    </div>
  )
}
