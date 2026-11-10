import { useEffect, useRef, useState } from 'react'
import { X, ChevronRight, ChevronLeft, Package, User, CheckCircle, Plus, Minus, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start' // FIX: `user` was referenced below (firstName/lastName/email) but never defined anywhere in this file — this was a guaranteed crash
import gsap from 'gsap'
import type { GarmentSelection } from './GarmentSelector'
import { createSubmission } from '../../lib/actions/submission_actions'
import type { SizeQty } from '../../lib/actions/submission_actions'

// ─── Types ─────────────────────────────────────────────────────────────────
interface DesignSubmissionOverlayProps {
  open:          boolean
  onClose:       () => void
  activeGarment: GarmentSelection | null
  designId:      string
  stageRef:      React.RefObject<any>   // Konva stage — for thumbnail
}

type Step = 'config' | 'contact' | 'review'

const STEPS: Step[] = ['config', 'contact', 'review']

const STEP_META: Record<Step, { icon: React.ReactNode; label: string; sub: string }> = {
  config:  { icon: <Package  size={14}/>, label: 'Garment Config',  sub: 'Sizes & quantities'    },
  contact: { icon: <User     size={14}/>, label: 'Your Details',    sub: 'How we reach you'      },
  review:  { icon: <CheckCircle size={14}/>, label: 'Review & Send', sub: 'Confirm and submit'   },
}

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
]

