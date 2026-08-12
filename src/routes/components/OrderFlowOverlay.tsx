// ============================================================
//  DRIPLY — Order Flow Overlay
//  app/components/OrderFlowOverlay.tsx
//
//  A single component that owns the entire 4-step checkout
//  journey. Slides in over the dashboard — never a route change.
//
//  Steps:
//    0 — Order Preview     (quantities, colors, size breakdown)
//    1 — Customer Info     (contact + delivery)
//    2 — Payment Details   (card or alternative — tabs fixed)
//    3 — Order Confirmed   (celebration)
//
//  Props:
//    open      — whether the overlay is visible
//    onClose   — called when user backs out from step 0
//    designId  — current draft ID (for order reference)
//    elements  — canvas elements snapshot (passed to quote)
// ============================================================

// ─── Clerk webhook — wire this before Paystack go-live ───────────────────────
//
//  Every Driply order needs a userId to link to the user account in MongoDB.
//  Clerk's userId is available client-side via useUser(), but the MongoDB user
//  document must exist before the order is written — the webhook creates it.
//
//  Setup:
//  1. Create a TanStack Start API route: app/api/webhooks/clerk.ts
//  2. In Clerk dashboard → Webhooks → Add endpoint:
//       URL: https://yourdomain.com/api/webhooks/clerk
//       Events: user.created, user.updated
//  3. Install: npm install svix  (Clerk uses svix for webhook signature verification)
//  4. Route handler skeleton:
//
//     import { Webhook } from 'svix'
//     import { connectDB } from '~/lib/db'
//     import User from '~/models/User'
//
//     export const APIRoute = createAPIFileRoute('/api/webhooks/clerk')({
//       POST: async ({ request }) => {
//         const payload = await request.text()
//         const headers = Object.fromEntries(request.headers)
//         const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
//         const evt = wh.verify(payload, headers) as any
//
//         if (evt.type === 'user.created') {
//           await connectDB()
//           await User.create({
//             clerkId:   evt.data.id,
//             email:     evt.data.email_addresses[0].email_address,
//             firstName: evt.data.first_name,
//             lastName:  evt.data.last_name,
//             createdAt: new Date(),
//           })
//         }
//         return new Response('ok', { status: 200 })
//       },
//     })
//
//  5. Add CLERK_WEBHOOK_SECRET to .env (from Clerk dashboard → Webhook signing secret)
//  6. Test with ngrok locally: ngrok http 3000 → paste URL into Clerk webhook endpoint
//
// ─────────────────────────────────────────────────────────────────────────────

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import CustomEase from 'gsap/CustomEase'
import { useCallback, useEffect, useRef, useState } from 'react'

gsap.registerPlugin(useGSAP, CustomEase)
CustomEase.create('slide',    'M0,0 C0.77,0 0.18,1 1,1')
CustomEase.create('elastic-soft', 'M0,0 C0.14,0 0.27,0.3 0.38,0.7 0.46,0.95 0.52,1.05 0.6,1.08 0.72,1.12 0.8,1 1,1')

// ─── Types ────────────────────────────────────────────────────────────────────
type PayMethod = 'card' | 'transfer' | 'cod'

// What a completed payment hands back to the overlay. `authorization` is
// Paystack's masked card metadata (last4 + brand) — never the PAN or CVV —
// and is only present for card payments, once you're pulling it from your
// backend's verify response (see StepPayment's payWithPaystackCard below).
interface PaymentResult {
  reference:      string
  channel:        PayMethod
  authorization?: { last4: string; brand?: string; bank?: string }
}

interface OrderFlowOverlayProps {
  open:             boolean
  onClose:          () => void
  designId:         string
  // Clerk user id of the signed-in customer. Passed down from wherever this
  // overlay is mounted (the dashboard route already has this from its own
  // auth check) rather than re-derived here, so this file doesn't need to
  // guess your Clerk client hook/import.
  clerkId:          string
  // Base64 PNG of the full canvas (garment + all elements) exported via
  // stage.toDataURL() in dashboard.tsx when the order flow opens.
  // This is shown in StepPreview instead of the plain garment image.
  designPreviewUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = [
  { label: 'Sky Blue', bg: '#2ECEFF', collar: '#1AAFEA' },
  { label: 'Lime',     bg: '#C8F135', collar: '#9BBF10' },
  { label: 'Coral',    bg: '#FF5B3A', collar: '#c94424' },
  { label: 'Ink',      bg: '#0E0E0E', collar: '#050505' },
  { label: 'Violet',   bg: '#7B5BFF', collar: '#5a3fdd' },
  { label: 'Cream',    bg: '#F0EDE8', collar: '#d8d4cf' },
]
const SIZES       = ['XS','S','M','L','XL','XXL']
const BRAND       = ['#C8F135','#FF5B3A','#3ABAFF','#7B5BFF','#FFD60A','#0E0E0E','#FF79C6']
const BASE_PRICE  = 4500

const STEP_LABELS = ['Review Order','Customer Info','Payment','Confirmed']

const rnd = (a: number, b: number) => Math.random() * (b - a) + a

// ─── Shared order state — lifted to overlay level so session write has ────────
//  everything in one place when payment confirms.
interface OrderData {
  colorIdx:  number
  size:      string
  qty:       Record<string,number>
  // Per-size color split: { [size]: { [colorHex]: quantity } }
  sizeColorSplit: Record<string, Record<string,number>>
  notes:     string
  totalPcs:  number
  subtotal:  number
  discount:  number
  total:     number
  promoOk:   boolean
  customer: {
    firstName: string; lastName: string
    email: string; phone: string
    address: string; city: string; state: string; zip: string
    delivery: string
  }
}

const DEFAULT_ORDER: OrderData = {
  colorIdx:       0,
  size:           'M',
  qty:            {},   // all sizes start at 0 — user sets intentionally
  sizeColorSplit: {},   // populated per-size when user opens customize panel
  notes:          '',
  totalPcs:       0,
  subtotal:       0,
  discount:       0,
  total:          1500,
  promoOk:        false,
  customer: {
    firstName:'', lastName:'', email:'', phone:'',
    address:'', city:'', state:'', zip:'', delivery:'standard',
  },
}
function ShirtSVG({ color='#2ECEFF', collar='#1AAFEA', size=160 }) {
  return (
    <svg viewBox="0 0 340 400" width={size} xmlns="http://www.w3.org/2000/svg"
      style={{ filter:'drop-shadow(0 12px 28px rgba(0,0,0,0.12))',transition:'all 0.35s ease' }}>
      <path d="M85,90 L30,130 L60,160 L80,148 L80,350 L260,350 L260,148 L280,160 L310,130 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 Z"
        fill={color} style={{transition:'fill 0.35s ease'}}/>
      <path d="M155,90 C155,90 163,108 170,115 C177,108 185,90 185,90 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 L140,75 Z"
        fill={collar} style={{transition:'fill 0.35s ease'}}/>
      <path d="M30,130 L60,160 L80,148 L80,130 Z" fill="rgba(0,0,0,0.07)"/>
      <path d="M310,130 L280,160 L260,148 L260,130 Z" fill="rgba(0,0,0,0.07)"/>
      <rect x="120" y="165" width="100" height="80" rx="6" fill="none"
        stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="6,4"/>
      <text x="170" y="200" textAnchor="middle" fontFamily="Syne,sans-serif"
        fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.9)" letterSpacing="2">YOUR</text>
      <text x="170" y="218" textAnchor="middle" fontFamily="Syne,sans-serif"
        fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.9)" letterSpacing="2">DESIGN</text>
    </svg>
  )
}