// ─── Component ──────────────────────────────────────────────────────────────
export default function DesignSubmissionOverlay({
  open, onClose, activeGarment, designId, stageRef,
}: DesignSubmissionOverlayProps) {

  const { user } = useUser() // FIX: this was missing — see import comment above

  const overlayRef  = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)

  const [step,       setStep]       = useState<Step>('config')
  const [busy,       setBusy]       = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [thumbUrl,   setThumbUrl]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  // ── Form state ─────────────────────────────────────────────────────────────
  const garment = activeGarment?.garment
  const sizes   = garment?.sizes ?? []

  const [sizeBreakdown, setSizeBreakdown] = useState<SizeQty[]>([])
  const [notes,         setNotes]         = useState('')
  const [contact, setContact] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.primaryEmailAddress?.emailAddress ?? '',
    whatsapp:  '',
    city:      '',
    state:     '',
  })
  const [acknowledged, setAcknowledged] = useState(false)

  // Initialise size breakdown when garment changes
  useEffect(() => {
    if (!sizes.length) return
    setSizeBreakdown(sizes.map(s => ({ size: s, qty: 0 })))
  }, [garment?.id])

  // Snapshot canvas thumbnail on open
  useEffect(() => {
    if (!open || !stageRef.current) return
    requestAnimationFrame(() => {
      try {
        const url = stageRef.current.toDataURL({ mimeType: 'image/png', pixelRatio: 0.5 })
        setThumbUrl(url)
      } catch { /* cross-origin element — skip */ }
    })
  }, [open])

  // ── GSAP open / close ──────────────────────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return

    if (open) {
      overlay.style.display = 'flex'
      setStep('config')
      setSubmitted(false)
      setError(null)

      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' })
      gsap.fromTo(panel,
        { y: 40, opacity: 0, scale: 0.97 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(1.5)', delay: 0.05 }
      )
    } else {
      gsap.to(panel,   { y: 20, opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in' })
      gsap.to(overlay, {
        opacity: 0, duration: 0.22, delay: 0.08, ease: 'power2.in',
        onComplete: () => { if (overlay) overlay.style.display = 'none' },
      })
    }
  }, [open])

  // ── Animate step transitions ───────────────────────────────────────────────
  function goToStep(next: Step) {
    if (!contentRef.current) { setStep(next); return }
    gsap.to(contentRef.current, {
      opacity: 0, x: -12, duration: 0.15, ease: 'power2.in',
      onComplete: () => {
        setStep(next)
        gsap.fromTo(contentRef.current,
          { opacity: 0, x: 12 },
          { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }
        )
      },
    })
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const totalPieces = sizeBreakdown.reduce((s, r) => s + r.qty, 0)

  function setQty(size: string, delta: number) {
    setSizeBreakdown(prev =>
      prev.map(r => r.size === size
        ? { ...r, qty: Math.max(0, r.qty + delta) }
        : r
      )
    )
  }

  function configValid()  { return totalPieces > 0 }
  function contactValid() {
    return contact.firstName && contact.lastName &&
           contact.email && contact.whatsapp && contact.state
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!acknowledged) { setError('Please tick the acknowledgement box before submitting.'); return }
    if (!garment || !activeGarment) { setError('No garment selected.'); return }
    setBusy(true)
    setError(null)

    try {
      await createSubmission({
        data: {
          designId,
          garment: {
            id:    garment.id,
            name:  garment.name,
            color: activeGarment.color,
            size:  activeGarment.size,
          },
          sizeBreakdown: sizeBreakdown.filter(r => r.qty > 0),
          totalPieces,
          customer:    contact,
          notes:       notes.trim() || undefined,
          acknowledged,
        },
      })

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  const stepIndex  = STEPS.indexOf(step)
  const isFirst    = stepIndex === 0
  const isLast     = step === 'review'
  const canAdvance = step === 'config'  ? configValid()
                   : step === 'contact' ? contactValid()
                   : true

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        display:         'none',
        position:        'fixed',
        inset:           0,
        zIndex:          70,
        alignItems:      'center',
        justifyContent:  'center',
        background:      'rgba(0,0,0,0.72)',
        backdropFilter:  'blur(6px)',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width:        '100%',
          maxWidth:     '520px',
          margin:       '0 1rem',
          background:   '#111',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow:     'hidden',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.8)',
          color:        '#fff',
          fontFamily:   'inherit',
          display:      'flex',
          flexDirection:'column',
          maxHeight:    '90vh',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '16px 20px 14px',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {thumbUrl && (
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                overflow: 'hidden', background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
              }}>
                <img src={thumbUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="design"/>
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                Submit Your Design
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {garment?.name ?? 'No garment selected'} · {activeGarment?.color.label ?? '—'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}>
            <X size={14}/>
          </button>
        </div>

        {/* ── Step indicators ── */}
        {!submitted && (
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
          }}>
            {STEPS.map((s, i) => {
              const done    = STEPS.indexOf(s) < stepIndex
              const active  = s === step
              const meta    = STEP_META[s]
              return (
                <div key={s} style={{
                  flex: 1, padding: '10px 14px',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  background: active ? 'rgba(200,241,53,0.05)' : 'transparent',
                  borderBottom: active ? '2px solid #C8F135' : '2px solid transparent',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: done ? '#C8F135' : active ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}>
                    {meta.icon}
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                    {meta.sub}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ════ SUCCESS STATE ════ */}
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(200,241,53,0.12)', border: '2px solid #C8F135',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle size={26} color="#C8F135"/>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
                Design submitted!
              </div>
              <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 340, margin: '0 auto 20px' }}>
                We've received your design. Expect a WhatsApp message from us within 24 hours to confirm pricing and next steps. Nothing is charged until you agree.
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                padding: '12px 16px', fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                📦 {totalPieces} piece{totalPieces !== 1 ? 's' : ''} · {garment?.name} · {activeGarment?.color.label}<br/>
                📱 We'll reach you on <strong style={{ color: '#fff' }}>{contact.whatsapp}</strong>
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: 20, padding: '10px 28px', borderRadius: 10,
                  background: '#C8F135', color: '#0E0E0E', fontWeight: 700,
                  fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>

          /* ════ STEP 1: GARMENT CONFIG ════ */
          ) : step === 'config' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionLabel>Size &amp; Quantity Breakdown</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sizeBreakdown.map(row => (
                  <div key={row.size} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px',
                    border: row.qty > 0 ? '1px solid rgba(200,241,53,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: row.qty > 0 ? '#C8F135' : '#fff' }}>
                      {row.size}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <QtyBtn onClick={() => setQty(row.size, -1)} disabled={row.qty === 0}><Minus size={12}/></QtyBtn>
                      <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: 24, textAlign: 'center' }}>
                        {row.qty}
                      </span>
                      <QtyBtn onClick={() => setQty(row.size, +1)}><Plus size={12}/></QtyBtn>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              {totalPieces > 0 && (
                <div style={{
                  background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.18)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>Total pieces</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#C8F135' }}>{totalPieces}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <SectionLabel>Additional notes (optional)</SectionLabel>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any specific requests about your design — print placement, colour preferences, special instructions..."
                  rows={3}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '10px 12px', color: '#fff', fontSize: '0.85rem',
                    resize: 'none', outline: 'none', lineHeight: 1.6,
                    marginTop: 8,
                  }}
                />
              </div>
            </div>

          /* ════ STEP 2: CONTACT ════ */
          ) : step === 'contact' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionLabel>Your details — for order follow-up</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="First name" required>
                  <Input value={contact.firstName} onChange={v => setContact(p => ({ ...p, firstName: v }))} placeholder="Ada"/>
                </Field>
                <Field label="Last name" required>
                  <Input value={contact.lastName} onChange={v => setContact(p => ({ ...p, lastName: v }))} placeholder="Obi"/>
                </Field>
              </div>
              <Field label="Email address" required>
                <Input value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} placeholder="ada@example.com" type="email"/>
              </Field>
              <Field label="WhatsApp number" required note="This is our main comms channel — please make sure it's active">
                <Input value={contact.whatsapp} onChange={v => setContact(p => ({ ...p, whatsapp: v }))} placeholder="+234 800 000 0000" type="tel"/>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="City">
                  <Input value={contact.city} onChange={v => setContact(p => ({ ...p, city: v }))} placeholder="Lagos"/>
                </Field>
                <Field label="State" required>
                  <select
                    value={contact.state}
                    onChange={e => setContact(p => ({ ...p, state: e.target.value }))}
                    style={{
                      width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '9px 12px', color: contact.state ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.85rem', outline: 'none', marginTop: 4,
                    }}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

          /* ════ STEP 3: REVIEW ════ */
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionLabel>Review your submission</SectionLabel>

              {/* Garment summary */}
              <ReviewCard title="Garment">
                <ReviewRow label="Item"   value={garment?.name ?? '—'}/>
                <ReviewRow label="Colour" value={activeGarment?.color.label ?? '—'}/>
                <ReviewRow label="Pieces" value={String(totalPieces)}/>
                <ReviewRow
                  label="Breakdown"
                  value={sizeBreakdown.filter(r => r.qty > 0).map(r => `${r.qty}× ${r.size}`).join(', ')}
                />
                {notes && <ReviewRow label="Notes" value={notes}/>}
              </ReviewCard>

              {/* Contact summary */}
              <ReviewCard title="Contact">
                <ReviewRow label="Name"     value={`${contact.firstName} ${contact.lastName}`}/>
                <ReviewRow label="Email"    value={contact.email}/>
                <ReviewRow label="WhatsApp" value={contact.whatsapp}/>
                <ReviewRow label="Location" value={[contact.city, contact.state].filter(Boolean).join(', ') || '—'}/>
              </ReviewCard>

              {/* Acknowledgement */}
              <label style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                background: acknowledged ? 'rgba(200,241,53,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${acknowledged ? 'rgba(200,241,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => setAcknowledged(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#C8F135', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                  I understand this is a <strong style={{ color: '#fff' }}>design submission</strong>, not a confirmed purchase. Driply will contact me via WhatsApp to confirm pricing and delivery before any payment is required.
                </span>
              </label>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#FCA5A5',
                }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        {!submitted && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => isFirst ? onClose() : goToStep(STEPS[stepIndex - 1])}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {isFirst ? <><X size={13}/> Cancel</> : <><ChevronLeft size={13}/> Back</>}
            </button>

            <button
              onClick={isLast ? handleSubmit : () => goToStep(STEPS[stepIndex + 1])}
              disabled={!canAdvance || busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 10,
                background: canAdvance && !busy ? '#C8F135' : 'rgba(200,241,53,0.25)',
                border: 'none', color: '#0E0E0E', fontSize: '0.85rem', fontWeight: 700,
                cursor: canAdvance && !busy ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {busy
                ? <><Loader2 size={13} className="animate-spin"/> Submitting…</>
                : isLast
                  ? <>Submit Design <CheckCircle size={13}/></>
                  : <>Next <ChevronRight size={13}/></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
      {children}
    </div>
  )
}

function QtyBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
        background: disabled ? 'transparent' : 'rgba(255,255,255,0.07)',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Field({ label, required, note, children }: { label: string; required?: boolean; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#C8F135', marginLeft: 3 }}>*</span>}
      </div>
      {children}
      {note && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginTop: 4, lineHeight: 1.4 }}>{note}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: '0.85rem',
        outline: 'none', marginTop: 4,
      }}
    />
  )
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
        {title}
      </div>
      <div style={{ padding: '6px 0' }}>{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