// ─── Qty stepper ──────────────────────────────────────────────────────────────
function Stepper({ val, onInc, onDec, sublabel }: { val:number; onInc:()=>void; onDec:()=>void; sublabel?:string }) {
  const numRef = useRef<HTMLSpanElement>(null)
  function pop(dir: 1|-1) {
    gsap.fromTo(numRef.current,
      { y: dir * -7, scale: 0.8, opacity: 0.4 },
      { y: 0, scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' })
  }
  return (
    <div className="ofo-stepper">
      <button className="ofo-step-btn" onClick={() => { onDec(); pop(-1) }}>−</button>
      <div className="flex flex-col items-center" style={{minWidth:36}}>
        <span ref={numRef} className="ofo-step-val text-[#040540]">{val}</span>
        {sublabel && (
          <span className="text-[0.55rem] font-semibold text-[#000000] leading-none mt-0.5 whitespace-nowrap">
            {sublabel}
          </span>
        )}
      </div>
      <button className="ofo-step-btn" onClick={() => { onInc(); pop(1)  }}>+</button>
    </div>
  )
}

// ─── Animated input ───────────────────────────────────────────────────────────
function Field({ label, type='text', placeholder, value, onChange, error, onFocus, onBlur, maxLength, className='' }:{
  label:string; type?:string; placeholder:string; value:string
  onChange:(v:string)=>void; error?:string; onFocus?:()=>void
  onBlur?:()=>void; maxLength?:number; className?:string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && wrapRef.current) {
      gsap.fromTo(wrapRef.current,{x:0},
        {x:8,duration:0.07,repeat:4,yoyo:true,ease:'none',
          onComplete:()=>gsap.set(wrapRef.current,{x:0})})
    }
  },[error])

  return (
    <div ref={wrapRef} className={`ofo-field ${className}`}>
      <label className="ofo-field-label">{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        maxLength={maxLength}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>{
          gsap.fromTo(lineRef.current,{scaleX:0,transformOrigin:'left center'},{scaleX:1,duration:0.3,ease:'power2.out'})
          onFocus?.()
        }}
        onBlur={()=>{ if(!value) gsap.to(lineRef.current,{scaleX:0,duration:0.2}); onBlur?.() }}
        className={`ofo-field-input ${error?'ofo-field-err':''}`}/>
      <div ref={lineRef} className="ofo-field-line" style={{transform:'scaleX(0)'}}/>
      {error && <span className="ofo-field-errmsg">{error}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0 — ORDER PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
function StepPreview({
  onNext, order, setOrder, activeGarment, designPreviewUrl,
}:{
  onNext:()=>void
  order: OrderData
  setOrder: React.Dispatch<React.SetStateAction<OrderData>>
  activeGarment: any
  designPreviewUrl?: string
}) {
  const shirtRef = useRef<HTMLDivElement>(null)

  const color    = COLORS[order.colorIdx]
  const totalPcs = Object.values(order.qty).reduce((a,b)=>a+b,0)
  const subtotal = totalPcs * BASE_PRICE
  const discount = order.promoOk ? Math.round(subtotal*0.1) : 0
  const total    = subtotal - discount + 1500

  // Keep computed totals in sync with shared state
  useEffect(()=>{
    setOrder(o=>({...o, totalPcs, subtotal, discount, total}))
  },[totalPcs, order.promoOk])

  // Per-size color panel open/closed state
  const [openColorPanels, setOpenColorPanels] = useState<Record<string,boolean>>({})

  // Shirt idle float
  useGSAP(()=>{
    gsap.to(shirtRef.current,{y:'-=10',rotation:1.2,duration:3,ease:'sine.inOut',yoyo:true,repeat:-1})
  },{scope:shirtRef})

  function handleColorChange(i:number) {
    if(i===order.colorIdx) return
    gsap.to(shirtRef.current,{rotationY:90,duration:0.18,ease:'power2.in',
      onComplete:()=>{
        setOrder(o=>({...o, colorIdx:i}))
        gsap.fromTo(shirtRef.current,{rotationY:-90},{rotationY:0,duration:0.22,ease:'power2.out'})
      }})
  }

  const garmentSrc    = activeGarment?.garment?.images?.front ?? null
  const garmentName   = activeGarment?.garment?.name ?? 'Custom Garment'
  const garmentColors = activeGarment?.garment?.colors ?? COLORS.map((c:any)=>({...c, hex:c.bg}))
  const garmentSizes  = activeGarment?.garment?.sizes ?? SIZES

  const [promo, setPromo] = useState('')

  // Helpers
  function incQty(s:string) {
    setOrder(o=>({...o, qty:{...o.qty,[s]:(o.qty[s]??0)+1}}))
  }
  function decQty(s:string) {
    const next = Math.max(0,(order.qty[s]??0)-1)
    setOrder(o=>{
      const split = o.sizeColorSplit[s] ?? {}
      const assigned = Object.values(split).reduce((a:number,b:number)=>a+b,0)
      // If dec would go below assigned, trim last color entry
      let newSplit = split
      if (next < assigned) {
        const keys = Object.keys(split)
        const last = [...keys].reverse().find(k=>(split[k]??0)>0)
        if (last) newSplit = {...split,[last]:Math.max(0,(split[last]??0)-1)}
      }
      return {...o, qty:{...o.qty,[s]:next}, sizeColorSplit:{...o.sizeColorSplit,[s]:newSplit}}
    })
  }

  function toggleColorPanel(s:string) {
    setOpenColorPanels(p=>({...p,[s]:!p[s]}))
    // Initialise with primary color holding all pieces
    if(!order.sizeColorSplit[s]) {
      const baseHex = (garmentColors[order.colorIdx]?.hex ?? garmentColors[order.colorIdx]?.bg) as string
      setOrder(o=>({...o, sizeColorSplit:{...o.sizeColorSplit,[s]:{[baseHex]:o.qty[s]??0}}}))
    }
  }

  function setSizeColor(s:string, hex:string, qty:number) {
    setOrder(o=>({
      ...o,
      sizeColorSplit:{
        ...o.sizeColorSplit,
        [s]:{...(o.sizeColorSplit[s]??{}),[hex]:Math.max(0,qty)},
      },
    }))
  }

  function unassigned(s:string): number {
    const split   = order.sizeColorSplit[s] ?? {}
    const assigned = Object.values(split).reduce((a:number,b:number)=>a+b,0)
    return (order.qty[s]??0) - assigned
  }

  // Block proceed if any open panel has unassigned pieces
  const hasUnassigned = garmentSizes.some(
    (s:string) => openColorPanels[s] && unassigned(s) !== 0
  )

  return (
    <div className="ofo-step-content">
      <div className="ofo-two-col">
        <div className="space-y-4">

          {/* Product card */}
          <div className="ofo-card">
            <div className="flex gap-6 items-start">
              <div className="relative flex-shrink-0">
                <div className="w-[170px] h-[210px] rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{background:`${color.bg}18`,perspective:'800px'}}>
                  <div ref={shirtRef} style={{transformStyle:'preserve-3d'}}>
                    {/* designPreviewUrl = stage.toDataURL() — shows garment + all
                        design elements as one flat image. Falls back to plain
                        garment PNG, then SVG placeholder. */}
                    {designPreviewUrl ? (
                      <img src={designPreviewUrl} alt="Your design preview"
                        style={{width:150,height:'auto',objectFit:'contain',borderRadius:8}}/>
                    ) : garmentSrc ? (
                      <img src={garmentSrc} alt={garmentName}
                        style={{width:150,height:'auto',objectFit:'contain',
                          filter:activeGarment?.color?.filter??'none',transition:'filter 0.35s ease'}}/>
                    ) : (
                      <ShirtSVG color={color.bg} collar={color.collar} size={150}/>
                    )}
                  </div>
                </div>
                <div className="ofo-design-badge">YOUR DESIGN</div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="ofo-tag text-[#FF5B3A]">Custom Order</div>
                  <h3 className="ofo-product-name">{garmentName}</h3>
                  <p className="text-xs text-[#888]">
                    {activeGarment?.color?.label ?? color.label} · {order.size}
                  </p>
                </div>
                {/* Color */}
                <div>
                  <div className="ofo-field-label mb-1.5">Color — <span className="text-[#0E0E0E] font-semibold">{color.label}</span></div>
                  <div className="flex gap-2 flex-wrap">
                    {garmentColors.map((c:any,i:number)=>(
                      <button key={i} onClick={()=>handleColorChange(i)}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          background: c.hex??c.bg,
                          borderColor: i===order.colorIdx?'#0E0E0E':'transparent',
                          boxShadow: i===order.colorIdx?'0 0 0 2px #F8F5EF, 0 0 0 3.5px #0E0E0E':'none',
                          transform: i===order.colorIdx?'scale(1.22)':'scale(1)',
                        }}/>
                    ))}
                  </div>
                </div>
                {/* Size */}
                <div>
                  <div className="ofo-field-label mb-1.5">Size</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {garmentSizes.map((s:string)=>(
                      <button key={s} onClick={()=>setOrder(o=>({...o,size:s}))}
                        className={`ofo-size-btn ${order.size===s?'ofo-size-active':''}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Size breakdown + per-size color customisation ── */}
          <div className="ofo-card">
            <h3 className="ofo-card-title">Size Breakdown</h3>
            <p className="ofo-card-sub mb-4">
              Set quantities per size. Use "Customize" to split a size across multiple colors.
              Minimum 10 pieces total.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {garmentSizes.map((s:string)=>{
                const qty      = order.qty[s]??0
                const split    = order.sizeColorSplit[s]??{}
                const assigned = Object.values(split).reduce((a:number,b:number)=>a+b,0)
                const remain   = qty - assigned
                const isOpen   = openColorPanels[s] && qty > 0

                return (
                  <div key={s} className="ofo-size-col">

                    {/* Label + stepper */}
                    <div className="flex items-center justify-between w-full">
                      <span className="font-display text-sm font-black text-[#0E0E0E]">{s}</span>
                      <Stepper
                        val={qty}
                        onInc={()=>incQty(s)}
                        onDec={()=>decQty(s)}
                        sublabel={qty>0?`₦${(qty*BASE_PRICE).toLocaleString()}`:undefined}
                      />
                    </div>

                    {/* Subtotal line */}
                    <div className="flex justify-between items-center w-full pt-1.5 border-t border-black/[0.05]">
                      <span className="text-[0.6rem] text-[#bbb] uppercase tracking-wide">Subtotal</span>
                      <span className={`text-[0.68rem] font-bold ${qty>0?'text-[#0E0E0E]':'text-[#ddd]'}`}>
                        {qty>0?`₦${(qty*BASE_PRICE).toLocaleString()}`:'—'}
                      </span>
                    </div>

                    {/* Customize toggle */}
                    {qty>0&&(
                      <button
                        onClick={()=>toggleColorPanel(s)}
                        className={`text-[0.6rem] font-semibold uppercase tracking-wide transition-colors text-left mt-0.5 ${
                          isOpen?'text-[#FF5B3A]':'text-[#bbb] hover:text-[#0E0E0E]'
                        }`}
                      >
                        {isOpen?'▲ Close':'▼ Customize'}
                      </button>
                    )}

                    {/* Inline color split */}
                    {isOpen&&(
                      <div className="pt-2 space-y-1.5 border-t border-black/[0.05] w-full">
                        {/* Remaining indicator */}
                        <p className={`text-[0.6rem] font-semibold ${
                          remain>0?'text-[#888]':remain<0?'text-[#FF5B3A]':'text-[#5a7000]'
                        }`}>
                          {remain>0?`${remain} unassigned`
                            :remain<0?`Over by ${Math.abs(remain)}`
                            :`✓ All ${qty} assigned`}
                        </p>

                        {garmentColors.map((c:any)=>{
                          const hex  = c.hex??c.bg
                          const cqty = split[hex]??0
                          return (
                            <div key={hex} className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full flex-shrink-0 border border-white shadow-sm"
                                style={{background:hex}}/>
                              <span className="flex-1 text-[0.6rem] text-[#666] truncate">{c.label}</span>
                              <div className="ofo-stepper ofo-stepper-xs">
                                <button className="ofo-step-btn ofo-step-btn-xs"
                                  disabled={cqty===0}
                                  style={{opacity:cqty===0?0.3:1}}
                                  onClick={()=>setSizeColor(s,hex,cqty-1)}>−</button>
                                <span className="ofo-step-val text-[0.65rem] min-w-[18px] text-center">{cqty}</span>
                                <button className="ofo-step-btn ofo-step-btn-xs"
                                  disabled={remain<=0&&cqty===0}
                                  style={{opacity:remain<=0&&cqty===0?0.3:1}}
                                  onClick={()=>setSizeColor(s,hex,cqty+1)}>+</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Totals footer */}
            <div className="pt-3 mt-3 border-t border-black/[0.06] space-y-1.5">
              {garmentSizes.filter((s:string)=>(order.qty[s]??0)>0).map((s:string)=>{
                const split   = order.sizeColorSplit[s]??{}
                const entries = Object.entries(split).filter(([,q])=>(q as number)>0)
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs text-[#888]">
                      <span>Size {s}</span>
                      <span className="font-semibold text-[#0E0E0E]">{order.qty[s]} pcs</span>
                    </div>
                    {entries.length>0&&(
                      <div className="pl-3 mt-0.5 space-y-0.5">
                        {entries.map(([hex,q])=>{
                          const cd = garmentColors.find((c:any)=>(c.hex??c.bg)===hex)
                          return (
                            <div key={hex} className="flex items-center gap-1 text-[0.6rem] text-[#bbb]">
                              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{background:hex}}/>
                              {cd?.label??hex} — {q as number} pcs
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.04]">
                <span className="text-sm font-semibold text-[#0E0E0E]">Total pieces</span>
                <span className={`font-display font-black ${totalPcs<10?'text-[#FF5B3A]':'text-[#0E0E0E]'}`}>
                  {totalPcs} pcs
                  {totalPcs<10&&totalPcs>0&&<span className="text-xs font-normal ml-1">(min. 10)</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="ofo-card">
            <h3 className="ofo-card-title">Order Notes <span className="text-[#aaa] font-normal text-sm">(optional)</span></h3>
            <textarea
              value={order.notes}
              onChange={e=>setOrder(o=>({...o,notes:e.target.value}))}
              placeholder="e.g. Use Pantone 185C for red. Individual poly-bags per piece…"
              rows={2} className="ofo-textarea mt-3"/>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-3">
          <div className="ofo-summary-card">
            <h3 className="ofo-card-title mb-4">Order Summary</h3>
            {/* Mini preview */}
            <div className="flex items-center gap-3 bg-[#F8F5EF] rounded-xl p-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{background:`${color.bg}22`}}>
                {garmentSrc ? (
                  <img src={garmentSrc} alt={garmentName}
                    style={{width:38,height:'auto',objectFit:'contain',filter:activeGarment?.color?.filter??'none'}}/>
                ) : (
                  <ShirtSVG color={color.bg} collar={color.collar} size={38}/>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0E0E0E]">{garmentName}</div>
                <div className="text-xs text-[#888]">{totalPcs} pcs · {color.label}</div>
              </div>
            </div>
            <div className="space-y-2.5 mb-4">
              <div className="ofo-sum-line">
                <span>{totalPcs} pcs × ₦{BASE_PRICE.toLocaleString()}</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {/* Per-size color split in summary */}
              {garmentSizes.some((s:string)=>openColorPanels[s]&&Object.values(order.sizeColorSplit[s]??{}).some((q:number)=>q>0))&&(
                <div className="pl-3 border-l-2 border-[#F2EFEA] space-y-0.5">
                  {garmentSizes.filter((s:string)=>openColorPanels[s]).map((s:string)=>{
                    const entries=Object.entries(order.sizeColorSplit[s]??{}).filter(([,q])=>(q as number)>0)
                    if(!entries.length) return null
                    return (
                      <div key={s} className="text-[0.6rem] text-[#aaa]">
                        <span className="font-semibold text-[#888]">Size {s} </span>
                        {entries.map(([hex,q])=>{
                          const cd=garmentColors.find((c:any)=>(c.hex??c.bg)===hex)
                          return (
                            <span key={hex} className="mr-2">
                              <span className="inline-block w-2 h-2 rounded-full mr-0.5 align-middle" style={{background:hex}}/>
                              {cd?.label} {q as number}
                            </span>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="ofo-sum-line"><span>Production &amp; shipping</span><span>₦1,500</span></div>
              {order.promoOk && <div className="ofo-sum-line text-[#2ECC71]"><span>Promo DRIP10</span><span>−₦{discount.toLocaleString()}</span></div>}
            </div>
            {/* Promo */}
            <div className="flex gap-2 mb-3">
              <input placeholder="Promo code" value={promo} onChange={e=>setPromo(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&promo.toLowerCase()==='drip10'&&setOrder(o=>({...o,promoOk:true}))}
                className="ofo-promo-input"/>
              <button onClick={()=>promo.toLowerCase()==='drip10'&&setOrder(o=>({...o,promoOk:true}))}
                className={`ofo-promo-btn ${order.promoOk?'bg-[#C8F135] text-[#0E0E0E]':'bg-[#0E0E0E] text-white'}`}>
                {order.promoOk?'✓':'Apply'}
              </button>
            </div>
            {order.promoOk&&<p className="text-xs text-[#2ECC71] mb-3">10% off applied!</p>}
            <div className="flex justify-between items-center py-3 border-t border-black/[0.06] mb-4">
              <span className="font-display font-bold">Total</span>
              <span className="font-display text-xl font-black">₦{total.toLocaleString()}</span>
            </div>
            <button
              onClick={onNext}
              disabled={totalPcs<10||hasUnassigned}
              className={`ofo-cta-btn w-full ${totalPcs<10||hasUnassigned?'opacity-40 cursor-not-allowed':''}`}
              onMouseEnter={e=>!(totalPcs<10||hasUnassigned)&&gsap.to(e.currentTarget,{scale:1.02,duration:0.2,ease:'power2.out'})}
              onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.2})}>
              Continue to Checkout →
            </button>
            {totalPcs<10&&<p className="text-xs text-[#FF5B3A] text-center mt-2">Minimum 10 pieces</p>}
            {totalPcs>=10&&hasUnassigned&&(
              <p className="text-xs text-[#FF5B3A] text-center mt-2">
                Finish assigning colors before proceeding
              </p>
            )}
          </div>
          {/* Trust */}
          <div className="ofo-card py-3">
            {[['🔒','Secure payment'],['✓','Quality guaranteed'],['📦','7–14 day production'],['↩','Free revision if wrong']].map(([ic,tx],i,arr)=>(
              <div key={tx} className={`flex items-center gap-3 py-2 ${i<arr.length-1?'border-b border-black/[0.05]':''}`}>
                <span className="text-sm w-5 text-center">{ic}</span>
                <span className="text-xs text-[#3A3A3A]">{tx}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — CUSTOMER INFO
// ─────────────────────────────────────────────────────────────────────────────
function StepInfo({
  onNext, order, setOrder,
}:{
  onNext:()=>void
  order: OrderData
  setOrder: React.Dispatch<React.SetStateAction<OrderData>>
}) {
  const c = order.customer
  const set = (k: keyof OrderData['customer']) => (v: string) =>
    setOrder(o=>({...o, customer:{...o.customer,[k]:v}}))

  const [errors,setErrors]=useState<Record<string,string>>({})
  const formRef=useRef<HTMLDivElement>(null)

  function validate() {
    const e:Record<string,string>={}
    if(!c.firstName.trim()) e.fn='Required'
    if(!c.lastName.trim())  e.ln='Required'
    if(!c.email.includes('@')) e.em='Valid email required'
    if(c.phone.length<8)    e.ph='Valid phone required'
    if(!c.address.trim())   e.ad='Required'
    if(!c.city.trim())      e.ci='Required'
    setErrors(e)
    if(Object.keys(e).length) {
      gsap.fromTo(formRef.current,{x:0},{x:8,duration:0.07,repeat:4,yoyo:true,ease:'none',
        onComplete:()=>gsap.set(formRef.current,{x:0})})
      return false
    }
    return true
  }

  return (
    <div className="ofo-step-content">
      <div ref={formRef} className="max-w-2xl mx-auto space-y-4">
        <div className="ofo-card">
          <h3 className="ofo-card-title mb-5">Contact Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" placeholder="Adaeze" value={c.firstName} onChange={v=>{set('firstName')(v);setErrors(e=>({...e,fn:''}))}} error={errors.fn}/>
            <Field label="Last Name"  placeholder="Kolade"  value={c.lastName}  onChange={v=>{set('lastName')(v); setErrors(e=>({...e,ln:''}))}} error={errors.ln}/>
            <Field label="Email" type="email" placeholder="adaeze@example.com" value={c.email} onChange={v=>{set('email')(v);setErrors(e=>({...e,em:''}))}} error={errors.em} className="col-span-2"/>
            <Field label="Phone" placeholder="+234 800 000 0000" value={c.phone} onChange={v=>{set('phone')(v);setErrors(e=>({...e,ph:''}))}} error={errors.ph} className="col-span-2"/>
          </div>
        </div>

        <div className="ofo-card">
          <h3 className="ofo-card-title mb-5">Delivery Address</h3>
          <div className="space-y-4">
            <Field label="Street Address" placeholder="14 Bourdillon Road" value={c.address} onChange={v=>{set('address')(v);setErrors(e=>({...e,ad:''}))}} error={errors.ad}/>
            <div className="grid grid-cols-3 gap-3">
              <Field label="City"  placeholder="Lagos"       value={c.city}  onChange={v=>{set('city')(v);setErrors(e=>({...e,ci:''}))}} error={errors.ci}/>
              <Field label="State" placeholder="Lagos State" value={c.state} onChange={set('state')}/>
              <Field label="ZIP"   placeholder="100001"      value={c.zip}   onChange={set('zip')} maxLength={8}/>
            </div>
          </div>
        </div>

        <div className="ofo-card">
          <h3 className="ofo-card-title mb-4">Delivery Option</h3>
          <div className="space-y-2.5">
            {[
              {id:'standard',label:'Standard Delivery',sub:'7–14 business days',price:'₦1,500'},
              {id:'express', label:'Express Delivery', sub:'3–5 business days', price:'₦3,500'},
              {id:'pickup',  label:'Self-collect',     sub:'Lagos Island only', price:'Free'},
            ].map(opt=>(
              <label key={opt.id}
                onClick={()=>set('delivery')(opt.id)}
                className={`ofo-delivery-opt ${c.delivery===opt.id?'ofo-delivery-active':''}`}
                onMouseEnter={e=>gsap.to(e.currentTarget,{x:4,duration:0.2,ease:'power2.out'})}
                onMouseLeave={e=>gsap.to(e.currentTarget,{x:0,duration:0.2,ease:'power2.out'})}>
                <div className={`ofo-radio ${c.delivery===opt.id?'ofo-radio-active':''}`}>
                  {c.delivery===opt.id&&<div className="ofo-radio-dot"/>}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#0E0E0E]">{opt.label}</div>
                  <div className="text-xs text-[#888]">{opt.sub}</div>
                </div>
                <span className="text-sm font-bold text-[#0E0E0E]">{opt.price}</span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={()=>validate()&&onNext()}
          className="ofo-cta-btn w-full"
          onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.02,duration:0.2,ease:'power2.out'})}
          onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.2})}>
          Continue to Payment →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
function StepPayment({ onNext, order, designId, clerkId, activeGarment }:{
  onNext:(result:PaymentResult)=>void
  order:OrderData
  designId:string
  clerkId:string
  activeGarment?: any
}) {
  const [payTab,    setPayTab]    = useState<'card'|'other'>('card')
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [errors,    setErrors]    = useState<Record<string,string>>({})
  const [processing,setProcessing]= useState(false)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const contentRef= useRef<HTMLDivElement>(null)

  // ── Real order amounts derived from shared order state ───────────────────
  //  These flow into the pay button label and Paystack's `amount` param.
  const deliveryCost = order.customer.delivery === 'express' ? 3500
    : order.customer.delivery === 'pickup' ? 0 : 1500
  const realTotal    = order.subtotal - order.discount + deliveryCost
  const realTotalFmt = `₦${realTotal.toLocaleString()}`

  // Mock Paystack reference — same format Paystack uses (only used as a
  // fallback / for the non-card manual methods below; the card path lets
  // Paystack generate + return its own reference).
  function generateMockRef(): string {
    return `DRP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
  }

  // Garment snapshot in the exact shape Design/Order models expect —
  // built once here so both Paystack metadata and any future direct
  // order write use identical field names.
  const garmentSnapshot = {
    id:    activeGarment?.garment?.id    ?? '',
    name:  activeGarment?.garment?.name  ?? '',
    color: {
      label:  activeGarment?.color?.label  ?? '',
      hex:    activeGarment?.color?.hex    ?? '',
      filter: activeGarment?.color?.filter ?? '',
    },
    size:  activeGarment?.size ?? order.size,
  }

  // Tab switch
  function switchTab(tab:'card'|'other') {
    if(tab===payTab) return
    gsap.to(contentRef.current,{opacity:0,x:tab==='other'?-16:16,duration:0.18,ease:'power2.in',
      onComplete:()=>{
        setPayTab(tab)
        setPayMethod(tab==='card'?'card':'transfer')
        gsap.fromTo(contentRef.current,{opacity:0,x:tab==='other'?16:-16},{opacity:1,x:0,duration:0.25,ease:'power2.out'})
      }})
  }

  // Active tab indicator slide
  const tabIndicatorRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    gsap.to(tabIndicatorRef.current,{x:payTab==='other'?'100%':0,duration:0.3,ease:'power2.out'})
  },[payTab])

  // ── Card payments — handled entirely by Paystack's own iframe. We only
  //  ever pass transaction params in; card number/CVV never touch our state
  //  or our form. See index.html for the <script src="paystack.co/v1/inline.js">
  //  tag this depends on. ────────────────────────────────────────────────────
  async function payWithPaystackCard() {
    const PaystackPop = (window as any).PaystackPop
    if (!PaystackPop) {
      setErrors({ pay: 'Paystack script not loaded — please refresh and try again.' })
      return
    }
    if (!order.customer.email) {
      setErrors({ pay: 'Customer email is required. Go back to step 2 and fill in your details.' })
      return
    }

    setProcessing(true)
    setErrors({})

    try {
      // ── Step 1: Initialize on backend (secret key never leaves the server) ──
      const initRes = await fetch('/api/payments/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    order.customer.email,
          amount:   realTotal * 100,  // kobo
          currency: 'NGN',
          channels: ['card'],
          // Everything createOrder() needs — webhook uses this if the
          // browser closes before confirmOrder() fires
          metadata: {
            clerkId,
            designId,
            garment:        garmentSnapshot,
            quantities:     order.qty,
            sizeColorSplit: order.sizeColorSplit,
            totalPieces:    order.totalPcs,
            customer:       order.customer,
            notes:          order.notes,
          },
        }),
      })

      if (!initRes.ok) {
        const body = await initRes.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Could not initialize payment. Please try again.')
      }

      const { access_code } = await initRes.json()

      // ── Step 2: Open v2 popup with access_code ───────────────────────────
      // resumeTransaction handles ALL card validation — wrong CVV, expired
      // card, insufficient funds, 3DS — entirely inside Paystack's iframe.
      // onSuccess only fires after the full card flow succeeds.
      const popup = new PaystackPop()
      popup.resumeTransaction(access_code, {
        onSuccess: (transaction: any) => {
          confirmOrder(transaction.reference)
        },
        onCancel: () => {
          setProcessing(false)
        },
        onError: (err: any) => {
          setProcessing(false)
          setErrors({ pay: err?.message ?? 'Payment failed. Please check your card details and try again.' })
        },
      })
    } catch (err: any) {
      setProcessing(false)
      setErrors({ pay: err?.message ?? 'Something went wrong. Please try again.' })
    }
  }

  // POSTs the reference to our own backend, which re-verifies with Paystack
  // server-side (never trusting the client) and writes the Order document.
  // Idempotent — the webhook may beat this request to it, and vice versa;
  // createOrder() no-ops on a duplicate paystackRef either way.
  async function confirmOrder(reference: string) {
    try {
      const res = await fetch('/api/orders/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reference }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Confirm failed (${res.status})`)
      }
      const { order: savedOrder } = await res.json()
      setProcessing(false)
      onNext({
        reference,
        channel: 'card',
        authorization: savedOrder?.authorization, // set by the confirm route from Paystack's verify response
      })
    } catch (err) {
      setProcessing(false)
      setErrors({ pay: 'Payment went through, but we couldn\u2019t confirm your order. Contact support with your reference: ' + reference })
    }
  }

  function handlePay() {
    setErrors({})
    if (payTab === 'card') { payWithPaystackCard(); return }

    // Bank transfer / cash-on-delivery — no live gateway charge happens in
    // the app for these, so there's nothing to "validate" here. This still
    // needs a real backend order write with status:'pending_manual' rather
    // than firing the paid-confirmation screen — leaving the mock ref here
    // as a placeholder until that endpoint exists.
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onNext({ reference: generateMockRef(), channel: payMethod })
    }, 1200)
  }

  return (
    <div className="ofo-step-content">
      {/* Processing overlay */}
      {processing && (
        <div className="ofo-processing">
          <ProcessingAnim/>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Order recap — so user sees exactly what they're paying for ── */}
        <div className="ofo-card flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2EFEA] flex items-center justify-center text-lg flex-shrink-0">
              🧾
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0E0E0E]">
                {order.totalPcs} pcs · {order.customer.delivery === 'express' ? 'Express' : order.customer.delivery === 'pickup' ? 'Self-collect' : 'Standard'} delivery
              </div>
              <div className="text-xs text-[#888]">
                {order.customer.firstName} {order.customer.lastName} · {order.customer.city}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display text-lg font-black text-[#0E0E0E]">{realTotalFmt}</div>
            {order.promoOk && (
              <div className="text-[0.65rem] text-[#2ECC71] font-semibold">DRIP10 applied</div>
            )}
          </div>
        </div>
        <div ref={tabBarRef} className="ofo-tab-bar">
          {/* Sliding pill indicator */}
          <div ref={tabIndicatorRef} className="ofo-tab-indicator"/>
          <button onClick={()=>switchTab('card')}
            className={`ofo-tab-btn ${payTab==='card'?'ofo-tab-active':''}`}>
            💳 Card Details
          </button>
          <button onClick={()=>switchTab('other')}
            className={`ofo-tab-btn ${payTab==='other'?'ofo-tab-active':''}`}>
            🏦 Other Methods
          </button>
        </div>

        <div ref={contentRef}>

          {/* ── CARD TAB ── */}
          {payTab==='card' && (
            <div className="ofo-card space-y-3 text-center py-10">
              <div className="text-3xl mb-1">🔒</div>
              <h3 className="ofo-card-title">Pay by Card</h3>
              <p className="text-sm text-[#888] max-w-xs mx-auto leading-relaxed">
                You'll enter your card number, expiry and CVV on Paystack's own secure
                screen — Driply never sees or stores your card details.
              </p>
              {errors.pay && <p className="text-xs text-[#FF5B3A] pt-1">{errors.pay}</p>}
            </div>
          )}

          {/* ── OTHER METHODS TAB ── */}
          {payTab==='other' && (
            <div className="ofo-card space-y-3">
              <h3 className="ofo-card-title mb-1">Select Payment Method</h3>
              {([
                {id:'transfer',icon:'🏦',label:'Bank Transfer',    sub:'Direct bank payment'},
                {id:'cod',     icon:'💵',label:'Cash on Delivery',  sub:'Pay on receipt'},
              ] as const).map(m=>(
                <button key={m.id} onClick={()=>{ setPayMethod(m.id);
                  gsap.fromTo(`#ofo-pay-${m.id}`,{scale:0.96},{scale:1,duration:0.4,ease:'elastic-soft'}) }}
                  id={`ofo-pay-${m.id}`}
                  className={`ofo-pay-opt ${payMethod===m.id?'ofo-pay-opt-active':''}`}>
                  <span className="text-xl w-8 text-center">{m.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-[#888]">{m.sub}</div>
                  </div>
                  <div className={`ofo-radio ${payMethod===m.id?'ofo-radio-active':''}`}>
                    {payMethod===m.id&&<div className="ofo-radio-dot"/>}
                  </div>
                </button>
              ))}
              {payMethod==='transfer'&&(
                <div className="mt-3 bg-[#F8F5EF] rounded-2xl p-4 space-y-2 border border-black/[0.05]">
                  {[['Bank','Access Bank'],['Account Name','Driply Ltd'],['Account No','0123456789']].map(([k,v])=>(
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-[#888]">{k}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                  <p className="text-xs text-[#FF5B3A] pt-1">Use your order ID as payment reference.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pay CTA */}
        <button id="ofo-pay-btn" onClick={handlePay}
          className="ofo-pay-final-btn w-full relative overflow-hidden"
          onMouseEnter={e=>{
            gsap.to(e.currentTarget,{scale:1.02,duration:0.2,ease:'power2.out'})
            gsap.fromTo('.ofo-btn-shimmer',{x:'-100%'},{x:'200%',duration:0.7,ease:'power1.inOut'})
          }}
          onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.2})}>
          <span className="relative z-10">
            {payTab==='card' ? `Pay ${realTotalFmt} securely →`
              : payMethod==='cod' ? 'Place order — pay on delivery →'
              : `Confirm order — I'll transfer ${realTotalFmt} →`}
          </span>
          <div className="ofo-btn-shimmer"/>
        </button>
        <p className="text-xs text-center text-[#bbb]">🔒 256-bit SSL encryption · We never store card details</p>
      </div>
    </div>
  )
}

// ─── Processing animation ─────────────────────────────────────────────────────
function ProcessingAnim() {
  const [step, setStep] = useState(0)
  const STEPS = ['Verifying card…','Authorising…','Confirming with bank…','Placing order…']
  useEffect(()=>{
    if(step>=STEPS.length) return
    const id=setTimeout(()=>setStep(s=>s+1),900)
    return()=>clearTimeout(id)
  },[step])
  useGSAP(()=>{
    gsap.to('.ofo-proc-ring',{rotate:360,duration:1,ease:'none',repeat:-1,transformOrigin:'50% 50%'})
    gsap.to('.ofo-proc-glow',{scale:1.2,opacity:0.5,duration:1,ease:'sine.inOut',yoyo:true,repeat:-1})
  })
  return (
    <div className="ofo-proc-wrap">
      <div className="relative flex items-center justify-center mb-6">
        <div className="ofo-proc-glow"/>
        <svg width="80" height="80" viewBox="0 0 80 80" className="ofo-proc-ring">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#E8E5E0" strokeWidth="3"/>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#C8F135" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="55 159"/>
        </svg>
        <span className="absolute font-display text-xl font-black text-[#0E0E0E]">₦</span>
      </div>
      <div className="font-display text-lg font-black text-[#0E0E0E] mb-1 text-center">Processing payment</div>
      <div className="text-sm text-[#888] text-center mb-5">Don't close this window</div>
      <div className="space-y-2">
        {STEPS.map((s,i)=>(
          <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i<step?'text-[#0E0E0E]':i===step?'text-[#0E0E0E] font-medium':'text-[#ccc]'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${i<step?'bg-[#C8F135]':i===step?'bg-[#0E0E0E] animate-pulse':'bg-[#E8E5E0]'}`}/>
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Paid-with card preview ───────────────────────────────────────────────────
//  The idle-tilt 3D card from the old payment form, repurposed as a receipt
//  visual: shown on the confirmation screen after a successful *card*
//  payment, filled only with what Paystack's authorization object safely
//  returns (last4 + brand — never the PAN, never the CVV). No live input,
//  so the CVV-flip interaction from the old form doesn't carry over.
function PaidCardPreview({ name, last4, brand }: { name: string; last4?: string; brand?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    gsap.to(cardRef.current, {
      rotationY: 4, rotationX: -3, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1,
      transformPerspective: 900, transformStyle: 'preserve-3d',
    })
  }, { scope: cardRef })

  return (
    <div className="flex justify-center mb-5" style={{ perspective: '1000px' }}>
      <div ref={cardRef} className="ofo-card-3d">
        <div className="ofo-card-face ofo-card-front">
          <div className="ofo-card-shine" />
          <div className="ofo-card-chip" />
          <div className="ofo-card-number">
            <span className="ofo-num-group">••••</span>
            <span className="ofo-num-group">••••</span>
            <span className="ofo-num-group">••••</span>
            <span className="ofo-num-group">{last4 ?? '••••'}</span>
          </div>
          <div className="ofo-card-bottom">
            <div>
              <div className="ofo-card-meta-lbl">Card Holder</div>
              <div className="ofo-card-meta-val">{name.toUpperCase() || 'CARDHOLDER'}</div>
            </div>
            <div>
              <div className="ofo-card-meta-lbl">Paid With</div>
              <div className="ofo-card-meta-val">{brand ?? 'Card'}</div>
            </div>
            <div className="flex items-center relative" style={{ width: 48, height: 30 }}>
              <div className="rounded-full absolute" style={{ width: 28, height: 28, background: '#EB001B', left: 0 }} />
              <div className="rounded-full absolute" style={{ width: 28, height: 28, background: '#F79E1B', left: 16, opacity: 0.88 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — CONFIRMED  (celebration, inline)
// ─────────────────────────────────────────────────────────────────────────────
function StepConfirmed({ onClose, designId }:{ onClose:()=>void; designId:string }) {
  const heroRef   = useRef<HTMLDivElement>(null)
  const confRef   = useRef<HTMLDivElement>(null)

  // ── Read session — single source of truth after payment ─────────────────
  const ctx = (() => {
    try {
      const raw = sessionStorage.getItem('driply_order')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()

  const orderId       = ctx?.paymentRef ?? `DRP-${designId.slice(0,6).toUpperCase()}`
  const customerName  = ctx?.order?.customer?.firstName ?? null
  const garmentName   = ctx?.garment?.garment?.name ?? 'custom order'
  const totalPieces   = ctx?.totalPieces ?? null
  const totalPaid     = ctx?.total ? `₦${ctx.total.toLocaleString()}` : null
  const deliveryType  = ctx?.order?.customer?.delivery === 'express' ? 'Express (3–5 days)'
    : ctx?.order?.customer?.delivery === 'pickup' ? 'Self-collect'
    : 'Standard (7–14 days)'
  const city          = ctx?.order?.customer?.city ?? null

  // Only card payments carry a masked `authorization` block — bank
  // transfer / cash-on-delivery have no card to show a receipt for.
  const paidByCard     = ctx?.channel === 'card' && !!ctx?.authorization
  const fullName       = [ctx?.order?.customer?.firstName, ctx?.order?.customer?.lastName].filter(Boolean).join(' ')

  const STEPS_TL  = [
    {dot:'#C8F135',label:'Order confirmed',  sub:'Right now'},
    {dot:'#3ABAFF',label:'Production begins',sub:'Within 48hrs'},
    {dot:'#FF5B3A',label:'Quality check',    sub:'Day 7–10'},
    {dot:'#7B5BFF',label:'Shipped to you',   sub:'Day 10–14'},
  ]

  useGSAP(()=>{
    const tl=gsap.timeline()
    // Check circle
    tl.from('[data-conf="check"]',{scale:0,opacity:0,duration:0.6,ease:'back.out(2.5)'})
    // Stroke draw
    tl.fromTo('[data-conf="path"]',{strokeDashoffset:120},{strokeDashoffset:0,duration:0.5,ease:'power3.out'},'-=0.3')
    // Rings pulse
    tl.call(()=>{
      document.querySelectorAll('[data-conf="ring"]').forEach((r,i)=>{
        gsap.fromTo(r,{scale:1,opacity:0.7},{scale:3.2,opacity:0,duration:1.1,delay:i*0.2,ease:'power2.out',repeat:-1,repeatDelay:3})
      })
    })
    // Confetti
    tl.call(()=>fireConfetti(confRef.current,100),[],'<0.1')
    // Headline letters
    tl.from('[data-conf="letter"]',{y:50,opacity:0,scale:0.4,rotation:()=>rnd(-20,20),stagger:0.05,duration:0.45,ease:'back.out(2)'},'-=0.3')
    // Screen flash
    tl.fromTo('[data-conf="flash"]',{opacity:0.5},{opacity:0,duration:0.4,ease:'power2.out'},'-=0.1')
    // Order ref + cards
    tl.from('[data-conf="ref"]',{y:20,opacity:0,duration:0.4,ease:'back.out(1.8)'},'+=0.1')
    tl.from('[data-conf="tlstep"]',{x:-20,opacity:0,stagger:0.08,duration:0.35,ease:'back.out(1.6)'},'-=0.2')
    tl.from('[data-conf="btn"]',{y:24,opacity:0,scale:0.85,stagger:0.1,duration:0.45,ease:'elastic-soft'},'-=0.1')
    // Second confetti wave
    tl.call(()=>fireConfetti(confRef.current,55,0.65),[],'+=0.3')
  },{scope:heroRef})

  function fireConfetti(container:HTMLElement|null, count=100, scale=1) {
    if(!container) return
    const vw=window.innerWidth, vh=window.innerHeight
    Array.from({length:count}).forEach((_,i)=>{
      const el=document.createElement('div')
      const color=BRAND[i%BRAND.length]
      const sz=rnd(5,12)*scale
      const isCirc=i%4===2, isRib=i%4===3
      const angle=rnd(0,Math.PI*2), speed=rnd(130,400)*scale
      Object.assign(el.style,{
        position:'fixed',left:`${vw*0.5}px`,top:`${vh*0.4}px`,
        width:`${isRib?sz*0.4:sz}px`,height:`${isRib?sz*3:sz}px`,
        background:color,borderRadius:isCirc?'50%':'2px',
        zIndex:'1000',pointerEvents:'none',opacity:'1',
      })
      container.appendChild(el)
      gsap.to(el,{x:Math.cos(angle)*speed,y:Math.sin(angle)*speed-rnd(60,180)+vh*0.55,
        rotation:rnd(-720,720),opacity:0,duration:rnd(1.8,3.2),ease:'power1.in',
        onComplete:()=>el.remove()})
    })
  }

  return (
    <div ref={heroRef} className="ofo-step-content">
      {/* Flash */}
      <div data-conf="flash" className="fixed inset-0 bg-white pointer-events-none z-10 opacity-0"/>
      {/* Confetti container */}
      <div ref={confRef} className="fixed inset-0 pointer-events-none z-20"/>

      <div className="max-w-lg mx-auto text-center pt-4">
        {/* Checkmark */}
        <div className="relative flex items-center justify-center mb-6" style={{width:120,height:120,margin:'0 auto 1.5rem'}}>
          {[0,1,2].map(i=>(
            <div key={i} data-conf="ring" className="absolute rounded-full border-[2.5px] border-[#C8F135]"
              style={{inset:-i*12-4,opacity:0}}/>
          ))}
          <div data-conf="check" className="absolute inset-0 rounded-full bg-[#C8F135]"
            style={{boxShadow:'0 0 40px rgba(200,241,53,0.45)'}}/>
          <svg viewBox="0 0 52 52" width="60" height="60" style={{position:'relative',zIndex:2}}>
            <path data-conf="path" d="M14 26 L22 35 L38 18" fill="none"
              stroke="#0E0E0E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="120" strokeDashoffset="120"/>
          </svg>
        </div>

        {/* Headline */}
        <div className="ofo-conf-headline mb-3">
          {'YOUR DRIP IS ON THE WAY!'.split('').map((ch,i)=>(
            <span key={i} data-conf="letter" className="inline-block">
              {ch===' '?'\u00A0':ch}
            </span>
          ))}
        </div>
        <p className="text-sm font-light text-[#666] leading-relaxed mb-6">
          {customerName ? `${customerName}, your ` : 'Your '}
          {garmentName} is confirmed and heading to production.
          <br/>We'll keep you updated every step of the way.
        </p>

        {/* Paid-with card receipt — only for card payments */}
        {paidByCard && (
          <PaidCardPreview
            name={fullName}
            last4={ctx.authorization.last4}
            brand={ctx.authorization.brand}
          />
        )}

        {/* Order ref */}
        <div data-conf="ref" className="ofo-ref-box mb-4">
          <div className="ofo-ref-shimmer"/>
          <div className="ofo-tag mb-1">Order Reference</div>
          <div className="font-display text-2xl font-black tracking-[0.14em] text-[#0E0E0E]">{orderId}</div>
        </div>

        {/* Real order details strip — only shown when session data exists */}
        {ctx && (
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            {totalPieces && (
              <div className="text-center">
                <div className="text-xs text-[#aaa] uppercase tracking-wide">Pieces</div>
                <div className="text-sm font-bold text-[#0E0E0E]">{totalPieces}</div>
              </div>
            )}
            {totalPaid && (
              <div className="text-center">
                <div className="text-xs text-[#aaa] uppercase tracking-wide">Paid</div>
                <div className="text-sm font-bold text-[#0E0E0E]">{totalPaid}</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-xs text-[#aaa] uppercase tracking-wide">Delivery</div>
              <div className="text-sm font-bold text-[#0E0E0E]">{deliveryType}</div>
            </div>
            {city && (
              <div className="text-center">
                <div className="text-xs text-[#aaa] uppercase tracking-wide">To</div>
                <div className="text-sm font-bold text-[#0E0E0E]">{city}</div>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="ofo-conf-tl mb-8">
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-white/10 rounded-full"/>
            <div className="space-y-4">
              {STEPS_TL.map((s,i)=>(
                <div key={i} data-conf="tlstep" className="flex items-start gap-4">
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 relative z-10"
                    style={{background:s.dot,boxShadow:`0 0 8px ${s.dot}88`}}/>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white/90">{s.label}</div>
                    <div className="text-xs text-white/35">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button data-conf="btn" onClick={onClose}
            className="ofo-cta-btn"
            onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.04,duration:0.2,ease:'power2.out'})}
            onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.3,ease:'elastic.out(1.1,0.5)'})}>
            Design Another →
          </button>
          <button data-conf="btn" onClick={()=>{
              navigator.clipboard?.writeText(orderId)
              gsap.fromTo('.ofo-ref-box',
                {scale:1.04,borderColor:'#C8F135'},
                {scale:1,borderColor:'rgba(14,14,14,0.08)',duration:0.6,ease:'power2.out'})
            }}
            className="ofo-ghost-btn"
            onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.04,duration:0.2})}
            onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.3,ease:'elastic.out(1.1,0.5)'})}>
            Copy Order ID
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN OVERLAY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function OrderFlowOverlay({ open, onClose, designId, clerkId, activeGarment, designPreviewUrl }: OrderFlowOverlayProps & { activeGarment?: any; designPreviewUrl?: string }) {
  const [step,  setStep]  = useState(0)
  const [order, setOrder] = useState<OrderData>(DEFAULT_ORDER)

  const overlayRef   = useRef<HTMLDivElement>(null)
  const panelRef     = useRef<HTMLDivElement>(null)
  const stepPanelRef = useRef<HTMLDivElement>(null)
  const backdropRef  = useRef<HTMLDivElement>(null)

  // ── Write session on payment confirm ────────────────────────────────────────
  //  Called by StepPayment's onNext before advancing to StepConfirmed.
  //  This is the single source of truth that order-confirmed reads from.
  //  NOTE: this is client-side optimistic state for the celebration screen —
  //  it is NOT what should back /my-designs. That needs the order written to
  //  your DB after server-side verification (see StepPayment's TODOs).
  function writeSession(result: PaymentResult) {
    try {
      sessionStorage.setItem('driply_order', JSON.stringify({
        designId,
        garment:        activeGarment,
        order: {
          ...order,
          colorLabel:     COLORS[order.colorIdx]?.label,
          sizeColorSplit: order.sizeColorSplit,
        },
        totalPieces:    order.totalPcs,
        total:          order.total,
        paymentRef:     result.reference,
        channel:        result.channel,       // 'card' | 'transfer' | 'cod'
        authorization:  result.authorization, // masked card metadata — card only
        isPaid:         result.channel === 'card', // transfer/cod are pending until manually reconciled
        createdAt:      new Date().toISOString(),
      }))
    } catch { /* storage full — non-critical */ }
  }

  // ── Open / close animation ──────────────────────────────────────────────
  useEffect(()=>{
    if(!panelRef.current||!backdropRef.current) return
    if(open) {
      document.body.style.overflow='hidden'
      gsap.set(panelRef.current,{y:'100%',opacity:1})
      const tl=gsap.timeline()
      tl.to(backdropRef.current,{opacity:1,duration:0.3,ease:'power2.out'})
      tl.to(panelRef.current,{y:'0%',duration:0.55,ease:'power4.out'},'-=0.2')
    } else {
      const tl=gsap.timeline({onComplete:()=>{
        document.body.style.overflow=''
        setStep(0)
      }})
      tl.to(panelRef.current,{y:'100%',duration:0.4,ease:'power3.in'})
      tl.to(backdropRef.current,{opacity:0,duration:0.25},'-=0.15')
    }
  },[open])

  // ── Step transition ─────────────────────────────────────────────────────
  function goToStep(next:number) {
    if(!stepPanelRef.current) { setStep(next); return }
    const dir = next > step ? -1 : 1  // -1 = slide left (forward), 1 = right (back)
    gsap.to(stepPanelRef.current,{
      x: dir * -60, opacity:0, duration:0.22, ease:'power2.in',
      onComplete:()=>{
        setStep(next)
        gsap.fromTo(stepPanelRef.current,
          {x: dir * 60, opacity:0},
          {x:0, opacity:1, duration:0.32, ease:'power3.out'})
      }
    })
  }

  function handleBack() {
    if(step===0) {
      // Close overlay — returns to dashboard
      onClose()
    } else {
      goToStep(step-1)
    }
  }

  if(!open && !panelRef.current) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ opacity: 0, pointerEvents: open ? 'auto' : 'none' }}   // ← this line
      />

      {/* Panel */}
      <div ref={panelRef}
        className="absolute inset-x-0 bottom-0 bg-[#F8F5EF] rounded-t-[28px] flex flex-col"
        style={{height:'94vh', transform:'translateY(100%)'}}>

        {/* ── Panel header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[0.06]">
          <button onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-[#888] hover:text-[#0E0E0E] transition-colors"
            onMouseEnter={e=>gsap.to(e.currentTarget,{x:-3,duration:0.2,ease:'power2.out'})}
            onMouseLeave={e=>gsap.to(e.currentTarget,{x:0, duration:0.2})}>
            ← {step===0?'Back to Studio':'Back'}
          </button>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            {STEP_LABELS.map((lbl,i)=>(
              <div key={i} className="flex items-center gap-1.5">
                <div className={`ofo-step-dot ${i===step?'ofo-step-dot-active':i<step?'ofo-step-dot-done':'ofo-step-dot-future'}`}>
                  {i<step?'✓':i+1}
                </div>
                <span className={`text-[0.65rem] hidden sm:block font-medium ${i===step?'text-[#0E0E0E]':'text-[#ccc]'}`}>
                  {lbl}
                </span>
                {i<STEP_LABELS.length-1&&(
                  <div className={`w-8 h-0.5 mx-1 rounded-full ${i<step?'bg-[#C8F135]':'bg-[#E8E5E0]'}`}/>
                )}
              </div>
            ))}
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-[#888] hover:bg-black/10 hover:text-[#0E0E0E] transition-all text-sm"
            onMouseEnter={e=>gsap.to(e.currentTarget,{rotate:90,duration:0.25,ease:'power2.out'})}
            onMouseLeave={e=>gsap.to(e.currentTarget,{rotate:0, duration:0.25})}>
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex-shrink-0 h-1 bg-[#E8E5E0] relative">
          <div className="h-full bg-[#C8F135] rounded-full transition-all duration-500"
            style={{width:`${((step+1)/STEP_LABELS.length)*100}%`}}/>
        </div>

        {/* ── Step content ── */}
        <div ref={stepPanelRef} className="flex-1 overflow-y-auto">
          {step===0 && <StepPreview onNext={()=>goToStep(1)} order={order} setOrder={setOrder} activeGarment={activeGarment} designPreviewUrl={designPreviewUrl}/>}
          {step===1 && <StepInfo    onNext={()=>goToStep(2)} order={order} setOrder={setOrder}/>}
          {step===2 && <StepPayment onNext={(result)=>{ writeSession(result); goToStep(3) }} order={order} designId={designId} clerkId={clerkId} activeGarment={activeGarment}/>}
          {step===3 && <StepConfirmed onClose={onClose} designId={designId}/>}
        </div>
      </div>
    </div>
  )
}