// ============================================================
//  DRIPLY — Landing Page v2  (Ambitious Edition)
//  app/routes/index.tsx
//
//  New installs required:
//    npm install lenis gsap @gsap/react
//    (gsap + @gsap/react may already be installed)
//
//  GSAP plugins used (all free with core):
//    ScrollTrigger, CustomEase, ScrollToPlugin
//
//  Design direction:
//    — Dark cinematic hero (black) contrasting warm-white body
//    — Massive editorial typography with masked char reveals
//    — Cursor-tracked parallax on hero shirt
//    — Lenis smooth scroll throughout
//    — Pinned scroll process section
//    — Horizontal garment scroll gallery
//    — Velocity-reactive marquee
//    — Clip-path section wipe reveals
//    — Magnetic interactive elements
//    — Custom blended cursor (desktop only)
// ============================================================

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/tanstack-react-start'
import { useGSAP } from '@gsap/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import gsap from 'gsap'
import CustomEase    from 'gsap/CustomEase'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis         from 'lenis'
import {
  useCallback, useEffect,useMemo, 
  useRef, useState, type RefObject,
} from 'react'
import video from "../../public/demo.mp4"

gsap.registerPlugin(useGSAP, ScrollTrigger,  ScrollToPlugin)

// CustomEase.create('power4.out',   'M0,0 C0.16,1 0.3,1 1,1')
// CustomEase.create('power4.in',    'M0,0 C0.7,0 0.84,0 1,1')
// CustomEase.create('circ.out',   'M0,0 C0,0 0.1,1 1,1')
// CustomEase.create('driply-pop', 'M0,0 C0.14,0 0.27,0.3 0.38,0.7 0.52,1.05 0.6,1.08 0.72,1.12 0.8,1 1,1')

export const Route = createFileRoute('/')({
  component: DriplyLanding,
})

// ─── Data ────────────────────────────────────────────────────────────────────
const SWATCHES = [
  { bg: '#2ECEFF', collar: '#1AAFEA', label: 'Sky Blue' },
  { bg: '#FF5B3A', collar: '#c94424', label: 'Coral'    },
  { bg: '#C8F135', collar: '#9BBF10', label: 'Lime'     },
  { bg: '#0E0E0E', collar: '#050505', label: 'Ink'      },
  { bg: '#F0EDE8', collar: '#d8d4cf', label: 'Cream'    },
  { bg: '#7B5BFF', collar: '#5a3fdd', label: 'Violet'   },
  { bg: '#FFD60A', collar: '#d4b000', label: 'Amber'    },
]

const STATS = [
  { end: 6,   suffix: '',   label: 'Garment types'     },
  { end: 10,  suffix:'+',   label: 'Color options'     },
  { end: 24,  suffix: 'h',  label: 'Quote turnaround'  },
]

const PROCESS_STEPS = [
  {
    num: '01', label: 'Pick & Design',
    body: 'Choose any garment from our catalog. Drop into the studio — add text, logos, embroidery, prints. Whatever\'s in your head.',
    accent: '#C8F135',
  },
  {
    num: '02', label: 'Customize & Confirm',
    body: 'Set quantities, color splits, size breakdowns. Review the full order summary before a single stitch is committed.',
    accent: '#3ABAFF',
  },
  {
    num: '03', label: 'Produced & Shipped',
    body: 'Production partners handle the rest. Quality-checked, individually packed, delivered to your door. No middlemen.',
    accent: '#FF5B3A',
  },
]

const FEATURES = [
  {
    icon: '🖋', title: 'Text & Typography', color: '#0E0E0E', text: 'white',
    body: 'Add text in any style — size, weight, color, spacing all controlled directly on the canvas.',
    chips: ['Syne', 'DM Sans', 'Bebas Neue', 'Playfair'],
  },
  {
    icon: '🎨', title: 'Color System', color: '#C8F135', text: '#0E0E0E',
    body: 'Pick from a curated palette or enter any hex code. Color previews update live on the garment.',
    chips: [],
  },
  {
    icon: '🖼', title: 'Image Upload', color: '#F2EFEA', text: '#0E0E0E',
    body: 'Upload your own PNG or image. Place, resize, rotate — your graphic on any garment in seconds.',
    chips: [],
  },
  {
    icon: '✦', title: 'Live Preview', color: '#FF5B3A', text: 'white',
    body: 'Every edit reflects on the garment mockup instantly. Front, back — switch views without leaving the canvas.',
    chips: [],
  },
  {
    icon: '⚡', title: 'Bulk Orders', color: '#7B5BFF', text: 'white',
    body: 'Size runs, color splits, quantity breakdowns — all configured before checkout. Built for teams and brands.',
    chips: [],
  },
]

const GARMENTS = [
  { emoji: '👒', name: 'Face Caps',    sub: '6-panel, snapback',   bg: '#E8F4FF' },
  { emoji: '👕', name: 'T-Shirts',     sub: 'Crew, V-neck, OS',    bg: '#FFF0E8' },
  { emoji: '🧥', name: 'Hoodies',      sub: 'Pullover, zip, coach', bg: '#F0FFE8' },
  { emoji: '🧣', name: 'Scarves',      sub: 'Woven & printed',     bg: '#FFF8E8' },
  { emoji: '👔', name: 'Polo Shirts',  sub: 'Classic & slim',      bg: '#F0E8FF' },
  { emoji: '🩳', name: 'Shorts',       sub: 'Athletic & casual',   bg: '#E8FFF4' },
  { emoji: '👜', name: 'Tote Bags',    sub: 'Cotton & canvas',     bg: '#FFE8F0' },
  { emoji: '🎽', name: 'Jerseys',      sub: 'Sports & club',       bg: '#E8F0FF' },
]

// ── Who Driply is built for — replaces fabricated testimonials ───────────────
const USE_CASES = [
  {
    icon:  '🏢',
    title: 'Startups & Teams',
    body:  'Branded merch for your crew without the agency middleman. Design it, set quantities, done.',
    color: '#C8F135',
    text:  '#0E0E0E',
  },
  {
    icon:  '👟',
    title: 'Streetwear Brands',
    body:  'Drop-ready custom pieces. Color splits, size runs, consistent quality — every season.',
    color: '#3ABAFF',
    text:  '#0E0E0E',
  },
  {
    icon:  '🏆',
    title: 'Sports Clubs',
    body:  'Jerseys, training gear, club kits. Bulk quantities with per-player size breakdowns in one order.',
    color: '#FF5B3A',
    text:  'white',
  },
  {
    icon:  '🎓',
    title: 'Schools & Events',
    body:  'Class hoodies, event tees, conference merch. Fast turnaround, minimum fuss.',
    color: '#7B5BFF',
    text:  'white',
  },
]

const MARQUEE_ITEMS = [
  'Face Caps','T-Shirts','Hoodies','Scarves','Trousers',
  'Jackets','Jerseys','Beanies','Polo Shirts','Tote Bags',
]

const rnd = (a: number, b: number) => Math.random() * (b - a) + a

// ─── Smooth scroll setup ──────────────────────────────────────────────────────
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })

    lenis.on('scroll', ScrollTrigger.update)

    // Store the ticker reference so cleanup can remove the exact same function
    const ticker = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    // Intercept every same-page anchor click on the document — this handles
    // the nav links, the scroll-indicator, the CTA buttons, anything with
    // href="#section", without touching any of those components.
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href === '#') return   // bare # does nothing
      e.preventDefault()
      lenis.scrollTo(href, {
        duration: 1.2,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),   // quartic ease-out
      })
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(ticker)                           // same ref — actually removes it
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])
}


// VideoModal component (above the Hero function)

// VIDEO URL OPTIONS (fill in whichever you use):
//
//   Cloudinary (recommended — consistent with the Driply asset strategy):
//     const VIDEO_URL = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto/driply-demo.mp4`
//
//   YouTube embed (best for bandwidth — no CDN cost):
//     <iframe src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" .../>
//     Replace the <video> tag below with the iframe version if you go this route.
//
//   Direct file (simplest for a short screencap):
//     const VIDEO_URL = '/demo.mp4'   // put it in /public
//
// Start with whichever is quickest to get up — the modal works with any source.



const VIDEO_URL = video   // ← replace with your actual video URL

function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef    = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)

  // Entrance
  useEffect(() => {
    if (!open || !overlayRef.current || !cardRef.current) return
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    )
    gsap.fromTo(cardRef.current,
      { scale: 0.9, opacity: 0, y: 24 },
      { scale: 1,   opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }
    )
    videoRef.current?.play().catch(() => {})
  }, [open])

  // Exit — animate out then call onClose
  function handleClose() {
    if (!overlayRef.current || !cardRef.current) { onClose(); return }
    videoRef.current?.pause()
    gsap.to(cardRef.current,    { scale: 0.9, opacity: 0, y: 16, duration: 0.25, ease: 'power2.in' })
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: onClose,
    })
  }

  // Escape key
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}    // prevent backdrop close when clicking card
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#0E0E0E',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', fontSize: '1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
        >
          ✕
        </button>

        {/* Video — 16:9 aspect ratio */}
        <div style={{ aspectRatio: '16/9', background: '#000' }}>
          <video
            ref={videoRef}
            src={VIDEO_URL}
            controls
            playsInline
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
          />
        </div>

        {/* Optional caption strip */}
        <div style={{
          padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#C8F135',
          }}>
            ▶ Driply Studio
          </span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            See how to design your first garment in under 2 minutes
          </span>
        </div>
      </div>
    </div>
  )
}


// ─── Custom cursor (desktop only) ─────────────────────────────────────────────
//
//  Rendered via ReactDOM.createPortal directly onto document.body so that
//  Clerk's modal portal (which also mounts on body and creates its own
//  stacking context) can never clip or bury the cursor elements.
//  z-index is set to 2147483647 (max safe integer) for the same reason.
//
import { createPortal } from 'react-dom'

function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Wait for document to be available (SSR safety)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (window.matchMedia('(hover: none)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.4, ease: 'power2.out' })
    }

    const onEnter = () => {
      gsap.to(ring, { scale: 2.5, opacity: 0.4, duration: 0.3, ease: 'power2.out' })
      gsap.to(dot,  { scale: 0,   duration: 0.2 })
    }
    const onLeave = () => {
      gsap.to(ring, { scale: 1,   opacity: 0.7, duration: 0.3, ease: 'power2.out' })
      gsap.to(dot,  { scale: 1,   duration: 0.2 })
    }

    // Use event delegation on document rather than attaching to every element.
    // This means hover effects work on Clerk modal buttons too — no need to
    // re-query the DOM when new elements (like modals) mount dynamically.
    const onDocEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('a,button,[data-cursor="pointer"]')) onEnter()
    }
    const onDocLeave = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('a,button,[data-cursor="pointer"]')) onLeave()
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover',  onDocEnter)
    document.addEventListener('mouseout',   onDocLeave)

    return () => {
      window.removeEventListener('mousemove',   onMove)
      document.removeEventListener('mouseover',  onDocEnter)
      document.removeEventListener('mouseout',   onDocLeave)
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>,
    document.body,
  )
}

// ─── ShirtSVG ─────────────────────────────────────────────────────────────────
//
// Fix: foreground elements (dashed border, text labels, logo badge) now adapt
// automatically to the shirt color using a perceived-luminance check.
//
// The W3C luminance formula weights RGB channels by how the human eye
// perceives brightness — green contributes the most (~59%), red next (~30%),
// blue least (~11%). A value above 0.5 means the color reads as "light" and
// needs dark overlays; below 0.5 it reads as "dark" and needs light overlays.
//
// Affected elements:
//   • Dashed print-area border  → was rgba(255,255,255,0.55), now adaptive
//   • "YOUR / DESIGN / HERE"    → was rgba(255,255,255,0.92), now adaptive
//   • Logo badge circle fill    → was rgba(255,255,255,0.12), now adaptive
//   • Logo "D" character        → was white, now adaptive
//
// No changes to the collar, sleeve shadows (rgba(0,0,0,0.08)) — those work
// on any background since they're very subtle dark overlays.
// ─────────────────────────────────────────────────────────────────────────────

/** Perceived luminance of a hex color. Returns 0 (dark) – 1 (light). */
function getLuminance(hex: string): number {
  // Strip the leading #, handle 3- and 6-digit formats
  const raw = hex.replace('#', '')
  const full = raw.length === 3
    ? raw.split('').map(c => c + c).join('')
    : raw

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Returns the appropriate foreground color for overlaid text/borders,
 * given the shirt's background hex value.
 *
 * Returns an object so callers can apply different opacities per element
 * without recomputing each time.
 */
function getForeground(bg: string): { base: string; isLight: boolean } {
  const light = getLuminance(bg) > 0.5
  return { base: light ? '#0E0E0E' : '#FFFFFF', isLight: light }
}

// ─────────────────────────────────────────────────────────────────────────────
// Replace the existing ShirtSVG function in index.tsx with this version.
// The prop signature is identical — no call sites need changing.
// ─────────────────────────────────────────────────────────────────────────────
function ShirtSVG({ color = '#2ECEFF', collar = '#1AAFEA', size = 640 }) {
  const { base, isLight } = getForeground(color)

  // Foreground tokens — all derived from a single luminance check
  const fg = {
    // Dashed border around the print area
    border: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)',
    // "YOUR / DESIGN / HERE" text labels
    text:   isLight ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.92)',
    // Small logo badge circle
    badge:  isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)',
    // "D" character inside the badge
    logoD:  base,
  }

  return (
    <svg
      viewBox="0 0 340 400"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.35))', transition: 'all 0.4s ease' }}
    >
      {/* ── Body ── */}
      <path
        d="M85,90 L30,130 L60,160 L80,148 L80,350 L260,350 L260,148 L280,160 L310,130 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 Z"
        fill={color}
        style={{ transition: 'fill 0.4s ease' }}
      />

      {/* ── Collar ── */}
      <path
        d="M155,90 C155,90 163,108 170,115 C177,108 185,90 185,90 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 L140,75 C145,82 155,90 155,90 Z"
        fill={collar}
        style={{ transition: 'fill 0.4s ease' }}
      />

      {/* ── Sleeve shadows (always dark — subtle on any bg) ── */}
      <path d="M30,130 L60,160 L80,148 L80,130 Z"   fill="rgba(0,0,0,0.08)" />
      <path d="M310,130 L280,160 L260,148 L260,130 Z" fill="rgba(0,0,0,0.08)" />

      {/* ── Print-area dashed border — contrast-aware ── */}
      <rect
        x="118" y="165" width="104" height="82" rx="6"
        fill="none"
        stroke={fg.border}
        strokeWidth="1.5"
        strokeDasharray="6,4"
        style={{ transition: 'stroke 0.4s ease' }}
      />

      {/* ── Text labels — contrast-aware ── */}
      <text
        x="170" y="198" textAnchor="middle"
        fontFamily="Syne,sans-serif" fontWeight="800" fontSize="13"
        fill={fg.text} letterSpacing="2"
        style={{ transition: 'fill 0.4s ease' }}
      >
        YOUR
      </text>
      <text
        x="170" y="216" textAnchor="middle"
        fontFamily="Syne,sans-serif" fontWeight="800" fontSize="13"
        fill={fg.text} letterSpacing="2"
        style={{ transition: 'fill 0.4s ease' }}
      >
        DESIGN
      </text>
      <text
        x="170" y="234" textAnchor="middle"
        fontFamily="Syne,sans-serif" fontWeight="800" fontSize="13"
        fill={fg.text} letterSpacing="2"
        style={{ transition: 'fill 0.4s ease' }}
      >
        HERE
      </text>

      {/* ── Logo badge — contrast-aware ── */}
      <circle cx="232" cy="176" r="13" fill={fg.badge} style={{ transition: 'fill 0.4s ease' }} />
      <text
        x="232" y="180" textAnchor="middle"
        fontFamily="Syne,sans-serif" fontWeight="800" fontSize="8"
        fill={fg.logoD}
        style={{ transition: 'fill 0.4s ease' }}
      >
        D
      </text>
    </svg>
  )
}


// ─── Split text into char spans ───────────────────────────────────────────────
function SplitChars({ text, className = '', wrapClass = '' }: {
  text: string; className?: string; wrapClass?: string
}) {
  return (
    <span className={wrapClass}>
      {text.split('').map((ch, i) => (
        <span key={i} className={`split-char ${className}`} style={{ display: 'inline-block' }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav() {
  const { isSignedIn, isLoaded } = useUser()
  const navRef   = useRef<HTMLElement>(null)
  const logoRef  = useRef<HTMLAnchorElement>(null)
  const [dark, setDark] = useState(true) // starts on dark hero

  // ── Mobile menu ──────────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef    = useRef<HTMLDivElement>(null)
  const backdropRef= useRef<HTMLDivElement>(null)
  const barsRef    = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!mobileOpen) return

    // Same iOS-safe scroll lock used in GarmentSelector/OrderFlowOverlay —
    // overflow:hidden alone is a no-op on iOS Safari.
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.position = ''
      document.body.style.top      = ''
      document.body.style.width    = ''
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  // Menu open/close animation, and hamburger → X morph
  useGSAP(() => {
    if (!menuRef.current || !backdropRef.current) return
    const bars = barsRef.current

    if (mobileOpen) {
      gsap.set(menuRef.current, { display: 'flex' })
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      gsap.fromTo(menuRef.current,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }
      )
      gsap.from('.mnav-link-item', {
        y: -12, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out', delay: 0.1,
      })
      gsap.to(bars[0], { rotate: 45,  y: 6,  duration: 0.25, ease: 'power2.out' })
      gsap.to(bars[1], { opacity: 0,          duration: 0.15 })
      gsap.to(bars[2], { rotate: -45, y: -6, duration: 0.25, ease: 'power2.out' })
    } else {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 })
      gsap.to(menuRef.current, {
        y: -16, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => gsap.set(menuRef.current, { display: 'none' }),
      })
      gsap.to(bars[0], { rotate: 0, y: 0, duration: 0.25, ease: 'power2.out' })
      gsap.to(bars[1], { opacity: 1,       duration: 0.2, delay: 0.1 })
      gsap.to(bars[2], { rotate: 0, y: 0, duration: 0.25, ease: 'power2.out' })
    }
  }, { dependencies: [mobileOpen], scope: navRef })

  useGSAP(() => {
    // Stagger links in on mount
    gsap.from('.nav-link-item', {
      y: -20, opacity: 0, stagger: 0.07, duration: 0.6,
      ease: 'power4.out', delay: 0.8,
    })
    gsap.from(logoRef.current, {
      y: -20, opacity: 0, duration: 0.6, ease: 'power4.out', delay: 0.6,
    })
    gsap.from('.nav-cta-wrap > *', {
      y: -20, opacity: 0, stagger: 0.06, duration: 0.6,
      ease: 'power4.out', delay: 1,
    })

    // Morph nav on scroll past hero
    requestAnimationFrame(() => {
      const NAV_HEIGHT = navRef.current?.offsetHeight ?? 72

      document.querySelectorAll<HTMLElement>('[data-nav-bg]').forEach(section => {
        const bg      = section.dataset.navBg ?? '#0E0E0E'
        const isDark  = getLuminance(bg) <= 0.5   // dark bg → need white text

        ScrollTrigger.create({
          trigger:    section,
          start:      `top ${NAV_HEIGHT}px`,   // when section top enters nav zone
          end:        `bottom ${NAV_HEIGHT}px`, // when section bottom leaves nav zone
          onEnter:     () => setDark(isDark),
          onEnterBack: () => setDark(isDark),
        })
      })
    })
  }, { scope: navRef })

  return (
    <nav ref={navRef}
      className={`nav-shell ${dark ? 'nav-dark' : 'nav-light'}`}
      style={{ transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease' }}
    >
      <a
        ref={logoRef}
        href="#"
        className={`nav-logo ${dark ? 'text-white' : 'text-[#0E0E0E]'}`}
        style={dark ? {} : { textShadow: 'none' }}
      >
        Drip<span style={{ color: '#FF5B3A' }}>ly</span>
      </a>

      <ul className="hidden lg:flex items-center gap-10 list-none m-0 p-0">
        {[['How it works','#process'],['Features','#features'],['Products','#garments'],['My Designs','/my-designs']].map(([l,h])=>(
          <li key={h} className="nav-link-item">
            <a href={h}
              className={`nav-link-text ${dark ? 'text-white/60 hover:text-white' : 'text-[#3A3A3A] hover:text-[#0E0E0E]'}`}
              onMouseEnter={e=>gsap.to(e.currentTarget,{y:-2,duration:0.2,ease:'power2.out'})}
              onMouseLeave={e=>gsap.to(e.currentTarget,{y:0,duration:0.3,ease:'driply-pop'})}>
              {l}
            </a>
          </li>
        ))}
      </ul>

      {/* Hamburger — mobile/tablet only. Below lg:, the <ul> above is hidden
          with nothing replacing it currently — this is that replacement. */}
      <button
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(o => !o)}
        className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-11 h-11 -mr-2 z-50 relative"
      >
        {[0,1,2].map(i => (
          <span key={i}
            ref={el => { barsRef.current[i] = el }}
            className="block w-6 h-[2px] rounded-full"
            style={{ background: dark ? 'white' : '#0E0E0E', transition: 'background 0.3s' }}
          />
        ))}
      </button>

      <div className="nav-cta-wrap hidden lg:flex items-center gap-3 justify-end">
        {/* isLoaded guard prevents the button tree from mounting/unmounting
            mid-interaction while Clerk resolves the auth state on first render */}
        {isSignedIn ? (
          <>
            <Link to="/dashboard" className="btn-nav-primary">
              Go to Studio →
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width:        36,
                    height:       36,
                    borderRadius: '10px',
                    border:       '2px solid rgba(255,91,58,0.5)',
                    transition:   'border-color 0.2s',
                  },
                  avatarBoxHover: {
                    borderColor: '#FF5B3A',
                  },
                  userButtonPopoverCard: {
                    borderRadius:    '16px',
                    background:      '#1A1A1A',
                    border:          '1px solid rgba(255,255,255,0.08)',
                    boxShadow:       '0 16px 48px rgba(0,0,0,0.5)',
                  },
                  userButtonPopoverActions: {
                    background: 'transparent',
                  },
                  userButtonPopoverActionButton: {
                    color:        'rgba(255,255,255,0.7)',
                    borderRadius: '10px',
                    fontSize:     '0.85rem',
                  },
                  userButtonPopoverActionButtonArrow: {
                    color: 'rgba(255,255,255,0.3)',
                  },
                  userButtonPopoverActionButtonText: {
                    color: 'rgba(255,255,255,0.7)',
                  },
                  userButtonPopoverFooter: {
                    display: 'none',  // hides "Secured by Clerk" footer
                  },
                },
                variables: {
                  colorPrimary:    '#FF5B3A',
                  colorBackground: '#1A1A1A',
                  colorText:       '#F8F5EF',
                  borderRadius:    '10px',
                },
              }}
            />
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className={`btn-nav-ghost ${dark?'border-white/20 text-white/70 hover:border-white hover:text-white':'border-black/20 text-[#0E0E0E] hover:border-black'}`}>
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-nav-primary">Start designing →</button>
            </SignUpButton>
          </>
        )}
      </div>

      {/* ── Mobile menu — backdrop + dropdown panel ── */}
      <div
        ref={backdropRef}
        onClick={() => setMobileOpen(false)}
        style={{ display: 'none', opacity: 0 }}
        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <div
        ref={menuRef}
        style={{ display: 'none', background: '#0E0E0E' }}
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex-col pt-24 pb-8 px-6 gap-1 border-b border-white/10"
      >
        {[['How it works','#process'],['Features','#features'],['Products','#garments'],['My Designs','/my-designs']].map(([l,h])=>(
          <a key={h} href={h}
            onClick={() => setMobileOpen(false)}
            className="mnav-link-item text-white/75 hover:text-white text-base font-medium py-3.5 border-b border-white/[0.06]"
          >
            {l}
          </a>
        ))}

        <div className="mnav-link-item flex flex-col gap-3 mt-6">
          {isSignedIn ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-nav-primary text-center">
                Go to Studio →
              </Link>
              <div className="flex justify-center pt-1">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: { width: 40, height: 40, borderRadius: '10px', border: '2px solid rgba(255,91,58,0.5)' },
                      userButtonPopoverCard: { borderRadius: '16px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' },
                      userButtonPopoverActionButton: { color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '0.85rem' },
                      userButtonPopoverActionButtonText: { color: 'rgba(255,255,255,0.7)' },
                      userButtonPopoverFooter: { display: 'none' },
                    },
                    variables: { colorPrimary: '#FF5B3A', colorBackground: '#1A1A1A', colorText: '#F8F5EF', borderRadius: '10px' },
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button onClick={() => setMobileOpen(false)} className="btn-nav-ghost border-white/20 text-white/70 hover:border-white hover:text-white w-full">
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button onClick={() => setMobileOpen(false)} className="btn-nav-primary w-full">Start designing →</button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const shirtRef   = useRef<HTMLDivElement>(null)
  const [activeColor, setActiveColor] = useState(0)
  const active = SWATCHES[activeColor]
  const [demoOpen, setDemoOpen] = useState(false)

  // Mouse parallax on shirt
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!shirtRef.current) return
      const cx = window.innerWidth  / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx
      const dy = (e.clientY - cy) / cy
      gsap.to(shirtRef.current, {
        x:         dx * 28,
        y:         dy * 16,
        rotationY: dx * 8,
        rotationX: -dy * 4,
        duration:  0.8,
        ease:      'power2.out',
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 })

    // Clip-mask char reveal on headline
    tl.from('.hero-char', {
      yPercent:  110,
      opacity:   0,
      stagger:   0.025,
      duration:  0.85,
      ease:      'power4.out',
    })

    // Sub-text
    tl.from('.hero-sub-text', {
      y:        24,
      opacity:  0,
      duration: 0.7,
      ease:     'power4.out',
    }, '-=0.5')

    // CTAs
    tl.from('.hero-cta-item', {
      y:       20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease:    'power4.out',
    }, '-=0.5')

    // Shirt bounce in
    tl.from(shirtRef.current, {
      y:        80,
      opacity:  0,
      scale:    0.85,
      duration: 0.8,
      ease:     'driply-pop',
    }, 0.4)

    // Floating badges pop
    tl.from('.hero-badge', {
      scale:   0,
      opacity: 0,
      stagger: 0.12,
      duration: 0.5,
      ease:    'back.out(2)',
    }, '-=0.4')

    // Swatch strip
    tl.from('.hero-swatch-strip', {
      y:       20,
      opacity: 0,
      duration: 0.5,
      ease:    'power4.out',
    }, '-=0.35')

    // Stats count up on scroll
    STATS.forEach((stat, i) => {
      const el = document.querySelector(`[data-stat="${i}"]`)
      if (!el) return
      const obj = { val: 0 }
      ScrollTrigger.create({
        trigger: el,
        start:   'top 85%',
        once:    true,
        onEnter: () => {
          gsap.to(obj, {
            val:       stat.end,
            duration:  1.4,
            ease:      'power2.out',
            onUpdate:  () => { el.textContent = Math.round(obj.val) + stat.suffix },
          })
        },
      })
    })

    // Scroll indicator bobs
    gsap.to('.scroll-indicator', {
      y:       10,
      duration: 1.2,
      ease:    'sine.inOut',
      yoyo:    true,
      repeat:  -1,
    })

    // Fade scroll indicator out on scroll
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   '20% top',
      onEnter: () => gsap.to('.scroll-indicator', { opacity: 0, y: 20, duration: 0.4 }),
      onLeaveBack: () => gsap.to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.4 }),
    })

    // Parallax blobs
    gsap.to('.hero-blob-1', { y: -120, ease: 'none',
      scrollTrigger: { trigger: sectionRef.current, scrub: 2, start: 'top top', end: 'bottom top' } })
    gsap.to('.hero-blob-2', { y: -60, ease: 'none',
      scrollTrigger: { trigger: sectionRef.current, scrub: 1.5, start: 'top top', end: 'bottom top' } })

  }, { scope: sectionRef })

  function handleSwatchClick(i: number) {
    if (i === activeColor) return
    gsap.to(shirtRef.current, {
      rotationY: 90, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        setActiveColor(i)
        gsap.fromTo(shirtRef.current, { rotationY: -90 }, { rotationY: 0, duration: 0.25, ease: 'power2.out' })
      }
    })
  }

  return (
    <section ref={sectionRef} id="hero"
      data-nav-bg="#0E0E0E"
      className="hero-section"
      style={{ background: '#0E0E0E', minHeight: '100vh' }}>

      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Background blobs */}
      <div className="hero-blob hero-blob-1"
        style={{ background: 'rgba(200,241,53,0.12)', width: 600, height: 600, top: '-10%', right: '-8%' }}/>
      <div className="hero-blob hero-blob-2"
        style={{ background: 'rgba(255,91,58,0.08)', width: 400, height: 400, bottom: '5%', left: '-5%' }}/>
      <div className="hero-blob"
        style={{ background: 'rgba(58,186,255,0.07)', width: 350, height: 350, top: '30%', left: '40%' }}/>

      <div className="hero-inner">
        {/* Left — copy */}
        <div className="hero-left-col">

          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot"/>
            Design Studio — Now Live
          </div>

          {/* Masked headline */}
          <h1 className="hero-h1">
            <div className="hero-line-wrap">
              <span className="hero-line-mask">
                {'DESIGN'.split('').map((c,i)=>(
                  <span key={i} className="hero-char" style={{display:'inline-block',color:'white'}}>
                    {c}
                  </span>
                ))}
              </span>
            </div>
            <div className="hero-line-wrap">
              <span className="hero-line-mask">
                {'YOUR'.split('').map((c,i)=>(
                  <span key={i} className="hero-char" style={{display:'inline-block',color:'white'}}>
                    {c}
                  </span>
                ))}
              </span>
            </div>
            <div className="hero-line-wrap">
              <span className="hero-line-mask">
                {'DRIP.'.split('').map((c,i)=>(
                  <span key={i} className="hero-char hero-char-outline"
                    style={{display:'inline-block'}}>
                    {c}
                  </span>
                ))}
              </span>
            </div>
          </h1>

          <p className="hero-sub-text">
            Visualize custom embroidery and prints on any garment.<br/>
            Design it here, order the real thing.
          </p>

          <div className="hero-ctas">
            <div className="hero-cta-item">
              <SignUpButton mode="modal">
                <button className="btn-hero-primary"
                  onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.04,duration:0.2,ease:'power2.out'})}
                  onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.3,ease:'driply-pop'})}>
                  Start for free →
                </button>
              </SignUpButton>
            </div>
            <div className="hero-cta-item">
              <button
                className="btn-hero-ghost"
                onClick={() => setDemoOpen(true)}
                onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.04, duration: 0.2, ease: 'power2.out' })}
                onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'driply-pop' })}
              >
                <span className="play-circle">▶</span>
                Watch demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {STATS.map((s, i) => (
              <div key={i} className="hero-cta-item">
                <div className="stat-number" data-stat={i}>
                  0{s.suffix}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — shirt */}
        <div className="hero-right-col">
          <div
            ref={shirtRef}
            className="hero-shirt-wrap"
            style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
          >
            <ShirtSVG color={active.bg} collar={active.collar} size={580}/>
          </div>

          {/* Floating badges */}
          <div className="hero-badge badge-pos-tl">
            <span className="badge-dot" style={{background:'#3ABAFF'}}/>
            Embroidery ready
          </div>
          <div className="hero-badge badge-pos-br">
            <span className="badge-dot" style={{background:'#FF5B3A'}}/>
            Print-on-demand
          </div>
          <div className="hero-badge badge-pos-ml"
            style={{background:'#C8F135',color:'#0E0E0E',fontWeight:600}}>
            ✦ 14 colors
          </div>

          {/* Swatch strip */}
          <div className="hero-swatch-strip">
            {SWATCHES.map((sw, i) => (
              <button key={i} onClick={() => handleSwatchClick(i)}
                className="hero-swatch"
                style={{
                  background:  sw.bg,
                  borderColor: i===activeColor ? 'white' : 'transparent',
                  transform:   i===activeColor ? 'scale(1.3)' : 'scale(1)',
                  boxShadow:   i===activeColor ? '0 0 0 2px #0E0E0E, 0 0 0 4px white' : 'none',
                }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-ind-track">
          <div className="scroll-ind-ball"/>
        </div>
        <span>Scroll</span>
      </div>

    <VideoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  )
}

// ─── MARQUEE (velocity-reactive) ─────────────────────────────────────────────
function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let speed = 1
    let current = 0
    let target  = 0
    let lastY   = 0
    let raf: number

    const onScroll = () => {
      const delta = window.scrollY - lastY
      lastY = window.scrollY
      target = Math.min(Math.abs(delta) * 0.5, 8)
    }

    function loop() {
      current += (target - current) * 0.1
      target  *= 0.92
      speed    = 1 + current

      if (trackRef.current) {
        const currentX = parseFloat(gsap.getProperty(trackRef.current, 'x') as string) || 0
        const newX = currentX - speed
        const resetAt = -(trackRef.current.scrollWidth / 2)
        gsap.set(trackRef.current, { x: newX <= resetAt ? 0 : newX })
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('scroll', onScroll)
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div className="marquee-section" data-nav-bg="#0E0E0E" style={{ background: '#0E0E0E', overflow: 'hidden', padding: '1rem 0',  borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div ref={trackRef} className="marquee-inner">
        {doubled.map((item, i) => (
          <span key={i} className="marquee-chip">
            {item} <span className="marquee-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── PROCESS (pinned scroll steps) ────────────────────────────────────────────
function Process() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    // The crossfade animation requires every .process-step-panel to be
    // position:absolute (all stacked in the same spot, faded between).
    // Mobile CSS correctly moves them to position:static (normal stacked
    // flow). Those two models are mutually exclusive — disable the whole
    // scroll-jacking interaction below 768px and let all steps render
    // as a normal visible list instead.
    if (window.matchMedia('(max-width: 768px)').matches) return

    const steps = gsap.utils.toArray<HTMLElement>('.process-step-panel')
    const n     = steps.length
    let   current = 0

    // Initial states — only step 0 visible
    steps.forEach((step, i) => {
      if (i > 0) gsap.set(step, { opacity: 0, x: 60 })
    })

    function goToStep(next: number, dir: 1 | -1) {
      if (next === current) return

      gsap.to(steps[current], {
        x: dir * -60, opacity: 0, duration: 0.4, ease: 'power2.in',
      })
      gsap.fromTo(steps[next],
        { x: dir * 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.15 }
      )

      const numEl = document.querySelector('.process-big-num')
      if (numEl) numEl.textContent = `0${next + 1}`

      gsap.to('.process-progress-fill', {
        height: `${((next + 1) / n) * 100}%`, duration: 0.45, ease: 'power2.out',
      })
      gsap.to('.process-accent-bar', {
        background: PROCESS_STEPS[next].accent, duration: 0.35,
      })

      current = next
    }

    // Single pin — (n-1) viewport heights of scroll distance
    ScrollTrigger.create({
      trigger:    sectionRef.current,
      start:      'top top',
      end:        () => `+=${(n - 1) * window.innerHeight}`,
      pin:        true,
      pinSpacing: true,
      onUpdate: (self) => {
        const next = Math.min(Math.floor(self.progress * n), n - 1)
        const dir: 1 | -1 = next > current ? 1 : -1
        goToStep(next, dir)
      },
    })
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} data-nav-bg="#F8F5EF" id="process" className="process-section">

      {/* Left column — number + progress */}
      <div className="process-left">
        <div className="process-eyebrow">The process</div>
        <div className="process-big-num">01</div>
        <div className="process-progress-track">
          <div className="process-progress-fill" style={{ height: `${1/PROCESS_STEPS.length*100}%` }}/>
        </div>
        <div className="process-accent-bar" style={{ background: PROCESS_STEPS[0].accent }}/>
        <div className="process-step-count">{PROCESS_STEPS.length} steps to your drip</div>
      </div>

      {/* Right column — step panels */}
      <div className="process-right">
        <div className="process-overline">From idea to doorstep</div>
        {PROCESS_STEPS.map((s, i) => (
          <div key={i} className="process-step-panel">
            <div className="process-step-num" style={{ color: s.accent }}>{s.num}</div>
            <h3 className="process-step-title">{s.label}</h3>
            <p className="process-step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    // Heading reveal
    gsap.from('.features-heading-line', {
      yPercent:  100,
      opacity:   0,
      stagger:   0.08,
      duration:  0.8,
      ease:      'power4.out',
      scrollTrigger: {
        trigger: '.features-heading-wrap',
        start:   'top 80%',
        once:    true,
      },
    })

    // Each feature card clips in
    gsap.utils.toArray<HTMLElement>('.feat-clip-card').forEach((card, i) => {
      gsap.fromTo(card,
        { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity:  1,
          duration: 0.8,
          delay:    i * 0.08,
          ease:     'power4.out',
          scrollTrigger: {
            trigger:  card,
            start:    'top 85%',
            once:     true,
          },
        }
      )
    })

  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} id="features" data-nav-bg="#F8F5EF" className="features-section">

      <div className="features-heading-wrap">
        <div className="sect-eyebrow">What you get</div>
        <h2 className="features-h2">
          <div className="features-heading-line-wrap" style={{ overflow: 'hidden' }}>
            <span className="features-heading-line">A full creative</span>
          </div>
          <div className="features-heading-line-wrap" style={{ overflow: 'hidden' }}>
            <span className="features-heading-line">toolkit.</span>
          </div>
        </h2>
        <p className="features-sub">
          Every tool you need to go from blank canvas to production-ready artwork.
          No design experience required.
        </p>
      </div>

      <div className="features-grid">
        {/* Dark tall */}
        <div className="feat-clip-card feat-tall" style={{ background: '#0E0E0E', gridRow: 'span 2' }}>
          <span className="feat-icon">{FEATURES[0].icon}</span>
          <h3 className="feat-title" style={{ color: 'white' }}>{FEATURES[0].title}</h3>
          <p className="feat-body" style={{ color: 'rgba(255,255,255,0.6)' }}>{FEATURES[0].body}</p>
          <div className="feat-chips">
            {FEATURES[0].chips.map((c, i) => (
              <span key={i} className={`feat-chip ${i===0?'feat-chip-lime':'feat-chip-dark'}`}>{c}</span>
            ))}
          </div>
        </div>

        {FEATURES.slice(1).map((f, i) => (
          <div key={i} className={`feat-clip-card ${i===3?'feat-wide':''}`}
            style={{ background: f.color }}
            onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.02,duration:0.25,ease:'power2.out'})}
            onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.25})}>
            <span className="feat-icon">{f.icon}</span>
            <h3 className="feat-title" style={{ color: f.text }}>{f.title}</h3>
            <p className="feat-body" style={{ color: f.text==='white'?'rgba(255,255,255,0.75)':'rgba(14,14,14,0.7)' }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── GARMENTS (horizontal scroll gallery) ────────────────────────────────────
function Garments() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef   = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const track  = trackRef.current
    if (!track) return
    const totalW = track.scrollWidth
    const viewW  = track.parentElement!.offsetWidth
    const dist   = totalW - viewW

    // Heading reveal
    gsap.from('.garments-heading .gh-char', {
      yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
    })

    // Pin and horizontally translate
    gsap.to(track, {
      x:    -dist,
      ease: 'none',
      scrollTrigger: {
        trigger:    sectionRef.current,
        start:      'top top',
        end:        `+=${dist}`,
        pin:        true,
        pinSpacing: true,
        scrub:      1.2,
        anticipatePin: 1,
      },
    })

    // Each card tilts slightly on the scroll
    gsap.utils.toArray<HTMLElement>('.garment-hcard').forEach((card, i) => {
      gsap.fromTo(card,
        { rotationY: -8 },
        {
          rotationY: 4,
          ease: 'none',
          scrollTrigger: {
            trigger:    sectionRef.current,
            start:      'top top',
            end:        `+=${dist}`,
            scrub:      1,
          },
        }
      )
    })

  }, { scope: sectionRef })

  const title = 'Every garment.'

  return (
    <section ref={sectionRef} id="garments" data-nav-bg="#F8F5EF"
      style={{ background: '#F8F5EF', overflow: 'hidden' }}>

      <div className="px-6 sm:px-10 lg:px-16" className="rp-pad-lg" style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
        <div className="sect-eyebrow">What you can design on</div>
        <div className="garments-heading" style={{ overflow: 'hidden' }}>
          <h2 className="garments-h2">
            {title.split('').map((c, i) => (
              <span key={i} className="gh-char" style={{ display: 'inline-block' }}>
                {c === ' ' ? '\u00A0' : c}
              </span>
            ))}
            <br/>
            <span style={{ WebkitTextStroke: '2px #0E0E0E', color: 'transparent' }}>
              One place.
            </span>
          </h2>
        </div>
      </div>

      <div style={{ overflow: 'hidden', paddingBottom: '4rem' }}>
        <div ref={trackRef} className="rp-pad-lg"
          style={{ display: 'flex', gap: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem', width: 'max-content' }}>
          {GARMENTS.map((g, i) => (
            <div key={i} className="garment-hcard"
              style={{ width: 260, aspectRatio: '3/4', borderRadius: 20,
                overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer' }}
              onMouseEnter={e=>{
                gsap.to(e.currentTarget,{y:-8,scale:1.03,duration:0.3,ease:'power2.out'})
                gsap.to(e.currentTarget.querySelector('.g-label'),{y:0,duration:0.3,ease:'power2.out'})
              }}
              onMouseLeave={e=>{
                gsap.to(e.currentTarget,{y:0,scale:1,duration:0.3,ease:'power2.out'})
              }}>
              <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'6rem',background:g.bg }}>
                {g.emoji}
              </div>
              <div className="g-label" style={{
                position:'absolute',bottom:0,left:0,right:0,
                padding:'2rem 1.25rem 1.25rem',
                background:'linear-gradient(transparent,rgba(0,0,0,0.65))',
              }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.05rem',color:'white' }}>{g.name}</div>
                <div style={{ fontSize:'0.73rem',color:'rgba(255,255,255,0.6)',marginTop:2 }}>{g.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── DASHBOARD PREVIEW (clip-path wipe reveal) ────────────────────────────────
function DashPreview() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    // Heading
    gsap.from('.dash-preview-heading .dph-char', {
      yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
    })

    // Clip wipe on the preview card
    gsap.fromTo('.dash-preview-card',
      { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity:  1,
        duration: 1.1,
        ease:     'power4.out',
        scrollTrigger: {
          trigger: '.dash-preview-card',
          start:   'top 80%',
          once:    true,
        },
      }
    )

    // Panel items stagger
    gsap.from('.dp-panel-item', {
      x: -20, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power4.out',
      scrollTrigger: { trigger: '.dash-preview-card', start: 'top 70%', once: true },
    })

  }, { scope: sectionRef })

  const heading = 'The dashboard'

  return (
    <section ref={sectionRef} data-nav-bg="#F8F5EF" className="rp-section" style={{ background: '#F8F5EF' }}>
      <div className="sect-eyebrow">Design studio</div>
      <div className="dash-preview-heading" style={{ overflow: 'hidden', marginBottom: '0.75rem' }}>
        <h2 className="dash-h2">
          {heading.split('').map((c,i)=>(
            <span key={i} className="dph-char" style={{display:'inline-block'}}>
              {c===' '?'\u00A0':c}
            </span>
          ))}
          <br/>
          <span style={{ color: '#C8F135', WebkitTextStroke: 'unset' }}>is your canvas.</span>
        </h2>
      </div>
      <p style={{ fontSize:'1.05rem',fontWeight:300,color:'#3A3A3A',maxWidth:520,lineHeight:1.65,marginBottom:'3.5rem' }}>
        Intuitive. Powerful. Built for first-timers and pros. Everything a click away.
      </p>

      <div className="dash-preview-card" style={{
        background:'#1A1A1B',borderRadius:28,
        overflowX:'auto', overflowY:'hidden',
        border:'1px solid rgba(255,255,255,0.05)',
        boxShadow:'0 40px 100px rgba(0,0,0,0.3)',
      }}>
        <div style={{ minWidth: 620 }}>
        {/* Mac-style topbar */}
        <div style={{ background:'#252525',padding:'0.85rem 1.5rem',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex',gap:6 }}>
            {['#FF5B5B','#FFD60A','#2ACB5A'].map((c,i)=>(
              <div key={i} style={{ width:12,height:12,borderRadius:'50%',background:c }}/>
            ))}
          </div>
          <span style={{ fontFamily:'Syne,sans-serif',fontSize:'0.72rem',fontWeight:600,
            letterSpacing:'0.05em',color:'rgba(255,255,255,0.3)' }}>
            Driply Design Studio — My Collection v2
          </span>
          <div style={{ display:'flex',gap:8 }}>
            <span style={{ background:'rgba(255,255,255,0.08)',borderRadius:6,padding:'0.3rem 0.75rem',
              fontSize:'0.7rem',color:'rgba(255,255,255,0.45)' }}>Preview</span>
            <span style={{ background:'#C8F135',borderRadius:6,padding:'0.3rem 0.75rem',
              fontSize:'0.7rem',fontWeight:700,color:'#0E0E0E' }}>Save</span>
          </div>
        </div>

        {/* Body: left / canvas / right */}
        <div style={{ display:'grid',gridTemplateColumns:'200px 1fr 220px',height:440 }}>
          {/* Left panel */}
          <div style={{ background:'#1E1E1E',borderRight:'1px solid rgba(255,255,255,0.05)',
            padding:'1.25rem 1rem',overflow:'hidden' }}>
            <p style={{ fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',
              color:'rgba(255,255,255,0.28)',marginBottom:'0.65rem' }}>Layers</p>
            {[
              { icon:'🔤', label:'Text — "YOUR DESIGN"', active:true },
              { icon:'🖼', label:'Logo import' },
              { icon:'⬤', label:'Shape layer'  },
              { icon:'✦', label:'Embroidery zone' },
            ].map((el, i)=>(
              <div key={i} className="dp-panel-item" style={{
                display:'flex',alignItems:'center',gap:'0.55rem',
                padding:'0.45rem 0.6rem',borderRadius:8,marginBottom:2,cursor:'pointer',
                background: el.active?'rgba(200,241,53,0.1)':'transparent',
                color:      el.active?'#C8F135':'rgba(255,255,255,0.5)',
                border:     el.active?'1px solid rgba(200,241,53,0.18)':'1px solid transparent',
                fontSize:'0.75rem',
              }}>
                <span>{el.icon}</span>
                <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                  fontWeight:el.active?500:400 }}>{el.label}</span>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div style={{ background:'#2A2A2A',display:'flex',alignItems:'center',
            justifyContent:'center',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',inset:0,
              backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize:'28px 28px',pointerEvents:'none' }}/>
            <div style={{ position:'relative',zIndex:2,display:'flex',flexDirection:'column',
              alignItems:'center',animation:'gentleFloat 6s ease-in-out infinite' }}>
              <svg viewBox="0 0 200 220" width="170" style={{ filter:'drop-shadow(0 12px 32px rgba(0,0,0,0.5))' }}>
                <path d="M50,52 L18,76 L36,92 L46,86 L46,200 L154,200 L154,86 L164,92 L182,76 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#C8F135"/>
                <path d="M92,52 C92,52 97,64 100,68 C103,64 108,52 108,52 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#9BBF10"/>
                <rect x="72" y="95" width="56" height="44" rx="3" fill="none"
                  stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="4,3"/>
                <text x="100" y="112" textAnchor="middle" fontFamily="Syne,sans-serif"
                  fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">YOUR</text>
                <text x="100" y="122" textAnchor="middle" fontFamily="Syne,sans-serif"
                  fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">DESIGN</text>
              </svg>
              <span style={{ fontSize:'0.68rem',fontFamily:'Syne,sans-serif',fontWeight:700,
                textTransform:'uppercase',letterSpacing:'0.08em',
                border:'1px dashed rgba(200,241,53,0.4)',color:'rgba(200,241,53,0.7)',
                padding:'0.3rem 0.7rem',borderRadius:4,marginTop:4 }}>
                Text Layer · Active
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ background:'#1E1E1E',borderLeft:'1px solid rgba(255,255,255,0.05)',
            padding:'1.25rem 1rem',overflow:'hidden' }}>
            {[
              { label:'Text Color', content: (
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  {['#0E0E0E','#C8F135','#FF5B3A','#3ABAFF','#7B5BFF','white'].map((c,i)=>(
                    <div key={i} style={{ width:20,height:20,borderRadius:'50%',background:c,cursor:'pointer',
                      border: i===0?'2px solid white':'2px solid transparent',
                      boxShadow: i===0?'0 0 0 2px #1E1E1E, 0 0 0 3.5px white':'none',
                      transform: i===0?'scale(1.15)':'scale(1)' }}/>
                  ))}
                </div>
              )},
              { label:'Font Size · 14px', content: (
                <div style={{ height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,position:'relative' }}>
                  <div style={{ height:'100%',width:'40%',background:'#C8F135',borderRadius:2 }}/>
                  <div style={{ position:'absolute',top:'50%',transform:'translate(-50%,-50%)',
                    width:14,height:14,background:'white',borderRadius:'50%',
                    boxShadow:'0 2px 6px rgba(0,0,0,0.4)',left:'40%' }}/>
                </div>
              )},
              { label:'Font Family', content: (
                <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                  {['Syne','Bebas','DM Sans'].map((f,i)=>(
                    <span key={i} style={{ fontSize:'0.68rem',borderRadius:6,padding:'0.3rem 0.6rem',
                      background: i===0?'rgba(200,241,53,0.15)':'rgba(255,255,255,0.07)',
                      color:      i===0?'#C8F135':'rgba(255,255,255,0.5)',
                      border:     i===0?'1px solid rgba(200,241,53,0.3)':'none' }}>{f}</span>
                  ))}
                </div>
              )},
            ].map((prop, i)=>(
              <div key={i} className="dp-panel-item" style={{ marginBottom:'1rem' }}>
                <p style={{ fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',
                  color:'rgba(255,255,255,0.28)',marginBottom:'0.5rem' }}>{prop.label}</p>
                {prop.content}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}

// ─── WHO IT'S FOR ──────────────────────────────────────────────────────────────
function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.from('.wif-heading .wif-char', {
      yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
    })
    gsap.from('.wif-card', {
      y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.wif-grid', start: 'top 82%', once: true },
    })
  }, { scope: sectionRef })

  const heading = 'Built for your kind of order.'

  return (
    <section ref={sectionRef} data-nav-bg="#0E0E0E" className="rp-section" style={{ background: '#0E0E0E' }}>
      <div className="sect-eyebrow" style={{ color: 'rgba(255,255,255,0.35)' }}>Who it's for</div>

      <div className="wif-heading" style={{ overflow: 'hidden', marginBottom: '4rem' }}>
        <h2 style={{
          fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white',
          fontSize: 'clamp(2.5rem,4vw,3.75rem)', letterSpacing: '-0.035em', lineHeight: 1,
        }}>
          {heading.split('').map((c, i) => (
            <span key={i} className="wif-char" style={{ display: 'inline-block' }}>
              {c === ' ' ? '\u00A0' : c}
            </span>
          ))}
        </h2>
      </div>

      <div className="wif-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        {USE_CASES.map((u, i) => (
          <div key={i} className="wif-card"
            style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius:  20,
              padding:      '2rem 1.75rem',
              cursor:       'default',
              transition:   'transform 0.25s, border-color 0.25s',
            }}
            onMouseEnter={e => gsap.to(e.currentTarget, { y: -6, duration: 0.25, ease: 'power2.out', borderColor: `${u.color}55` })}
            onMouseLeave={e => gsap.to(e.currentTarget, { y:  0, duration: 0.3,  ease: 'power2.out', borderColor: 'rgba(255,255,255,0.07)' })}
          >
            {/* Icon pill */}
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:           48,
              height:          48,
              borderRadius:    14,
              background:     `${u.color}18`,
              fontSize:        '1.5rem',
              marginBottom:   '1.25rem',
            }}>
              {u.icon}
            </div>

            <h3 style={{
              fontFamily:    'Syne,sans-serif',
              fontWeight:     700,
              fontSize:      '1.1rem',
              color:          'white',
              letterSpacing: '-0.02em',
              marginBottom:  '0.6rem',
            }}>
              {u.title}
            </h3>

            <p style={{
              fontSize:   '0.875rem',
              fontWeight:  300,
              lineHeight:  1.65,
              color:      'rgba(255,255,255,0.5)',
            }}>
              {u.body}
            </p>

            {/* Accent line at bottom */}
            <div style={{
              width:        32,
              height:        3,
              borderRadius:  99,
              background:    u.color,
              marginTop:    '1.5rem',
            }}/>
          </div>
        ))}
      </div>

      {/* Honest early-stage note */}
      <p style={{
        marginTop:     '3.5rem',
        fontSize:      '0.82rem',
        color:         'rgba(255,255,255,0.2)',
        textAlign:     'center',
        letterSpacing: '0.02em',
      }}>
        Driply is actively growing — your order helps shape what comes next.
      </p>
    </section>
  )
}

// ─── CTA (magnetic fullscreen) ────────────────────────────────────────────────
function CTA() {
  const sectionRef = useRef<HTMLElement>(null)
  const btnRef     = useRef<HTMLButtonElement>(null)

  useGSAP(() => {
    gsap.from('.cta-heading .ctah-char', {
      yPercent: 100, stagger: 0.03, duration: 0.8, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
    })
    gsap.from('.cta-sub', {
      y: 24, opacity: 0, duration: 0.7, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true, delay: 0.3 },
    })
    gsap.from('.cta-btns > *', {
      y: 24, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power4.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true, delay: 0.5 },
    })
  }, { scope: sectionRef })

  function magneticMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const dx   = (e.clientX - rect.left - rect.width  / 2) * 0.3
    const dy   = (e.clientY - rect.top  - rect.height / 2) * 0.3
    gsap.to(e.currentTarget, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' })
  }
  function magneticLeave(e: React.MouseEvent<HTMLElement>) {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: 'driply-pop' })
  }

  const heading = 'YOUR DRIP, STARTS HERE.'

  return (
    <section ref={sectionRef} data-nav-bg="#F8F5EF"
      style={{ padding:'8rem 4rem',textAlign:'center',background:'#F8F5EF',position:'relative',overflow:'hidden' }}>

      {/* Big decorative blobs */}
      <div style={{ position:'absolute',width:600,height:600,borderRadius:'50%',background:'#C8F135',
        opacity:0.1,top:-200,left:-100,filter:'blur(80px)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',width:400,height:400,borderRadius:'50%',background:'#FF5B3A',
        opacity:0.09,bottom:-100,right:0,filter:'blur(80px)',pointerEvents:'none' }}/>

      <div className="cta-heading" style={{ overflow:'hidden',marginBottom:'1.5rem' }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800,
  fontSize:'clamp(2.5rem,6vw,5rem)', letterSpacing:'-0.04em',
  lineHeight:0.95, color:'#0E0E0E' }}>
  {heading.split(' ').map((word, wi, arr) => (
    <span key={wi} style={{ display:'inline-block', whiteSpace:'nowrap' }}>
      {word.split('').map((c, ci) => (
        <span key={ci} className="ctah-char" style={{ display:'inline-block' }}>
          {c}
        </span>
      ))}
      {wi < arr.length - 1 && (
        <span className="ctah-char" style={{ display:'inline-block' }}>
          {'\u00A0'}
        </span>
      )}
    </span>
  ))}
</h2>
      </div>

      <p className="cta-sub" style={{ fontSize:'1.05rem',fontWeight:300,color:'#3A3A3A',
        maxWidth:480,margin:'0 auto 3rem',lineHeight:1.65 }}>
        Join thousands of individuals, brands and organizations. Free to start.
      </p>

      <div className="cta-btns"
        style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'1rem',flexWrap:'wrap' }}>
        <SignUpButton mode="modal">
          <button
            onMouseMove={magneticMove} onMouseLeave={magneticLeave}
            style={{ padding:'1.1rem 2.75rem',background:'#0E0E0E',color:'white',
              fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:800,
              border:'none',borderRadius:100,cursor:'pointer',display:'inline-block',
              willChange:'transform' }}>
            Create your first design →
          </button>
        </SignUpButton>
        <Link to="/dashboard"
          onMouseMove={magneticMove} onMouseLeave={magneticLeave}
          style={{ padding:'1.05rem 2.25rem',color:'#0E0E0E',background:'none',
            border:'1.5px solid rgba(14,14,14,0.22)',borderRadius:100,textDecoration:'none',
            fontFamily:'Syne,sans-serif',fontSize:'0.95rem',fontWeight:600,display:'inline-block',
            willChange:'transform' }}>
          Explore the studio
        </Link>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const COLS = [
    { title:'Product', links:['Dashboard','Garment catalog','Embroidery','Bulk orders'] },
    { title:'Company', links:['About','Blog','Careers','Contact']                       },
    { title:'Legal',   links:['Privacy','Terms','Cookies']                              },
  ]

  function hoverLink(e: React.MouseEvent<HTMLAnchorElement>) {
    gsap.to(e.currentTarget, { x: 4, duration: 0.2, ease: 'power2.out' })
  }
  function unhoverLink(e: React.MouseEvent<HTMLAnchorElement>) {
    gsap.to(e.currentTarget, { x: 0, duration: 0.3, ease: 'driply-pop' })
  }

  return (
    <footer className="rp-pad-lg" style={{ background: '#0E0E0E', paddingTop: '4rem', paddingBottom: '2.5rem' }} data-nav-bg="#0E0E0E">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12 mb-12 lg:mb-14">
        <div>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:'1.5rem',fontWeight:800,
            color:'white',letterSpacing:'-0.03em',marginBottom:'1rem' }}>
            Drip<span style={{ color:'#FF5B3A' }}>ly</span>
          </div>
          <p style={{ fontSize:'0.875rem',color:'rgba(255,255,255,0.4)',lineHeight:1.65,maxWidth:260 }}>
            Design your drip. Visualize custom prints and embroidery on any garment, then order the real thing.
          </p>
          <div style={{ display:'flex',gap:'0.75rem',marginTop:'1.5rem' }}>
            {['Twitter / X','Instagram','LinkedIn'].map((s,i)=>(
              <a key={i} href="#"
                style={{ fontSize:'0.72rem',color:'rgba(255,255,255,0.35)',textDecoration:'none',
                  border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'0.35rem 0.85rem',
                  transition:'all 0.2s' }}
                onMouseEnter={e=>gsap.to(e.currentTarget,{borderColor:'rgba(200,241,53,0.5)',
                  color:'#C8F135',duration:0.2})}
                onMouseLeave={e=>gsap.to(e.currentTarget,{borderColor:'rgba(255,255,255,0.1)',
                  color:'rgba(255,255,255,0.35)',duration:0.2})}>
                {s}
              </a>
            ))}
          </div>
        </div>
        {COLS.map(col=>(
          <div key={col.title}>
            <h5 style={{ fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',
              color:'rgba(255,255,255,0.28)',marginBottom:'1.25rem' }}>{col.title}</h5>
            <ul style={{ listStyle:'none',padding:0 }}>
              {col.links.map(l=>(
                <li key={l} style={{ marginBottom:'0.6rem' }}>
                  <a href="#"
                    onMouseEnter={hoverLink} onMouseLeave={unhoverLink}
                    style={{ fontSize:'0.875rem',color:'rgba(255,255,255,0.5)',
                      textDecoration:'none',display:'inline-block',transition:'color 0.2s' }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:'1.5rem' }}>
        <span style={{ fontSize:'0.78rem',color:'rgba(255,255,255,0.22)' }}>
          © 2025 Driply. All rights reserved.
        </span>
        <span style={{ fontSize:'0.78rem',color:'rgba(255,255,255,0.22)' }}>
          Made with <span style={{ color:'#FF5B3A' }}>♥</span> for creators everywhere
        </span>
      </div>
    </footer>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function DriplyLanding() {
  useLenis()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: auto; } /* Lenis handles smooth scroll */
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        /* ── Custom cursor ── */
        * { cursor: none !important; }
        .cursor-dot {
          position: fixed; top: 0; left: 0;
          /* Max z-index so the cursor clears Clerk modal overlays (z ~9999)
             and any other portals that mount directly on body */
          z-index: 2147483647;
          width: 6px; height: 6px; border-radius: 50%;
          background: #C8F135; pointer-events: none;
          transform: translate(-50%,-50%);
          /* mix-blend-mode: difference removed — it caused the cursor dot to
             turn invisible on white backgrounds and inverted the logo colour */
        }
        .cursor-ring {
          position: fixed; top: 0; left: 0;
          z-index: 2147483646;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid rgba(200,241,53,0.7);
          pointer-events: none;
          transform: translate(-50%,-50%);
          opacity: 0.7;
        }
        @media (hover: none) { .cursor-dot, .cursor-ring { display: none !important; } * { cursor: auto !important; } }

        /* ── Grain ── */
        .grain-overlay {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
        }

        /* ── Nav ── */
        .nav-shell {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center; padding: 1.25rem 3.5rem;
        }
        .nav-dark {
          background: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nav-light {
          background: rgba(248,245,239,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(14,14,14,0.06);
          box-shadow: 0 1px 20px rgba(0,0,0,0.05);
        }
        .nav-logo {
          font-family: 'Syne',sans-serif; font-size: 1.5rem; font-weight: 800;
          letter-spacing: -0.03em; text-decoration: none; transition: color 0.4s;
          /* isolation:isolate creates a new stacking context so the cursor's
             mix-blend-mode:difference can't invert the logo text on white nav */
          isolation: isolate;
          position: relative; z-index: 1;
        }
        .nav-link-text { font-size: 0.875rem; font-weight: 500; text-decoration: none; letter-spacing: 0.01em; transition: color 0.2s; display: inline-block; }
        .nav-cta-wrap { display: flex; align-items: center; gap: 0.85rem; justify-content: flex-end; }
        @media (max-width: 1023px) { .nav-cta-wrap { display: none; } }

        /* ── Responsive layout utilities — raw un-layered CSS ──────────────────
           Tailwind v4 wraps its utilities inside cascade layers. Un-layered CSS
           always wins regardless of specificity, so Tailwind px- / py- / grid-cols- classNames lose to any un-layered rule in this file. These classes are
           defined here (un-layered, same block) so they win the same fight. */
        .rp-pad-lg  { padding-left: 1.5rem; padding-right: 1.5rem; }
        .rp-section { padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 4rem; padding-bottom: 4rem; }
        @media (min-width: 640px)  {
          .rp-pad-lg, .rp-section { padding-left: 2.5rem; padding-right: 2.5rem; }
        }
        @media (min-width: 1024px) {
          .rp-pad-lg, .rp-section { padding-left: 4rem; padding-right: 4rem; }
          .rp-section { padding-top: 7rem; padding-bottom: 7rem; }
        }
        /* Footer grid */
        .rp-footer-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 3rem; }
        @media (min-width: 640px)  { .rp-footer-grid { grid-template-columns: 1fr 1fr; gap: 2.5rem; } }
        @media (min-width: 1024px) { .rp-footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3.5rem; } }
        /* DashPreview centering */
        .dash-preview-card { max-width: 1100px; margin-left: auto; margin-right: auto; }
        /* Hero stats — fix: base rule below was silently overriding mobile gap because
           it appears later in the same un-layered block, winning by source order */
        .hero-stats { display: flex; gap: 2.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.75rem; }
        @media (max-width: 768px) { .hero-stats { flex-wrap: wrap; gap: 1.5rem; } }
        @media (max-width: 480px) { .hero-stats { gap: 1.25rem; } }
        /* Process mobile — hide frozen step-indicator elements (JS that drives
           them never runs on mobile since the scroll-jacking is disabled below
           768px), add spacing between stacked panels */
        @media (max-width: 768px) {
          .process-big-num, .process-progress-track, .process-accent-bar { display: none; }
          .process-step-panel { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(14,14,14,0.08); }
          .process-step-panel:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        }
        .btn-nav-ghost {
          font-size: 0.875rem; font-weight: 500;
          border-width: 1.5px; border-style: solid;
          padding: 0.5rem 1.25rem; border-radius: 100px; cursor: pointer;
          background: none; transition: border-color 0.2s, color 0.2s;
        }
        .btn-nav-primary {
          font-size: 0.875rem; font-weight: 600;
          background: #C8F135; color: #0E0E0E;
          border: none; padding: 0.55rem 1.35rem;
          border-radius: 100px; cursor: pointer; text-decoration: none;
          transition: background 0.2s, color 0.2s;
          font-family: 'Syne', sans-serif;
        }
        .btn-nav-primary:hover { background: #9BBF10; color: white; }

        @media (max-width:1023px) {
          .nav-shell { grid-template-columns: 1fr auto; padding: 1.1rem 1.5rem; }
        }

        /* ── Hero ── */
        .hero-section { position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        .hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .hero-inner {
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 100vh; padding-top: 7rem; position: relative; z-index: 2;
        }
/* ── Tablet (≤1024px) ── */
        @media (max-width: 1024px) {
          .hero-inner {
            gap: 1.5rem;
            padding-left: 2.5rem;
            padding-right: 2.5rem;
          }

          .hero-shirt-wrap svg {
            width: 300px !important;
          }

          .hero-badge {
            font-size: 0.68rem;
            padding: 0.4rem 0.75rem;
          }
        }

/* ── Mobile (≤768px) — the main layout change ── */
        @media (max-width: 768px) {
          .hero-inner {
            flex-direction: column;        /* if using flex */
            grid-template-columns: 1fr;   /* if using grid — harmless if not */
            align-items: center;
            padding: 6rem 1.5rem 3rem;
            gap: 3rem;
            min-height: 100svh;            /* svh respects mobile browser chrome */
          }

          .hero-left-col {
            width: 100%;
            max-width: 100%;
            order: 1;
            /* Keep text left-aligned on mobile — centre feels imbalanced with this
              much copy. Remove if you prefer centred. */
            text-align: left;
          }

          .hero-right-col {
            width: 100%;
            order: 2;
            /* Centre the shirt and swatches */
            display: flex;
            flex-direction: column;
            align-items: center;
            /* Remove relative positioning quirks from desktop */
            position: static;
          }

          .hero-shirt-wrap {
            display: flex;
            justify-content: center;
          }

          .hero-shirt-wrap svg {
            width: 260px !important;
          }

          /* Floating badges — hidden on mobile. Their absolute positioning is relative
            to hero-right-col, which now has no fixed height in the stacked layout.
            Re-enable and adjust values below if you want them on mobile. */
          .hero-badge {
            display: none;
          }

          /* Swatch strip — override any absolute/transform positioning from desktop
            so it sits naturally below the shirt in flow */
          .hero-swatch-strip {
            position: static;
            transform: none;
            justify-content: center;
            margin-top: 1.25rem;
          }

          /* CTAs — allow wrapping gracefully on narrow screens */
          .hero-ctas {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          /* Stats — centre them */
          .hero-stats {
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 1.5rem;
          }
        }

/* ── Phone (≤480px) ──────────────────────────────────────────────────────────
Further reductions for very small screens. The SVG is already 260px which
fits a 375px phone with room to spare, but tighten other spacing. */
        @media (max-width: 480px) {
          .hero-inner {
            padding: 5.5rem 1.25rem 2.5rem;
            gap: 2rem;
          }

          .hero-shirt-wrap svg {
            width: 320px !important;
          }

          .hero-swatch-strip {
            gap: 6px;
          }

          .hero-stats {
            gap: 1.25rem;
          }

          /* Keep the scroll indicator hidden on very small screens where it overlaps */
          .scroll-indicator {
            display: none;
          }
        }
          
        .hero-left-col { display: flex; flex-direction: column; justify-content: center; padding: 3rem 3rem 3rem 4rem; }
        .hero-right-col { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(200,241,53,0.12); border: 1px solid rgba(200,241,53,0.25);
          color: #C8F135; font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.4rem 1rem; border-radius: 100px;
          width: fit-content; margin-bottom: 2rem;
        }
        .hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #C8F135; flex-shrink: 0;
          animation: heroEyebrowPulse 2s infinite;
        }
        @keyframes heroEyebrowPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .hero-h1 {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(4rem, 6.5vw, 7rem);
          line-height: 0.9; letter-spacing: -0.05em;
          margin-bottom: 1.75rem;
        }
        .hero-line-wrap { display: block; }
        .hero-line-mask { display: inline-block; overflow: hidden; vertical-align: bottom; white-space: nowrap;}
        .hero-char-outline {
          color: transparent !important;
          -webkit-text-stroke: 2.5px #C8F135;
        }

        .hero-sub-text {
          font-size: 1.05rem; font-weight: 300; color: rgba(255,255,255,0.6);
          line-height: 1.65; max-width: 420px; margin-bottom: 2.5rem;
        }
        .hero-ctas { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-hero-primary {
          display: inline-flex; align-items: center;
          background: #C8F135; color: #0E0E0E;
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
          padding: 1rem 2.25rem; border-radius: 100px; border: none; cursor: pointer;
          transition: background 0.2s; will-change: transform;
        }
        .btn-hero-primary:hover { background: #9BBF10; color: white; }
        .btn-hero-ghost {
          display: inline-flex; align-items: center; gap: 0.75rem;
          color: rgba(255,255,255,0.6); font-size: 1rem;
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
        }
        .btn-hero-ghost:hover { color: white; }
        .play-circle {
          width: 42px; height: 42px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; color: white; flex-shrink: 0;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-hero-ghost:hover .play-circle { border-color: white; background: rgba(255,255,255,0.08); }

        .hero-stats {
          display: flex; gap: 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1.75rem;
        }
        .stat-number {
          font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
          color: white; letter-spacing: -0.03em;
        }
        .stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.15rem; }

        .hero-shirt-wrap {
          animation: heroShirtFloat 6s ease-in-out infinite;
          transform-origin: center;
        }

        .hero-shirt-wrap svg {
          transition: width 0.3s ease;
        }
        @keyframes heroShirtFloat {
          0%,100% { transform: translateY(0px) rotate(-1.5deg); }
          50%      { transform: translateY(-18px) rotate(1.5deg); }
        }

        .hero-badge {
          position: absolute; z-index: 10;
          display: flex; align-items: center; gap: 0.5rem;
          background: #0E0E0E; color: white;
          font-size: 0.75rem; font-weight: 500;
          padding: 0.55rem 1rem; border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3); white-space: nowrap;
          animation: badgeDrift 9s ease-in-out infinite;
        }
        .badge-pos-tl { top: 16%; left: 3%; animation-delay: 0s; }
        .badge-pos-br { bottom: 20%; right: 2%; animation-delay: 1.2s; }
        .badge-pos-ml { top: 54%; left: -2%; animation-delay: 0.6s; }
        .badge-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        @keyframes badgeDrift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        .hero-swatch-strip {
          position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px; z-index: 10;
          background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
          padding: 0.6rem 1rem; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .hero-swatch {
          width: 22px; height: 22px; border-radius: 50%; border-width: 2px; border-style: solid;
          cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }

        .scroll-indicator {
          position: absolute; bottom: 2.5rem; left: 50%; transform: translateX(-50%);
          z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          color: rgba(255,255,255,0.4); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .scroll-ind-track {
          width: 1px; height: 48px; background: rgba(255,255,255,0.15); position: relative; overflow: hidden;
        }
        .scroll-ind-ball {
          width: 1px; height: 16px; background: #C8F135; position: absolute;
          top: 0; animation: scrollBallDrop 1.6s ease-in-out infinite;
        }
        @keyframes scrollBallDrop { 0%{top:0;opacity:1} 80%{top:100%;opacity:1} 100%{top:100%;opacity:0} }

        /* ── Marquee ── */
        .marquee-inner { display: flex; white-space: nowrap; width: max-content; }
        .marquee-chip {
          display: inline-flex; align-items: center; gap: 1.25rem;
          padding: 0 2rem;
          font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .marquee-star { color: #FF5B3A; }

        /* ── Process ── */
        .process-section {
          display: grid; grid-template-columns: 280px 1fr;
          min-height: 100vh; background: #F8F5EF;
          align-items: center;
        }
        .process-left {
          padding: 4rem 3rem; position: relative;
          border-right: 1px solid rgba(14,14,14,0.08);
          height: 100%; display: flex; flex-direction: column; justify-content: center;
        }
        .process-eyebrow {
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #888; margin-bottom: 1rem;
        }
        .process-big-num {
          font-family: 'Syne', sans-serif; font-size: 8rem; font-weight: 800;
          line-height: 1; letter-spacing: -0.05em; color: #0E0E0E;
          margin-bottom: 2rem;
        }
        .process-progress-track {
          width: 3px; height: 120px; background: rgba(14,14,14,0.1);
          border-radius: 2px; position: relative; margin-bottom: 1rem;
        }
        .process-progress-fill {
          position: absolute; top: 0; left: 0; right: 0;
          background: #C8F135; border-radius: 2px; transition: height 0.5s ease;
        }
        .process-accent-bar {
          width: 40px; height: 4px; border-radius: 2px; margin-bottom: 1.5rem;
          transition: background 0.4s ease;
        }
        .process-step-count { font-size: 0.78rem; color: #888; }
        .process-right { padding: 4rem; position: relative; overflow: hidden; }
        .process-overline {
          font-family: 'Syne', sans-serif; font-size: clamp(2.5rem,4vw,3.5rem);
          font-weight: 800; letter-spacing: -0.03em; color: rgba(14,14,14,0.08);
          margin-bottom: 2rem; line-height: 1;
        }
        .process-step-panel {
          position: absolute; top: 50%; transform: translateY(-50%);
          padding-left: 0;
        }
        .process-step-num {
          font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem;
        }
        .process-step-title {
          font-family: 'Syne', sans-serif; font-size: clamp(2rem,3.5vw,3rem);
          font-weight: 800; letter-spacing: -0.03em; color: #0E0E0E; margin-bottom: 1rem; line-height: 1;
        }
        .process-step-body {
          font-size: 1rem; font-weight: 300; color: #3A3A3A; max-width: 520px; line-height: 1.7;
        }

        @media (max-width: 768px) {
          .process-section {
            grid-template-columns: 1fr;
            min-height: auto; /* 100vh on a stacked layout pushes content far below the fold */
          }
          .process-left {
            border-right: none;
            border-bottom: 1px solid rgba(14,14,14,0.08);
            padding: 3rem 1.5rem 2rem;
          }
          .process-big-num { font-size: 4rem; margin-bottom: 1.25rem; } /* was 8rem — overwhelmed a phone screen */
          .process-right { padding: 2.5rem 1.5rem 3rem; }
          .process-step-panel {
            position: static; /* was absolute+centered — depended on process-right's height, which now varies with stacked content */
            transform: none;
          }
          .process-overline { font-size: clamp(2rem, 10vw, 2.5rem); margin-bottom: 1.25rem; }
        }

        /* ── Features ── */
        .features-section { padding: 7rem 4rem; background: #F8F5EF; }
        .sect-eyebrow {
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #888; margin-bottom: 1rem;
        }
        .features-heading-wrap { margin-bottom: 4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: end; }
        .features-h2 {
          font-family: 'Syne', sans-serif; font-size: clamp(2.75rem,4.5vw,4rem);
          font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; color: #0E0E0E;
        }
        .features-heading-line { display: block; }
        .features-sub { font-size: 1.05rem; font-weight: 300; color: #3A3A3A; line-height: 1.65; }
        .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem; }

        @media (max-width: 768px) {
          .features-section { padding: 4rem 1.5rem; }
          .features-heading-wrap { grid-template-columns: 1fr; gap: 1rem; align-items: start; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr; } /* 2-up was too cramped for icon+title+body cards on the narrowest phones */
        }
        .feat-clip-card {
          border-radius: 24px; padding: 2.25rem; cursor: default;
          transition: transform 0.25s; will-change: clip-path;
        }
        .feat-wide { grid-column: span 2; }
        .feat-icon { font-size: 2.5rem; margin-bottom: 1.25rem; display: block; }
        .feat-title { font-family: 'Syne',sans-serif; font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.6rem; }
        .feat-body { font-size: 0.875rem; font-weight: 300; line-height: 1.65; }
        .feat-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 1.25rem; }
        .feat-chip { font-size: 0.75rem; border-radius: 100px; padding: 0.35rem 0.85rem; }
        .feat-chip-lime { background: #C8F135; color: #0E0E0E; font-weight: 500; }
        .feat-chip-dark { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }

        /* ── Garments h-scroll ── */
        .garments-h2 {
          font-family: 'Syne',sans-serif; font-size: clamp(3rem,5vw,5rem);
          font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; color: #0E0E0E;
          margin-bottom: 0.5rem;
        }

        /* ── Dashboard preview ── */
        .dash-h2 {
          font-family: 'Syne',sans-serif; font-size: clamp(2.5rem,4vw,3.75rem);
          font-weight: 800; letter-spacing: -0.035em; line-height: 1; color: #0E0E0E;
        }
        @keyframes gentleFloat {
          0%,100% { transform: translateY(0px) rotate(-0.5deg); }
          50%      { transform: translateY(-10px) rotate(0.5deg); }
        }

        /* ── Misc ── */
        a { cursor: none; }
      `}</style>

      <CustomCursor />

      <div style={{ background: '#F8F5EF', color: '#0E0E0E', overflowX: 'hidden' }}>
        <Nav />
        <Hero />
        <Marquee />
        <Process />
        <Features />
        <Garments />
        <DashPreview />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </>
  )
}



// ============================================================
//  DRIPLY — Landing Page v2  (Ambitious Edition)
//  app/routes/index.tsx
//
//  New installs required:
//    npm install lenis gsap @gsap/react
//    (gsap + @gsap/react may already be installed)
//
//  GSAP plugins used (all free with core):
//    ScrollTrigger, CustomEase, ScrollToPlugin
//
//  Design direction:
//    — Dark cinematic hero (black) contrasting warm-white body
//    — Massive editorial typography with masked char reveals
//    — Cursor-tracked parallax on hero shirt
//    — Lenis smooth scroll throughout
//    — Pinned scroll process section
//    — Horizontal garment scroll gallery
//    — Velocity-reactive marquee
//    — Clip-path section wipe reveals
//    — Magnetic interactive elements
//    — Custom blended cursor (desktop only)
// ============================================================

// import { SignInButton, SignUpButton, useUser } from '@clerk/tanstack-start'
// import { useGSAP } from '@gsap/react'
// import { createFileRoute, Link } from '@tanstack/react-router'
// import gsap from 'gsap'
// // import CustomEase    from 'gsap/CustomEase'
// // import ScrollToPlugin from 'gsap/ScrollToPlugin'
// import ScrollTrigger from 'gsap/ScrollTrigger'
// import Lenis         from 'lenis'
// import {
//   useCallback, useEffect,useMemo, 
//   useRef, useState, type RefObject,
// } from 'react'

// // gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, ScrollToPlugin)

// // CustomEase.create('driply-pop', 'M0,0 C0.14,0 0.27,0.3 0.38,0.7 0.52,1.05 0.6,1.08 0.72,1.12 0.8,1 1,1')

// gsap.registerPlugin(useGSAP, ScrollTrigger)

// export const Route = createFileRoute('/')({
//   component: DriplyLanding,
// })

// // ─── Data ────────────────────────────────────────────────────────────────────
// const SWATCHES = [
//   { bg: '#2ECEFF', collar: '#1AAFEA', label: 'Sky Blue' },
//   { bg: '#FF5B3A', collar: '#c94424', label: 'Coral'    },
//   { bg: '#C8F135', collar: '#9BBF10', label: 'Lime'     },
//   { bg: '#0E0E0E', collar: '#050505', label: 'Ink'      },
//   { bg: '#F0EDE8', collar: '#d8d4cf', label: 'Cream'    },
//   { bg: '#7B5BFF', collar: '#5a3fdd', label: 'Violet'   },
//   { bg: '#FFD60A', collar: '#d4b000', label: 'Amber'    },
// ]

// const STATS = [
//   { end: 50,  suffix: '+', label: 'Garment types'    },
//   { end: 100, suffix: 'K+', label: 'Designs created' },
//   { end: 24,  suffix: 'h',  label: 'Quote turnaround' },
// ]

// const PROCESS_STEPS = [
//   {
//     num: '01', label: 'Pick & Design',
//     body: 'Choose any garment from our catalog. Drop into the studio — add text, logos, embroidery, prints. Whatever\'s in your head.',
//     accent: '#C8F135',
//   },
//   {
//     num: '02', label: 'Customize & Confirm',
//     body: 'Set quantities, color splits, size breakdowns. Review the full order summary before a single stitch is committed.',
//     accent: '#3ABAFF',
//   },
//   {
//     num: '03', label: 'Produced & Shipped',
//     body: 'Production partners handle the rest. Quality-checked, individually packed, delivered to your door. No middlemen.',
//     accent: '#FF5B3A',
//   },
// ]

// const FEATURES = [
//   {
//     icon: '🖋', title: 'Text & Typography', color: '#0E0E0E', text: 'white',
//     body: 'Hundreds of fonts. Size, spacing, weight, color — every dimension controlled. Paste your own or pick from curated pairings.',
//     chips: ['Syne Display', 'DM Sans', 'Bebas Neue', 'Playfair', '+ 200 more'],
//   },
//   {
//     icon: '🎨', title: 'Color System', color: '#C8F135', text: '#0E0E0E',
//     body: 'Hex, Pantone, or eyedropper. Unlimited palettes. Color-match across the full garment piece — collar, cuffs, body.',
//     chips: [],
//   },
//   {
//     icon: '🖼', title: 'Asset Import', color: '#F2EFEA', text: '#0E0E0E',
//     body: 'Drop in SVGs, PNGs, illustrations. Auto-vectorization. AI background removal. Your brand, your rules.',
//     chips: [],
//   },
//   {
//     icon: '✦', title: 'Live Preview', color: '#FF5B3A', text: 'white',
//     body: 'Real-time garment mockup. Every edit reflects instantly — no guessing how it prints.',
//     chips: [],
//   },
//   {
//     icon: '⚡', title: 'Bulk Orders', color: '#7B5BFF', text: 'white',
//     body: 'Size runs, color splits, mixed quantities — all in one order. Built for teams, clubs, brands and agencies.',
//     chips: [],
//   },
// ]

// const GARMENTS = [
//   { emoji: '👒', name: 'Face Caps',    sub: '6-panel, snapback',   bg: '#E8F4FF' },
//   { emoji: '👕', name: 'T-Shirts',     sub: 'Crew, V-neck, OS',    bg: '#FFF0E8' },
//   { emoji: '🧥', name: 'Hoodies',      sub: 'Pullover, zip, coach', bg: '#F0FFE8' },
//   { emoji: '🧣', name: 'Scarves',      sub: 'Woven & printed',     bg: '#FFF8E8' },
//   { emoji: '👔', name: 'Polo Shirts',  sub: 'Classic & slim',      bg: '#F0E8FF' },
//   { emoji: '🩳', name: 'Shorts',       sub: 'Athletic & casual',   bg: '#E8FFF4' },
//   { emoji: '👜', name: 'Tote Bags',    sub: 'Cotton & canvas',     bg: '#FFE8F0' },
//   { emoji: '🎽', name: 'Jerseys',      sub: 'Sports & club',       bg: '#E8F0FF' },
// ]

// const TESTIMONIALS = [
//   {
//     quote: 'We ordered custom hoodies for our whole team. The dashboard is incredibly intuitive — design locked in under 20 minutes.',
//     name: 'Adaeze K.', role: 'Startup founder, Lagos',
//     initials: 'AK', color: '#C8F135', from: 'left',
//   },
//   {
//     quote: 'The color preview is a game changer. What you see really is what you get. First batch of caps came out exactly like the mockup.',
//     name: 'Marcus R.', role: 'Streetwear brand, London',
//     initials: 'MR', color: '#3ABAFF', from: 'bottom',
//   },
//   {
//     quote: 'Our club uses Driply every season for jerseys. The quantity breakdown and color splits save us hours of back-and-forth.',
//     name: 'Yemi B.', role: 'Club manager, Abuja',
//     initials: 'YB', color: '#FF5B3A', from: 'right',
//   },
// ]

// const MARQUEE_ITEMS = [
//   'Face Caps','T-Shirts','Hoodies','Scarves','Trousers',
//   'Jackets','Jerseys','Beanies','Polo Shirts','Tote Bags',
// ]

// const rnd = (a: number, b: number) => Math.random() * (b - a) + a

// // ─── Smooth scroll setup ──────────────────────────────────────────────────────
// function useLenis() {
//   useEffect(() => {
//     const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })

//     lenis.on('scroll', ScrollTrigger.update)

//     gsap.ticker.add((time) => {
//       lenis.raf(time * 1000)
//     })
//     gsap.ticker.lagSmoothing(0)

//     return () => {
//       lenis.destroy()
//       gsap.ticker.remove((time) => lenis.raf(time * 1000))
//     }
//   }, [])
// }

// // ─── Custom cursor (desktop only) ─────────────────────────────────────────────
// function CustomCursor() {
//   const dotRef  = useRef<HTMLDivElement>(null)
//   const ringRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     if (window.matchMedia('(hover: none)').matches) return

//     const dot  = dotRef.current
//     const ring = ringRef.current
//     if (!dot || !ring) return

//     let mouseX = 0, mouseY = 0

//     const onMove = (e: MouseEvent) => {
//       mouseX = e.clientX; mouseY = e.clientY
//       gsap.to(dot,  { x: mouseX, y: mouseY, duration: 0.1, ease: 'none' })
//       gsap.to(ring, { x: mouseX, y: mouseY, duration: 0.4, ease: 'power2.out' })
//     }

//     // Magnetic hover on interactive elements
//     const onEnter = () => {
//       gsap.to(ring, { scale: 2.5, opacity: 0.4, duration: 0.3, ease: 'power2.out' })
//       gsap.to(dot,  { scale: 0,   duration: 0.2 })
//     }
//     const onLeave = () => {
//       gsap.to(ring, { scale: 1,   opacity: 0.7, duration: 0.3, ease: 'power2.out' })
//       gsap.to(dot,  { scale: 1,   duration: 0.2 })
//     }

//     window.addEventListener('mousemove', onMove)
//     document.querySelectorAll('a,button,[data-cursor="pointer"]').forEach(el => {
//       el.addEventListener('mouseenter', onEnter)
//       el.addEventListener('mouseleave', onLeave)
//     })

//     return () => {
//       window.removeEventListener('mousemove', onMove)
//     }
//   }, [])

//   return (
//     <>
//       <div ref={dotRef}  className="cursor-dot"  />
//       <div ref={ringRef} className="cursor-ring" />
//     </>
//   )
// }

// // ─── Shirt SVG ────────────────────────────────────────────────────────────────
// function ShirtSVG({ color = '#2ECEFF', collar = '#1AAFEA', size = 340 }) {
//   return (
//     <svg viewBox="0 0 340 400" width={size} xmlns="http://www.w3.org/2000/svg"
//       style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.35))', transition: 'all 0.4s ease' }}>
//       <path d="M85,90 L30,130 L60,160 L80,148 L80,350 L260,350 L260,148 L280,160 L310,130 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 Z"
//         fill={color} style={{ transition: 'fill 0.4s ease' }}/>
//       <path d="M155,90 C155,90 163,108 170,115 C177,108 185,90 185,90 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 L140,75 C145,82 155,90 155,90 Z"
//         fill={collar} style={{ transition: 'fill 0.4s ease' }}/>
//       <path d="M30,130 L60,160 L80,148 L80,130 Z"  fill="rgba(0,0,0,0.08)"/>
//       <path d="M310,130 L280,160 L260,148 L260,130 Z" fill="rgba(0,0,0,0.08)"/>
//       <rect x="118" y="165" width="104" height="82" rx="6"
//         fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="6,4"/>
//       <text x="170" y="198" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">YOUR</text>
//       <text x="170" y="216" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">DESIGN</text>
//       <text x="170" y="234" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">HERE</text>
//       <circle cx="232" cy="176" r="13" fill="rgba(255,255,255,0.12)"/>
//       <text x="232" y="180" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="8" fill="white">D</text>
//     </svg>
//   )
// }

// // ─── Split text into char spans ───────────────────────────────────────────────
// function SplitChars({ text, className = '', wrapClass = '' }: {
//   text: string; className?: string; wrapClass?: string
// }) {
//   return (
//     <span className={wrapClass}>
//       {text.split('').map((ch, i) => (
//         <span key={i} className={`split-char ${className}`} style={{ display: 'inline-block' }}>
//           {ch === ' ' ? '\u00A0' : ch}
//         </span>
//       ))}
//     </span>
//   )
// }

// // ─── NAV ──────────────────────────────────────────────────────────────────────
// function Nav() {
//   const { isSignedIn } = useUser()
//   const navRef   = useRef<HTMLElement>(null)
//   const logoRef  = useRef<HTMLAnchorElement>(null)
//   const [dark, setDark] = useState(true) // starts on dark hero

//   useGSAP(() => {
//     // Stagger links in on mount
//     gsap.from('.nav-link-item', {
//       y: -20, opacity: 0, stagger: 0.07, duration: 0.6,
//       ease: 'power4.out', delay: 0.8,
//     })
//     gsap.from(logoRef.current, {
//       y: -20, opacity: 0, duration: 0.6, ease: 'power4.out', delay: 0.6,
//     })
//     gsap.from('.nav-cta-wrap > *', {
//       y: -20, opacity: 0, stagger: 0.06, duration: 0.6,
//       ease: 'power4.out', delay: 1,
//     })

//     // Morph nav on scroll past hero
//     ScrollTrigger.create({
//       trigger: '#hero',
//       start: 'bottom 80px',
//       onEnter:    () => setDark(false),
//       onLeaveBack:() => setDark(true),
//     })
//   }, { scope: navRef })

//   return (
//     <nav ref={navRef}
//       className={`nav-shell ${dark ? 'nav-dark' : 'nav-light'}`}
//       style={{ transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease' }}
//     >
//       <a ref={logoRef} href="#" className={`nav-logo ${dark ? 'text-white' : 'text-[#0E0E0E]'}`}>
//         Drip<span className="text-[#FF5B3A]">ly</span>
//       </a>

//       <ul className="hidden lg:flex items-center gap-10 list-none m-0 p-0">
//         {[['How it works','#process'],['Features','#features'],['Products','#garments'],['Pricing','#pricing']].map(([l,h])=>(
//           <li key={h} className="nav-link-item">
//             <a href={h}
//               className={`nav-link-text ${dark ? 'text-white/60 hover:text-white' : 'text-[#3A3A3A] hover:text-[#0E0E0E]'}`}
//               onMouseEnter={e=>gsap.to(e.currentTarget,{y:-2,duration:0.2,ease:'power2.out'})}
//               onMouseLeave={e=>gsap.to(e.currentTarget,{y:0,duration:0.3,ease:'driply-pop'})}>
//               {l}
//             </a>
//           </li>
//         ))}
//       </ul>

//       <div className="nav-cta-wrap flex items-center gap-3 justify-end">
//         {isSignedIn ? (
//           <Link to="/dashboard" className="btn-nav-primary">Go to Studio →</Link>
//         ) : (
//           <>
//             <SignInButton mode="modal">
//               <button className={`btn-nav-ghost ${dark?'border-white/20 text-white/70 hover:border-white hover:text-white':'border-black/20 text-[#0E0E0E] hover:border-black'}`}>
//                 Log in
//               </button>
//             </SignInButton>
//             <SignUpButton mode="modal">
//               <button className="btn-nav-primary">Start designing →</button>
//             </SignUpButton>
//           </>
//         )}
//       </div>
//     </nav>
//   )
// }

// // ─── HERO ─────────────────────────────────────────────────────────────────────
// function Hero() {
//   const sectionRef = useRef<HTMLElement>(null)
//   const shirtRef   = useRef<HTMLDivElement>(null)
//   const [activeColor, setActiveColor] = useState(0)
//   const active = SWATCHES[activeColor]

//   // Mouse parallax on shirt
//   useEffect(() => {
//     const onMove = (e: MouseEvent) => {
//       if (!shirtRef.current) return
//       const cx = window.innerWidth  / 2
//       const cy = window.innerHeight / 2
//       const dx = (e.clientX - cx) / cx
//       const dy = (e.clientY - cy) / cy
//       gsap.to(shirtRef.current, {
//         x:         dx * 28,
//         y:         dy * 16,
//         rotationY: dx * 8,
//         rotationX: -dy * 4,
//         duration:  0.8,
//         ease:      'power2.out',
//       })
//     }
//     window.addEventListener('mousemove', onMove)
//     return () => window.removeEventListener('mousemove', onMove)
//   }, [])

//   useGSAP(() => {
//     const tl = gsap.timeline({ delay: 0.2 })

//     // Clip-mask char reveal on headline
//     tl.from('.hero-char', {
//       yPercent:  110,
//       opacity:   0,
//       stagger:   0.025,
//       duration:  0.85,
//       ease:      'power4.out',
//     })

//     // Sub-text
//     tl.from('.hero-sub-text', {
//       y:        24,
//       opacity:  0,
//       duration: 0.7,
//       ease:     'power4.out',
//     }, '-=0.5')

//     // CTAs
//     tl.from('.hero-cta-item', {
//       y:       20,
//       opacity: 0,
//       stagger: 0.1,
//       duration: 0.6,
//       ease:    'power4.out',
//     }, '-=0.5')

//     // Shirt bounce in
//     tl.from(shirtRef.current, {
//       y:        80,
//       opacity:  0,
//       scale:    0.85,
//       duration: 0.8,
//       ease:     'driply-pop',
//     }, 0.4)

//     // Floating badges pop
//     tl.from('.hero-badge', {
//       scale:   0,
//       opacity: 0,
//       stagger: 0.12,
//       duration: 0.5,
//       ease:    'back.out(2)',
//     }, '-=0.4')

//     // Swatch strip
//     tl.from('.hero-swatch-strip', {
//       y:       20,
//       opacity: 0,
//       duration: 0.5,
//       ease:    'power4.out',
//     }, '-=0.35')

//     // Stats count up on scroll
//     STATS.forEach((stat, i) => {
//       const el = document.querySelector(`[data-stat="${i}"]`)
//       if (!el) return
//       const obj = { val: 0 }
//       ScrollTrigger.create({
//         trigger: el,
//         start:   'top 85%',
//         once:    true,
//         onEnter: () => {
//           gsap.to(obj, {
//             val:       stat.end,
//             duration:  1.4,
//             ease:      'power2.out',
//             onUpdate:  () => { el.textContent = Math.round(obj.val) + stat.suffix },
//           })
//         },
//       })
//     })

//     // Scroll indicator bobs
//     gsap.to('.scroll-indicator', {
//       y:       10,
//       duration: 1.2,
//       ease:    'sine.inOut',
//       yoyo:    true,
//       repeat:  -1,
//     })

//     // Fade scroll indicator out on scroll
//     ScrollTrigger.create({
//       trigger: sectionRef.current,
//       start:   '20% top',
//       onEnter: () => gsap.to('.scroll-indicator', { opacity: 0, y: 20, duration: 0.4 }),
//       onLeaveBack: () => gsap.to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.4 }),
//     })

//     // Parallax blobs
//     gsap.to('.hero-blob-1', { y: -120, ease: 'none',
//       scrollTrigger: { trigger: sectionRef.current, scrub: 2, start: 'top top', end: 'bottom top' } })
//     gsap.to('.hero-blob-2', { y: -60, ease: 'none',
//       scrollTrigger: { trigger: sectionRef.current, scrub: 1.5, start: 'top top', end: 'bottom top' } })

//   }, { scope: sectionRef })

//   function handleSwatchClick(i: number) {
//     if (i === activeColor) return
//     gsap.to(shirtRef.current, {
//       rotationY: 90, duration: 0.2, ease: 'power2.in',
//       onComplete: () => {
//         setActiveColor(i)
//         gsap.fromTo(shirtRef.current, { rotationY: -90 }, { rotationY: 0, duration: 0.25, ease: 'power2.out' })
//       }
//     })
//   }

//   return (
//     <section ref={sectionRef} id="hero"
//       className="hero-section"
//       style={{ background: '#0E0E0E', minHeight: '100vh' }}>

//       {/* Grain overlay */}
//       <div className="grain-overlay" />

//       {/* Background blobs */}
//       <div className="hero-blob hero-blob-1"
//         style={{ background: 'rgba(200,241,53,0.12)', width: 600, height: 600, top: '-10%', right: '-8%' }}/>
//       <div className="hero-blob hero-blob-2"
//         style={{ background: 'rgba(255,91,58,0.08)', width: 400, height: 400, bottom: '5%', left: '-5%' }}/>
//       <div className="hero-blob"
//         style={{ background: 'rgba(58,186,255,0.07)', width: 350, height: 350, top: '30%', left: '40%' }}/>

//       <div className="hero-inner">
//         {/* Left — copy */}
//         <div className="hero-left-col">

//           <div className="hero-eyebrow">
//             <span className="hero-eyebrow-dot"/>
//             Design Studio — Now Live
//           </div>

//           {/* Masked headline */}
//           <h1 className="hero-h1">
//             <div className="hero-line-wrap">
//               <span className="hero-line-mask">
//                 {'DESIGN'.split('').map((c,i)=>(
//                   <span key={i} className="hero-char" style={{display:'inline-block',color:'white'}}>
//                     {c}
//                   </span>
//                 ))}
//               </span>
//             </div>
//             <div className="hero-line-wrap">
//               <span className="hero-line-mask">
//                 {'YOUR'.split('').map((c,i)=>(
//                   <span key={i} className="hero-char" style={{display:'inline-block',color:'white'}}>
//                     {c}
//                   </span>
//                 ))}
//               </span>
//             </div>
//             <div className="hero-line-wrap">
//               <span className="hero-line-mask">
//                 {'DRIP.'.split('').map((c,i)=>(
//                   <span key={i} className="hero-char hero-char-outline"
//                     style={{display:'inline-block'}}>
//                     {c}
//                   </span>
//                 ))}
//               </span>
//             </div>
//           </h1>

//           <p className="hero-sub-text">
//             Visualize custom embroidery and prints on any garment.<br/>
//             Design it here, order the real thing.
//           </p>

//           <div className="hero-ctas">
//             <div className="hero-cta-item">
//               <SignUpButton mode="modal">
//                 <button className="btn-hero-primary"
//                   onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.04,duration:0.2,ease:'power2.out'})}
//                   onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.3,ease:'driply-pop'})}>
//                   Start for free →
//                 </button>
//               </SignUpButton>
//             </div>
//             <div className="hero-cta-item">
//               <button className="btn-hero-ghost">
//                 <span className="play-circle">▶</span>
//                 Watch demo
//               </button>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="hero-stats">
//             {STATS.map((s, i) => (
//               <div key={i} className="hero-cta-item">
//                 <div className="stat-number" data-stat={i}>
//                   0{s.suffix}
//                 </div>
//                 <div className="stat-label">{s.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right — shirt */}
//         <div className="hero-right-col">
//           <div
//             ref={shirtRef}
//             className="hero-shirt-wrap"
//             style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
//           >
//             <ShirtSVG color={active.bg} collar={active.collar} size={380}/>
//           </div>

//           {/* Floating badges */}
//           <div className="hero-badge badge-pos-tl">
//             <span className="badge-dot" style={{background:'#3ABAFF'}}/>
//             Embroidery ready
//           </div>
//           <div className="hero-badge badge-pos-br">
//             <span className="badge-dot" style={{background:'#FF5B3A'}}/>
//             Print-on-demand
//           </div>
//           <div className="hero-badge badge-pos-ml"
//             style={{background:'#C8F135',color:'#0E0E0E',fontWeight:600}}>
//             ✦ 14 colors
//           </div>

//           {/* Swatch strip */}
//           <div className="hero-swatch-strip">
//             {SWATCHES.map((sw, i) => (
//               <button key={i} onClick={() => handleSwatchClick(i)}
//                 className="hero-swatch"
//                 style={{
//                   background:  sw.bg,
//                   borderColor: i===activeColor ? 'white' : 'transparent',
//                   transform:   i===activeColor ? 'scale(1.3)' : 'scale(1)',
//                   boxShadow:   i===activeColor ? '0 0 0 2px #0E0E0E, 0 0 0 4px white' : 'none',
//                 }}/>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Scroll indicator */}
//       <div className="scroll-indicator">
//         <div className="scroll-ind-track">
//           <div className="scroll-ind-ball"/>
//         </div>
//         <span>Scroll</span>
//       </div>
//     </section>
//   )
// }

// // ─── MARQUEE (velocity-reactive) ─────────────────────────────────────────────
// function Marquee() {
//   const trackRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     let speed = 1
//     let current = 0
//     let target  = 0
//     let lastY   = 0
//     let raf: number

//     const onScroll = () => {
//       const delta = window.scrollY - lastY
//       lastY = window.scrollY
//       target = Math.min(Math.abs(delta) * 0.5, 8)
//     }

//     function loop() {
//       current += (target - current) * 0.1
//       target  *= 0.92
//       speed    = 1 + current

//       if (trackRef.current) {
//         const currentX = parseFloat(gsap.getProperty(trackRef.current, 'x') as string) || 0
//         const newX = currentX - speed
//         const resetAt = -(trackRef.current.scrollWidth / 2)
//         gsap.set(trackRef.current, { x: newX <= resetAt ? 0 : newX })
//       }
//       raf = requestAnimationFrame(loop)
//     }

//     window.addEventListener('scroll', onScroll)
//     raf = requestAnimationFrame(loop)
//     return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
//   }, [])

//   const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

//   return (
//     <div className="marquee-section" style={{ background: '#0E0E0E', overflow: 'hidden', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
//       <div ref={trackRef} className="marquee-inner">
//         {doubled.map((item, i) => (
//           <span key={i} className="marquee-chip">
//             {item} <span className="marquee-star">✦</span>
//           </span>
//         ))}
//       </div>
//     </div>
//   )
// }

// // ─── PROCESS (pinned scroll steps) ────────────────────────────────────────────
// function Process() {
//   const sectionRef = useRef<HTMLElement>(null)

//   useGSAP(() => {
//     const steps = gsap.utils.toArray<HTMLElement>('.process-step-panel')

//     // Pin the section while steps scroll through
//     ScrollTrigger.create({
//       trigger:    sectionRef.current,
//       start:      'top top',
//       end:        `+=${steps.length * 100}%`,
//       pin:        true,
//       pinSpacing: true,
//     })

//     // For each step, animate it in and the current number
//     steps.forEach((step, i) => {
//       const progress = i / steps.length
//       const nextProgress = (i + 1) / steps.length

//       ScrollTrigger.create({
//         trigger:    sectionRef.current,
//         start:      `top+=${progress * steps.length * 100}% top`,
//         end:        `top+=${nextProgress * steps.length * 100}% top`,
//         onEnter: () => {
//           gsap.to(step, { opacity: 1, x: 0, duration: 0.6, ease: 'power4.out' })
//           gsap.to('.process-big-num', {
//             textContent: `0${i + 1}`,
//             duration: 0.3,
//             ease: 'power2.out',
//             snap: { textContent: 1 },
//           })
//           gsap.to('.process-progress-fill', {
//             height: `${((i + 1) / steps.length) * 100}%`,
//             duration: 0.5,
//             ease: 'power2.out',
//           })
//           // Accent bar color
//           gsap.to('.process-accent-bar', {
//             background: PROCESS_STEPS[i].accent,
//             duration: 0.4,
//           })
//         },
//         onLeaveBack: () => {
//           if (i > 0) {
//             gsap.to(step, { opacity: 0, x: 40, duration: 0.3, ease: 'power2.in' })
//             gsap.to('.process-big-num', {
//               textContent: `0${i}`,
//               duration: 0.3,
//               snap: { textContent: 1 },
//             })
//           }
//         },
//       })

//       // Initial state
//       if (i > 0) gsap.set(step, { opacity: 0, x: 40 })
//     })
//   }, { scope: sectionRef })

//   return (
//     <section ref={sectionRef} id="process" className="process-section">

//       {/* Left column — number + progress */}
//       <div className="process-left">
//         <div className="process-eyebrow">The process</div>
//         <div className="process-big-num">01</div>
//         <div className="process-progress-track">
//           <div className="process-progress-fill" style={{ height: `${1/PROCESS_STEPS.length*100}%` }}/>
//         </div>
//         <div className="process-accent-bar" style={{ background: PROCESS_STEPS[0].accent }}/>
//         <div className="process-step-count">{PROCESS_STEPS.length} steps to your drip</div>
//       </div>

//       {/* Right column — step panels */}
//       <div className="process-right">
//         <div className="process-overline">From idea to doorstep</div>
//         {PROCESS_STEPS.map((s, i) => (
//           <div key={i} className="process-step-panel">
//             <div className="process-step-num" style={{ color: s.accent }}>{s.num}</div>
//             <h3 className="process-step-title">{s.label}</h3>
//             <p className="process-step-body">{s.body}</p>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─── FEATURES ─────────────────────────────────────────────────────────────────
// function Features() {
//   const sectionRef = useRef<HTMLElement>(null)

//   useGSAP(() => {
//     // Heading reveal
//     gsap.from('.features-heading-line', {
//       yPercent:  100,
//       opacity:   0,
//       stagger:   0.08,
//       duration:  0.8,
//       ease:      'power4.out',
//       scrollTrigger: {
//         trigger: '.features-heading-wrap',
//         start:   'top 80%',
//         once:    true,
//       },
//     })

//     // Each feature card clips in
//     gsap.utils.toArray<HTMLElement>('.feat-clip-card').forEach((card, i) => {
//       gsap.fromTo(card,
//         { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
//         {
//           clipPath: 'inset(0% 0% 0% 0%)',
//           opacity:  1,
//           duration: 0.8,
//           delay:    i * 0.08,
//           ease:     'power4.out',
//           scrollTrigger: {
//             trigger:  card,
//             start:    'top 85%',
//             once:     true,
//           },
//         }
//       )
//     })

//   }, { scope: sectionRef })

//   return (
//     <section ref={sectionRef} id="features" className="features-section">

//       <div className="features-heading-wrap">
//         <div className="sect-eyebrow">What you get</div>
//         <h2 className="features-h2">
//           <div className="features-heading-line-wrap" style={{ overflow: 'hidden' }}>
//             <span className="features-heading-line">A full creative</span>
//           </div>
//           <div className="features-heading-line-wrap" style={{ overflow: 'hidden' }}>
//             <span className="features-heading-line">toolkit.</span>
//           </div>
//         </h2>
//         <p className="features-sub">
//           Every tool you need to go from blank canvas to production-ready artwork.
//           No design experience required.
//         </p>
//       </div>

//       <div className="features-grid">
//         {/* Dark tall */}
//         <div className="feat-clip-card feat-tall" style={{ background: '#0E0E0E', gridRow: 'span 2' }}>
//           <span className="feat-icon">{FEATURES[0].icon}</span>
//           <h3 className="feat-title" style={{ color: 'white' }}>{FEATURES[0].title}</h3>
//           <p className="feat-body" style={{ color: 'rgba(255,255,255,0.6)' }}>{FEATURES[0].body}</p>
//           <div className="feat-chips">
//             {FEATURES[0].chips.map((c, i) => (
//               <span key={i} className={`feat-chip ${i===0?'feat-chip-lime':'feat-chip-dark'}`}>{c}</span>
//             ))}
//           </div>
//         </div>

//         {FEATURES.slice(1).map((f, i) => (
//           <div key={i} className={`feat-clip-card ${i===3?'feat-wide':''}`}
//             style={{ background: f.color }}
//             onMouseEnter={e=>gsap.to(e.currentTarget,{scale:1.02,duration:0.25,ease:'power2.out'})}
//             onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:0.25})}>
//             <span className="feat-icon">{f.icon}</span>
//             <h3 className="feat-title" style={{ color: f.text }}>{f.title}</h3>
//             <p className="feat-body" style={{ color: f.text==='white'?'rgba(255,255,255,0.75)':'rgba(14,14,14,0.7)' }}>
//               {f.body}
//             </p>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─── GARMENTS (horizontal scroll gallery) ────────────────────────────────────
// function Garments() {
//   const sectionRef = useRef<HTMLElement>(null)
//   const trackRef   = useRef<HTMLDivElement>(null)

//   useGSAP(() => {
//     const track  = trackRef.current
//     if (!track) return
//     const totalW = track.scrollWidth
//     const viewW  = track.parentElement!.offsetWidth
//     const dist   = totalW - viewW

//     // Heading reveal
//     gsap.from('.garments-heading .gh-char', {
//       yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
//     })

//     // Pin and horizontally translate
//     gsap.to(track, {
//       x:    -dist,
//       ease: 'none',
//       scrollTrigger: {
//         trigger:    sectionRef.current,
//         start:      'top top',
//         end:        `+=${dist}`,
//         pin:        true,
//         pinSpacing: true,
//         scrub:      1.2,
//         anticipatePin: 1,
//       },
//     })

//     // Each card tilts slightly on the scroll
//     gsap.utils.toArray<HTMLElement>('.garment-hcard').forEach((card, i) => {
//       gsap.fromTo(card,
//         { rotationY: -8 },
//         {
//           rotationY: 4,
//           ease: 'none',
//           scrollTrigger: {
//             trigger:    sectionRef.current,
//             start:      'top top',
//             end:        `+=${dist}`,
//             scrub:      1,
//           },
//         }
//       )
//     })

//   }, { scope: sectionRef })

//   const title = 'Every garment.'

//   return (
//     <section ref={sectionRef} id="garments"
//       style={{ background: '#F8F5EF', overflow: 'hidden' }}>

//       <div style={{ padding: '5rem 4rem 2rem' }}>
//         <div className="sect-eyebrow">What you can design on</div>
//         <div className="garments-heading" style={{ overflow: 'hidden' }}>
//           <h2 className="garments-h2">
//             {title.split('').map((c, i) => (
//               <span key={i} className="gh-char" style={{ display: 'inline-block' }}>
//                 {c === ' ' ? '\u00A0' : c}
//               </span>
//             ))}
//             <br/>
//             <span style={{ WebkitTextStroke: '2px #0E0E0E', color: 'transparent' }}>
//               One place.
//             </span>
//           </h2>
//         </div>
//       </div>

//       <div style={{ overflow: 'hidden', paddingBottom: '4rem' }}>
//         <div ref={trackRef}
//           style={{ display: 'flex', gap: '1.25rem', padding: '1rem 4rem', width: 'max-content' }}>
//           {GARMENTS.map((g, i) => (
//             <div key={i} className="garment-hcard"
//               style={{ width: 260, aspectRatio: '3/4', borderRadius: 20,
//                 overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer' }}
//               onMouseEnter={e=>{
//                 gsap.to(e.currentTarget,{y:-8,scale:1.03,duration:0.3,ease:'power2.out'})
//                 gsap.to(e.currentTarget.querySelector('.g-label'),{y:0,duration:0.3,ease:'power2.out'})
//               }}
//               onMouseLeave={e=>{
//                 gsap.to(e.currentTarget,{y:0,scale:1,duration:0.3,ease:'power2.out'})
//               }}>
//               <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',
//                 justifyContent:'center',fontSize:'6rem',background:g.bg }}>
//                 {g.emoji}
//               </div>
//               <div className="g-label" style={{
//                 position:'absolute',bottom:0,left:0,right:0,
//                 padding:'2rem 1.25rem 1.25rem',
//                 background:'linear-gradient(transparent,rgba(0,0,0,0.65))',
//               }}>
//                 <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.05rem',color:'white' }}>{g.name}</div>
//                 <div style={{ fontSize:'0.73rem',color:'rgba(255,255,255,0.6)',marginTop:2 }}>{g.sub}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// // ─── DASHBOARD PREVIEW (clip-path wipe reveal) ────────────────────────────────
// function DashPreview() {
//   const sectionRef = useRef<HTMLElement>(null)

//   useGSAP(() => {
//     // Heading
//     gsap.from('.dash-preview-heading .dph-char', {
//       yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
//     })

//     // Clip wipe on the preview card
//     gsap.fromTo('.dash-preview-card',
//       { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 },
//       {
//         clipPath: 'inset(0% 0% 0% 0%)',
//         opacity:  1,
//         duration: 1.1,
//         ease:     'power4.out',
//         scrollTrigger: {
//           trigger: '.dash-preview-card',
//           start:   'top 80%',
//           once:    true,
//         },
//       }
//     )

//     // Panel items stagger
//     gsap.from('.dp-panel-item', {
//       x: -20, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power4.out',
//       scrollTrigger: { trigger: '.dash-preview-card', start: 'top 70%', once: true },
//     })

//   }, { scope: sectionRef })

//   const heading = 'The dashboard'

//   return (
//     <section ref={sectionRef} style={{ padding: '7rem 4rem', background: '#F8F5EF' }}>
//       <div className="sect-eyebrow">Design studio</div>
//       <div className="dash-preview-heading" style={{ overflow: 'hidden', marginBottom: '0.75rem' }}>
//         <h2 className="dash-h2">
//           {heading.split('').map((c,i)=>(
//             <span key={i} className="dph-char" style={{display:'inline-block'}}>
//               {c===' '?'\u00A0':c}
//             </span>
//           ))}
//           <br/>
//           <span style={{ color: '#C8F135', WebkitTextStroke: 'unset' }}>is your canvas.</span>
//         </h2>
//       </div>
//       <p style={{ fontSize:'1.05rem',fontWeight:300,color:'#3A3A3A',maxWidth:520,lineHeight:1.65,marginBottom:'3.5rem' }}>
//         Intuitive. Powerful. Built for first-timers and pros. Everything a click away.
//       </p>

//       <div className="dash-preview-card" style={{
//         background:'#1A1A1B',borderRadius:28,overflow:'hidden',
//         border:'1px solid rgba(255,255,255,0.05)',
//         boxShadow:'0 40px 100px rgba(0,0,0,0.3)',
//       }}>
//         {/* Mac-style topbar */}
//         <div style={{ background:'#252525',padding:'0.85rem 1.5rem',
//           display:'flex',alignItems:'center',justifyContent:'space-between',
//           borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
//           <div style={{ display:'flex',gap:6 }}>
//             {['#FF5B5B','#FFD60A','#2ACB5A'].map((c,i)=>(
//               <div key={i} style={{ width:12,height:12,borderRadius:'50%',background:c }}/>
//             ))}
//           </div>
//           <span style={{ fontFamily:'Syne,sans-serif',fontSize:'0.72rem',fontWeight:600,
//             letterSpacing:'0.05em',color:'rgba(255,255,255,0.3)' }}>
//             Driply Design Studio — My Collection v2
//           </span>
//           <div style={{ display:'flex',gap:8 }}>
//             <span style={{ background:'rgba(255,255,255,0.08)',borderRadius:6,padding:'0.3rem 0.75rem',
//               fontSize:'0.7rem',color:'rgba(255,255,255,0.45)' }}>Preview</span>
//             <span style={{ background:'#C8F135',borderRadius:6,padding:'0.3rem 0.75rem',
//               fontSize:'0.7rem',fontWeight:700,color:'#0E0E0E' }}>Save</span>
//           </div>
//         </div>

//         {/* Body: left / canvas / right */}
//         <div style={{ display:'grid',gridTemplateColumns:'200px 1fr 220px',height:440 }}>
//           {/* Left panel */}
//           <div style={{ background:'#1E1E1E',borderRight:'1px solid rgba(255,255,255,0.05)',
//             padding:'1.25rem 1rem',overflow:'hidden' }}>
//             <p style={{ fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',
//               color:'rgba(255,255,255,0.28)',marginBottom:'0.65rem' }}>Layers</p>
//             {[
//               { icon:'🔤', label:'Text — "YOUR DESIGN"', active:true },
//               { icon:'🖼', label:'Logo import' },
//               { icon:'⬤', label:'Shape layer'  },
//               { icon:'✦', label:'Embroidery zone' },
//             ].map((el, i)=>(
//               <div key={i} className="dp-panel-item" style={{
//                 display:'flex',alignItems:'center',gap:'0.55rem',
//                 padding:'0.45rem 0.6rem',borderRadius:8,marginBottom:2,cursor:'pointer',
//                 background: el.active?'rgba(200,241,53,0.1)':'transparent',
//                 color:      el.active?'#C8F135':'rgba(255,255,255,0.5)',
//                 border:     el.active?'1px solid rgba(200,241,53,0.18)':'1px solid transparent',
//                 fontSize:'0.75rem',
//               }}>
//                 <span>{el.icon}</span>
//                 <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
//                   fontWeight:el.active?500:400 }}>{el.label}</span>
//               </div>
//             ))}
//           </div>

//           {/* Canvas */}
//           <div style={{ background:'#2A2A2A',display:'flex',alignItems:'center',
//             justifyContent:'center',position:'relative',overflow:'hidden' }}>
//             <div style={{ position:'absolute',inset:0,
//               backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
//               backgroundSize:'28px 28px',pointerEvents:'none' }}/>
//             <div style={{ position:'relative',zIndex:2,display:'flex',flexDirection:'column',
//               alignItems:'center',animation:'gentleFloat 6s ease-in-out infinite' }}>
//               <svg viewBox="0 0 200 220" width="170" style={{ filter:'drop-shadow(0 12px 32px rgba(0,0,0,0.5))' }}>
//                 <path d="M50,52 L18,76 L36,92 L46,86 L46,200 L154,200 L154,86 L164,92 L182,76 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#C8F135"/>
//                 <path d="M92,52 C92,52 97,64 100,68 C103,64 108,52 108,52 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#9BBF10"/>
//                 <rect x="72" y="95" width="56" height="44" rx="3" fill="none"
//                   stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="4,3"/>
//                 <text x="100" y="112" textAnchor="middle" fontFamily="Syne,sans-serif"
//                   fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">YOUR</text>
//                 <text x="100" y="122" textAnchor="middle" fontFamily="Syne,sans-serif"
//                   fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">DESIGN</text>
//               </svg>
//               <span style={{ fontSize:'0.68rem',fontFamily:'Syne,sans-serif',fontWeight:700,
//                 textTransform:'uppercase',letterSpacing:'0.08em',
//                 border:'1px dashed rgba(200,241,53,0.4)',color:'rgba(200,241,53,0.7)',
//                 padding:'0.3rem 0.7rem',borderRadius:4,marginTop:4 }}>
//                 Text Layer · Active
//               </span>
//             </div>
//           </div>

//           {/* Right panel */}
//           <div style={{ background:'#1E1E1E',borderLeft:'1px solid rgba(255,255,255,0.05)',
//             padding:'1.25rem 1rem',overflow:'hidden' }}>
//             {[
//               { label:'Text Color', content: (
//                 <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
//                   {['#0E0E0E','#C8F135','#FF5B3A','#3ABAFF','#7B5BFF','white'].map((c,i)=>(
//                     <div key={i} style={{ width:20,height:20,borderRadius:'50%',background:c,cursor:'pointer',
//                       border: i===0?'2px solid white':'2px solid transparent',
//                       boxShadow: i===0?'0 0 0 2px #1E1E1E, 0 0 0 3.5px white':'none',
//                       transform: i===0?'scale(1.15)':'scale(1)' }}/>
//                   ))}
//                 </div>
//               )},
//               { label:'Font Size · 14px', content: (
//                 <div style={{ height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,position:'relative' }}>
//                   <div style={{ height:'100%',width:'40%',background:'#C8F135',borderRadius:2 }}/>
//                   <div style={{ position:'absolute',top:'50%',transform:'translate(-50%,-50%)',
//                     width:14,height:14,background:'white',borderRadius:'50%',
//                     boxShadow:'0 2px 6px rgba(0,0,0,0.4)',left:'40%' }}/>
//                 </div>
//               )},
//               { label:'Font Family', content: (
//                 <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
//                   {['Syne','Bebas','DM Sans'].map((f,i)=>(
//                     <span key={i} style={{ fontSize:'0.68rem',borderRadius:6,padding:'0.3rem 0.6rem',
//                       background: i===0?'rgba(200,241,53,0.15)':'rgba(255,255,255,0.07)',
//                       color:      i===0?'#C8F135':'rgba(255,255,255,0.5)',
//                       border:     i===0?'1px solid rgba(200,241,53,0.3)':'none' }}>{f}</span>
//                   ))}
//                 </div>
//               )},
//             ].map((prop, i)=>(
//               <div key={i} className="dp-panel-item" style={{ marginBottom:'1rem' }}>
//                 <p style={{ fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',
//                   color:'rgba(255,255,255,0.28)',marginBottom:'0.5rem' }}>{prop.label}</p>
//                 {prop.content}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }

// // ─── TESTIMONIALS (3D fly-in from different directions) ────────────────────────
// function Testimonials() {
//   const sectionRef = useRef<HTMLElement>(null)

//   useGSAP(() => {
//     gsap.from('.testi-heading .th-char', {
//       yPercent: 100, stagger: 0.025, duration: 0.7, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
//     })

//     TESTIMONIALS.forEach((t, i) => {
//       const fromX = t.from === 'left' ? -80 : t.from === 'right' ? 80 : 0
//       const fromY = t.from === 'bottom' ? 80 : 0
//       gsap.from(`[data-testi="${i}"]`, {
//         x:          fromX,
//         y:          fromY,
//         opacity:    0,
//         rotationY:  t.from === 'left' ? -15 : t.from === 'right' ? 15 : 0,
//         rotationX:  t.from === 'bottom' ? 10 : 0,
//         scale:      0.92,
//         duration:   0.75,
//         delay:      i * 0.12,
//         ease:       'power4.out',
//         scrollTrigger: {
//           trigger: `[data-testi="${i}"]`,
//           start:   'top 85%',
//           once:    true,
//         },
//       })
//     })
//   }, { scope: sectionRef })

//   const heading = 'They designed.'

//   return (
//     <section ref={sectionRef} style={{ background: '#0E0E0E', padding: '7rem 4rem' }}>
//       <div className="sect-eyebrow" style={{ color: 'rgba(255,255,255,0.35)' }}>Real users</div>
//       <div className="testi-heading" style={{ overflow: 'hidden', marginBottom: '4rem' }}>
//         <h2 style={{
//           fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white',
//           fontSize: 'clamp(2.5rem,4vw,3.75rem)', letterSpacing: '-0.035em', lineHeight: 1,
//         }}>
//           {heading.split('').map((c,i)=>(
//             <span key={i} className="th-char" style={{display:'inline-block'}}>
//               {c===' '?'\u00A0':c}
//             </span>
//           ))}
//           <br/>
//           <span style={{ color: '#C8F135' }}>They loved it.</span>
//         </h2>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
//         {TESTIMONIALS.map((t, i) => (
//           <div key={i} data-testi={i}
//             style={{ background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',
//               borderRadius:20,padding:'2rem',transformStyle:'preserve-3d',cursor:'default' }}
//             onMouseEnter={e=>gsap.to(e.currentTarget,{y:-8,scale:1.02,duration:0.3,ease:'power2.out',
//               boxShadow:'0 20px 40px rgba(0,0,0,0.3)'})}
//             onMouseLeave={e=>gsap.to(e.currentTarget,{y:0,scale:1,duration:0.3,ease:'power2.out',
//               boxShadow:'none'})}>
//             <div style={{ color:'#C8F135',letterSpacing:'0.1em',marginBottom:'1rem' }}>★★★★★</div>
//             <p style={{ fontSize:'0.95rem',fontWeight:300,lineHeight:1.7,
//               color:'rgba(255,255,255,0.75)',marginBottom:'1.5rem',fontStyle:'italic' }}>
//               "{t.quote}"
//             </p>
//             <div style={{ display:'flex',alignItems:'center',gap:'0.75rem' }}>
//               <div style={{ width:38,height:38,borderRadius:'50%',flexShrink:0,
//                 background:t.color,display:'flex',alignItems:'center',justifyContent:'center',
//                 fontSize:'0.85rem',fontWeight:700,color:'#0E0E0E' }}>
//                 {t.initials}
//               </div>
//               <div>
//                 <div style={{ fontSize:'0.83rem',fontWeight:500,color:'rgba(255,255,255,0.85)' }}>{t.name}</div>
//                 <div style={{ fontSize:'0.73rem',color:'rgba(255,255,255,0.35)' }}>{t.role}</div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─── CTA (magnetic fullscreen) ────────────────────────────────────────────────
// function CTA() {
//   const sectionRef = useRef<HTMLElement>(null)
//   const btnRef     = useRef<HTMLButtonElement>(null)

//   useGSAP(() => {
//     gsap.from('.cta-heading .ctah-char', {
//       yPercent: 100, stagger: 0.03, duration: 0.8, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
//     })
//     gsap.from('.cta-sub', {
//       y: 24, opacity: 0, duration: 0.7, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true, delay: 0.3 },
//     })
//     gsap.from('.cta-btns > *', {
//       y: 24, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power4.out',
//       scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true, delay: 0.5 },
//     })
//   }, { scope: sectionRef })

//   function magneticMove(e: React.MouseEvent<HTMLElement>) {
//     const rect = e.currentTarget.getBoundingClientRect()
//     const dx   = (e.clientX - rect.left - rect.width  / 2) * 0.3
//     const dy   = (e.clientY - rect.top  - rect.height / 2) * 0.3
//     gsap.to(e.currentTarget, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' })
//   }
//   function magneticLeave(e: React.MouseEvent<HTMLElement>) {
//     gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: 'driply-pop' })
//   }

//   const heading = 'YOUR DRIP, STARTS HERE.'

//   return (
//     <section ref={sectionRef}
//       style={{ padding:'8rem 4rem',textAlign:'center',background:'#F8F5EF',position:'relative',overflow:'hidden' }}>

//       {/* Big decorative blobs */}
//       <div style={{ position:'absolute',width:600,height:600,borderRadius:'50%',background:'#C8F135',
//         opacity:0.1,top:-200,left:-100,filter:'blur(80px)',pointerEvents:'none' }}/>
//       <div style={{ position:'absolute',width:400,height:400,borderRadius:'50%',background:'#FF5B3A',
//         opacity:0.09,bottom:-100,right:0,filter:'blur(80px)',pointerEvents:'none' }}/>

//       <div className="cta-heading" style={{ overflow:'hidden',marginBottom:'1.5rem' }}>
//         <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,
//           fontSize:'clamp(2.5rem,6vw,5rem)',letterSpacing:'-0.04em',lineHeight:0.95,color:'#0E0E0E' }}>
//           {heading.split('').map((c,i)=>(
//             <span key={i} className="ctah-char" style={{ display:'inline-block' }}>
//               {c===' '?'\u00A0':c}
//             </span>
//           ))}
//         </h2>
//       </div>

//       <p className="cta-sub" style={{ fontSize:'1.05rem',fontWeight:300,color:'#3A3A3A',
//         maxWidth:480,margin:'0 auto 3rem',lineHeight:1.65 }}>
//         Join thousands of individuals, brands and organizations. Free to start.
//       </p>

//       <div className="cta-btns"
//         style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'1rem',flexWrap:'wrap' }}>
//         <SignUpButton mode="modal">
//           <button
//             onMouseMove={magneticMove} onMouseLeave={magneticLeave}
//             style={{ padding:'1.1rem 2.75rem',background:'#0E0E0E',color:'white',
//               fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:800,
//               border:'none',borderRadius:100,cursor:'pointer',display:'inline-block',
//               willChange:'transform' }}>
//             Create your first design →
//           </button>
//         </SignUpButton>
//         <Link to="/dashboard"
//           onMouseMove={magneticMove} onMouseLeave={magneticLeave}
//           style={{ padding:'1.05rem 2.25rem',color:'#0E0E0E',background:'none',
//             border:'1.5px solid rgba(14,14,14,0.22)',borderRadius:100,textDecoration:'none',
//             fontFamily:'Syne,sans-serif',fontSize:'0.95rem',fontWeight:600,display:'inline-block',
//             willChange:'transform' }}>
//           Explore the studio
//         </Link>
//       </div>
//     </section>
//   )
// }

// // ─── FOOTER ───────────────────────────────────────────────────────────────────
// function Footer() {
//   const COLS = [
//     { title:'Product', links:['Dashboard','Garment catalog','Embroidery','Bulk orders'] },
//     { title:'Company', links:['About','Blog','Careers','Contact']                       },
//     { title:'Legal',   links:['Privacy','Terms','Cookies']                              },
//   ]

//   function hoverLink(e: React.MouseEvent<HTMLAnchorElement>) {
//     gsap.to(e.currentTarget, { x: 4, duration: 0.2, ease: 'power2.out' })
//   }
//   function unhoverLink(e: React.MouseEvent<HTMLAnchorElement>) {
//     gsap.to(e.currentTarget, { x: 0, duration: 0.3, ease: 'driply-pop' })
//   }

//   return (
//     <footer style={{ background: '#0E0E0E', padding: '4rem 4rem 2.5rem' }}>
//       <div className="rp-footer-grid">
//         <div>
//           <div style={{ fontFamily:'Syne,sans-serif',fontSize:'1.5rem',fontWeight:800,
//             color:'white',letterSpacing:'-0.03em',marginBottom:'1rem' }}>
//             Drip<span style={{ color:'#FF5B3A' }}>ly</span>
//           </div>
//           <p style={{ fontSize:'0.875rem',color:'rgba(255,255,255,0.4)',lineHeight:1.65,maxWidth:260 }}>
//             Design your drip. Visualize custom prints and embroidery on any garment, then order the real thing.
//           </p>
//           <div style={{ display:'flex',gap:'0.75rem',marginTop:'1.5rem' }}>
//             {['Twitter / X','Instagram','LinkedIn'].map((s,i)=>(
//               <a key={i} href="#"
//                 style={{ fontSize:'0.72rem',color:'rgba(255,255,255,0.35)',textDecoration:'none',
//                   border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'0.35rem 0.85rem',
//                   transition:'all 0.2s' }}
//                 onMouseEnter={e=>gsap.to(e.currentTarget,{borderColor:'rgba(200,241,53,0.5)',
//                   color:'#C8F135',duration:0.2})}
//                 onMouseLeave={e=>gsap.to(e.currentTarget,{borderColor:'rgba(255,255,255,0.1)',
//                   color:'rgba(255,255,255,0.35)',duration:0.2})}>
//                 {s}
//               </a>
//             ))}
//           </div>
//         </div>
//         {COLS.map(col=>(
//           <div key={col.title}>
//             <h5 style={{ fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',
//               color:'rgba(255,255,255,0.28)',marginBottom:'1.25rem' }}>{col.title}</h5>
//             <ul style={{ listStyle:'none',padding:0 }}>
//               {col.links.map(l=>(
//                 <li key={l} style={{ marginBottom:'0.6rem' }}>
//                   <a href="#"
//                     onMouseEnter={hoverLink} onMouseLeave={unhoverLink}
//                     style={{ fontSize:'0.875rem',color:'rgba(255,255,255,0.5)',
//                       textDecoration:'none',display:'inline-block',transition:'color 0.2s' }}>
//                     {l}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//       <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
//         borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:'1.5rem' }}>
//         <span style={{ fontSize:'0.78rem',color:'rgba(255,255,255,0.22)' }}>
//           © 2025 Driply. All rights reserved.
//         </span>
//         <span style={{ fontSize:'0.78rem',color:'rgba(255,255,255,0.22)' }}>
//           Made with <span style={{ color:'#FF5B3A' }}>♥</span> for creators everywhere
//         </span>
//       </div>
//     </footer>
//   )
// }

// // ─── ROOT ─────────────────────────────────────────────────────────────────────
// export default function DriplyLanding() {
//   useLenis()

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//         html { scroll-behavior: auto; } /* Lenis handles smooth scroll */
//         body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

//         /* ── Custom cursor ── */
//         * { cursor: none !important; }
//         .cursor-dot {
//           position: fixed; top: 0; left: 0; z-index: 9999;
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #C8F135; pointer-events: none;
//           transform: translate(-50%,-50%);
//           mix-blend-mode: difference;
//         }
//         .cursor-ring {
//           position: fixed; top: 0; left: 0; z-index: 9998;
//           width: 36px; height: 36px; border-radius: 50%;
//           border: 1.5px solid rgba(200,241,53,0.7);
//           pointer-events: none;
//           transform: translate(-50%,-50%);
//           opacity: 0.7;
//         }
//         @media (hover: none) { .cursor-dot, .cursor-ring { display: none !important; } * { cursor: auto !important; } }

//         /* ── Grain ── */
//         .grain-overlay {
//           position: absolute; inset: 0; z-index: 1; pointer-events: none;
//           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
//           opacity: 0.35;
//         }

//         /* ── Nav ── */
//         .nav-shell {
//           position: fixed; top: 0; left: 0; right: 0; z-index: 100;
//           display: grid; grid-template-columns: 1fr auto 1fr;
//           align-items: center; padding: 1.25rem 3.5rem;
//         }
//         .nav-dark {
//           background: transparent;
//           border-bottom: 1px solid rgba(255,255,255,0.07);
//         }
//         .nav-light {
//           background: rgba(248,245,239,0.92);
//           backdrop-filter: blur(16px);
//           border-bottom: 1px solid rgba(14,14,14,0.06);
//           box-shadow: 0 1px 20px rgba(0,0,0,0.05);
//         }
//         .nav-logo { font-family: 'Syne',sans-serif; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; text-decoration: none; transition: color 0.4s; }
//         .nav-link-text { font-size: 0.875rem; font-weight: 500; text-decoration: none; letter-spacing: 0.01em; transition: color 0.2s; display: inline-block; }
//         .nav-cta-wrap { display: flex; align-items: center; gap: 0.85rem; justify-content: flex-end; }
//         .btn-nav-ghost {
//           font-size: 0.875rem; font-weight: 500;
//           border-width: 1.5px; border-style: solid;
//           padding: 0.5rem 1.25rem; border-radius: 100px; cursor: pointer;
//           background: none; transition: border-color 0.2s, color 0.2s;
//         }
//         .btn-nav-primary {
//           font-size: 0.875rem; font-weight: 600;
//           background: #C8F135; color: #0E0E0E;
//           border: none; padding: 0.55rem 1.35rem;
//           border-radius: 100px; cursor: pointer; text-decoration: none;
//           transition: background 0.2s, color 0.2s;
//           font-family: 'Syne', sans-serif;
//         }
//         .btn-nav-primary:hover { background: #9BBF10; color: white; }

//         @media (max-width:1023px) {
//           .nav-shell { grid-template-columns: 1fr auto; padding: 1.1rem 1.5rem; }
//         }

//         /* ── Hero ── */
//         .hero-section { position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
//         .hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
//         .hero-inner {
//           display: grid; grid-template-columns: 1fr 1fr;
//           min-height: 100vh; padding-top: 7rem; position: relative; z-index: 2;
//         }
//         .hero-left-col { display: flex; flex-direction: column; justify-content: center; padding: 3rem 3rem 3rem 4rem; }
//         .hero-right-col { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
//         .hero-eyebrow {
//           display: inline-flex; align-items: center; gap: 0.5rem;
//           background: rgba(200,241,53,0.12); border: 1px solid rgba(200,241,53,0.25);
//           color: #C8F135; font-size: 0.72rem; font-weight: 600;
//           letter-spacing: 0.08em; text-transform: uppercase;
//           padding: 0.4rem 1rem; border-radius: 100px;
//           width: fit-content; margin-bottom: 2rem;
//         }
//         .hero-eyebrow-dot {
//           width: 6px; height: 6px; border-radius: 50%; background: #C8F135; flex-shrink: 0;
//           animation: heroEyebrowPulse 2s infinite;
//         }
//         @keyframes heroEyebrowPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

//         .hero-h1 {
//           font-family: 'Syne', sans-serif; font-weight: 800;
//           font-size: clamp(4rem, 6.5vw, 7rem);
//           line-height: 0.9; letter-spacing: -0.05em;
//           margin-bottom: 1.75rem;
//         }
//         .hero-line-wrap { display: block; }
//         .hero-line-mask { display: inline-block; overflow: hidden; vertical-align: bottom; }
//         .hero-char-outline {
//           color: transparent !important;
//           -webkit-text-stroke: 2.5px #C8F135;
//         }

//         .hero-sub-text {
//           font-size: 1.05rem; font-weight: 300; color: rgba(255,255,255,0.6);
//           line-height: 1.65; max-width: 420px; margin-bottom: 2.5rem;
//         }
//         .hero-ctas { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; margin-bottom: 3rem; }
//         .btn-hero-primary {
//           display: inline-flex; align-items: center;
//           background: #C8F135; color: #0E0E0E;
//           font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
//           padding: 1rem 2.25rem; border-radius: 100px; border: none; cursor: pointer;
//           transition: background 0.2s; will-change: transform;
//         }
//         .btn-hero-primary:hover { background: #9BBF10; color: white; }
//         .btn-hero-ghost {
//           display: inline-flex; align-items: center; gap: 0.75rem;
//           color: rgba(255,255,255,0.6); font-size: 1rem;
//           background: none; border: none; cursor: pointer;
//           transition: color 0.2s;
//         }
//         .btn-hero-ghost:hover { color: white; }
//         .play-circle {
//           width: 42px; height: 42px; border-radius: 50%;
//           border: 1.5px solid rgba(255,255,255,0.3);
//           display: flex; align-items: center; justify-content: center;
//           font-size: 0.8rem; color: white; flex-shrink: 0;
//           transition: border-color 0.2s, background 0.2s;
//         }
//         .btn-hero-ghost:hover .play-circle { border-color: white; background: rgba(255,255,255,0.08); }

//         .hero-stats {
//           display: flex; gap: 2.5rem;
//           border-top: 1px solid rgba(255,255,255,0.1);
//           padding-top: 1.75rem;
//         }
//         .stat-number {
//           font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
//           color: white; letter-spacing: -0.03em;
//         }
//         .stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.15rem; }

//         .hero-shirt-wrap {
//           animation: heroShirtFloat 6s ease-in-out infinite;
//           transform-origin: center;
//         }
//         @keyframes heroShirtFloat {
//           0%,100% { transform: translateY(0px) rotate(-1.5deg); }
//           50%      { transform: translateY(-18px) rotate(1.5deg); }
//         }

//         .hero-badge {
//           position: absolute; z-index: 10;
//           display: flex; align-items: center; gap: 0.5rem;
//           background: #0E0E0E; color: white;
//           font-size: 0.75rem; font-weight: 500;
//           padding: 0.55rem 1rem; border-radius: 16px;
//           box-shadow: 0 8px 24px rgba(0,0,0,0.3); white-space: nowrap;
//           animation: badgeDrift 9s ease-in-out infinite;
//         }
//         .badge-pos-tl { top: 16%; left: 3%; animation-delay: 0s; }
//         .badge-pos-br { bottom: 20%; right: 2%; animation-delay: 1.2s; }
//         .badge-pos-ml { top: 54%; left: -2%; animation-delay: 0.6s; }
//         .badge-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
//         @keyframes badgeDrift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

//         .hero-swatch-strip {
//           position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%);
//           display: flex; gap: 8px; z-index: 10;
//           background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
//           padding: 0.6rem 1rem; border-radius: 100px;
//           border: 1px solid rgba(255,255,255,0.12);
//         }
//         .hero-swatch {
//           width: 22px; height: 22px; border-radius: 50%; border-width: 2px; border-style: solid;
//           cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
//         }

//         .scroll-indicator {
//           position: absolute; bottom: 2.5rem; left: 50%; transform: translateX(-50%);
//           z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
//           color: rgba(255,255,255,0.4); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
//         }
//         .scroll-ind-track {
//           width: 1px; height: 48px; background: rgba(255,255,255,0.15); position: relative; overflow: hidden;
//         }
//         .scroll-ind-ball {
//           width: 1px; height: 16px; background: #C8F135; position: absolute;
//           top: 0; animation: scrollBallDrop 1.6s ease-in-out infinite;
//         }
//         @keyframes scrollBallDrop { 0%{top:0;opacity:1} 80%{top:100%;opacity:1} 100%{top:100%;opacity:0} }

//         /* ── Marquee ── */
//         .marquee-inner { display: flex; white-space: nowrap; width: max-content; }
//         .marquee-chip {
//           display: inline-flex; align-items: center; gap: 1.25rem;
//           padding: 0 2rem;
//           font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 600;
//           letter-spacing: 0.06em; text-transform: uppercase;
//           color: rgba(255,255,255,0.45);
//         }
//         .marquee-star { color: #FF5B3A; }

//         /* ── Process ── */
//         .process-section {
//           display: grid; grid-template-columns: 280px 1fr;
//           min-height: 100vh; background: #F8F5EF;
//           align-items: center;
//         }
//         .process-left {
//           padding: 4rem 3rem; position: relative;
//           border-right: 1px solid rgba(14,14,14,0.08);
//           height: 100%; display: flex; flex-direction: column; justify-content: center;
//         }
//         .process-eyebrow {
//           font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
//           text-transform: uppercase; color: #888; margin-bottom: 1rem;
//         }
//         .process-big-num {
//           font-family: 'Syne', sans-serif; font-size: 8rem; font-weight: 800;
//           line-height: 1; letter-spacing: -0.05em; color: #0E0E0E;
//           margin-bottom: 2rem;
//         }
//         .process-progress-track {
//           width: 3px; height: 120px; background: rgba(14,14,14,0.1);
//           border-radius: 2px; position: relative; margin-bottom: 1rem;
//         }
//         .process-progress-fill {
//           position: absolute; top: 0; left: 0; right: 0;
//           background: #C8F135; border-radius: 2px; transition: height 0.5s ease;
//         }
//         .process-accent-bar {
//           width: 40px; height: 4px; border-radius: 2px; margin-bottom: 1.5rem;
//           transition: background 0.4s ease;
//         }
//         .process-step-count { font-size: 0.78rem; color: #888; }
//         .process-right { padding: 4rem; position: relative; overflow: hidden; }
//         .process-overline {
//           font-family: 'Syne', sans-serif; font-size: clamp(2.5rem,4vw,3.5rem);
//           font-weight: 800; letter-spacing: -0.03em; color: rgba(14,14,14,0.08);
//           margin-bottom: 2rem; line-height: 1;
//         }
//         .process-step-panel {
//           position: absolute; top: 50%; transform: translateY(-50%);
//           padding-left: 0;
//         }
//         .process-step-num {
//           font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700;
//           letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem;
//         }
//         .process-step-title {
//           font-family: 'Syne', sans-serif; font-size: clamp(2rem,3.5vw,3rem);
//           font-weight: 800; letter-spacing: -0.03em; color: #0E0E0E; margin-bottom: 1rem; line-height: 1;
//         }
//         .process-step-body {
//           font-size: 1rem; font-weight: 300; color: #3A3A3A; max-width: 520px; line-height: 1.7;
//         }

//         /* ── Features ── */
//         .features-section { padding: 7rem 4rem; background: #F8F5EF; }
//         .sect-eyebrow {
//           font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
//           text-transform: uppercase; color: #888; margin-bottom: 1rem;
//         }
//         .features-heading-wrap { margin-bottom: 4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: end; }
//         .features-h2 {
//           font-family: 'Syne', sans-serif; font-size: clamp(2.75rem,4.5vw,4rem);
//           font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; color: #0E0E0E;
//         }
//         .features-heading-line { display: block; }
//         .features-sub { font-size: 1.05rem; font-weight: 300; color: #3A3A3A; line-height: 1.65; }
//         .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem; }
//         .feat-clip-card {
//           border-radius: 24px; padding: 2.25rem; cursor: default;
//           transition: transform 0.25s; will-change: clip-path;
//         }
//         .feat-wide { grid-column: span 2; }
//         .feat-icon { font-size: 2.5rem; margin-bottom: 1.25rem; display: block; }
//         .feat-title { font-family: 'Syne',sans-serif; font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.6rem; }
//         .feat-body { font-size: 0.875rem; font-weight: 300; line-height: 1.65; }
//         .feat-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 1.25rem; }
//         .feat-chip { font-size: 0.75rem; border-radius: 100px; padding: 0.35rem 0.85rem; }
//         .feat-chip-lime { background: #C8F135; color: #0E0E0E; font-weight: 500; }
//         .feat-chip-dark { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }

//         /* ── Garments h-scroll ── */
//         .garments-h2 {
//           font-family: 'Syne',sans-serif; font-size: clamp(3rem,5vw,5rem);
//           font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; color: #0E0E0E;
//           margin-bottom: 0.5rem;
//         }

//         /* ── Dashboard preview ── */
//         .dash-h2 {
//           font-family: 'Syne',sans-serif; font-size: clamp(2.5rem,4vw,3.75rem);
//           font-weight: 800; letter-spacing: -0.035em; line-height: 1; color: #0E0E0E;
//         }
//         @keyframes gentleFloat {
//           0%,100% { transform: translateY(0px) rotate(-0.5deg); }
//           50%      { transform: translateY(-10px) rotate(0.5deg); }
//         }

//         /* ── Misc ── */
//         a { cursor: none; }
//       `}</style>

//       <CustomCursor />

//       <div style={{ background: '#F8F5EF', color: '#0E0E0E', overflowX: 'hidden' }}>
//         <Nav />
//         <Hero />
//         <Marquee />
//         <Process />
//         <Features />
//         <Garments />
//         <DashPreview />
//         <Testimonials />
//         <CTA />
//         <Footer />
//       </div>
//     </>
//   )
// }









// ============================================================
//  DRIPLY — Landing Page
//  app/routes/index.tsx
//
//  Stack: TanStack Start · Tailwind v4 · Clerk
//
//  SETUP (run once before using this file):
//  ─────────────────────────────────────────
//  1. npx create-tsrouter-app@latest driply --template start
//  2. cd driply
//  3. npm install tailwindcss @tailwindcss/vite
//  4. npm install @clerk/tanstack-start
//  5. npm install clsx
//
//  In vite.config.ts add:
//    import tailwindcss from '@tailwindcss/vite'
//    plugins: [tailwindcss(), ...]
//
//  In index.css (top of file):
//    @import "tailwindcss";
//    ... then paste the CSS BLOCK from the bottom of this file
//
//  In app.tsx / __root.tsx add ClerkProvider wrapping your outlet.
//  Add VITE_CLERK_PUBLISHABLE_KEY to your .env file.
// ============================================================

// import { SignInButton, SignUpButton, useUser } from '@clerk/tanstack-start'
//  import { useGSAP } from '@gsap/react'
// import { createFileRoute, Link } from '@tanstack/react-router'
//  import gsap from 'gsap'
// import { useEffect, useRef, useState } from 'react'

//  gsap.registerPlugin(useGSAP)

// export const Route = createFileRoute('/')({
//   component: HomePage,
// })

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface RevealProps {
//   children: React.ReactNode
//   delay?: number
//   className?: string
// }

// // ─── Scroll reveal hook ───────────────────────────────────────────────────────
// function useReveal() {
//   const ref = useRef<HTMLDivElement>(null)
//   const [visible, setVisible] = useState(false)
//   useEffect(() => {
//     const obs = new IntersectionObserver(
//       ([e]) => { if (e.isIntersecting) setVisible(true) },
//       { threshold: 0.12 }
//     )
//     if (ref.current) obs.observe(ref.current)
//     return () => obs.disconnect()
//   }, [])
//   return [ref, visible] as const
// }

// function Reveal({ children, delay = 0, className = '' }: RevealProps) {
//   const [ref, visible] = useReveal()
//   return (
//     <div
//       ref={ref}
//       className={className}
//       style={{
//         opacity: visible ? 1 : 0,
//         transform: visible ? 'translateY(0)' : 'translateY(28px)',
//         transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
//       }}
//     >
//       {children}
//     </div>
//   )
// }

// // ─── Data ─────────────────────────────────────────────────────────────────────
// const SWATCHES = [
//   { bg: '#2ECEFF', collar: '#1AAFEA', label: 'Sky Blue'  },
//   { bg: '#FF5B3A', collar: '#c94424', label: 'Coral'     },
//   { bg: '#C8F135', collar: '#9BBF10', label: 'Lime'      },
//   { bg: '#0E0E0E', collar: '#050505', label: 'Ink'       },
//   { bg: '#F0EDE8', collar: '#d8d4cf', label: 'Cream'     },
//   { bg: '#7B5BFF', collar: '#5a3fdd', label: 'Violet'    },
//   { bg: '#FFD60A', collar: '#d4b000', label: 'Amber'     },
// ]

// const NAV_LINKS = [
//   { label: 'How it works', href: '#how'      },
//   { label: 'Features',     href: '#features' },
//   { label: 'Products',     href: '#products' },
//   { label: 'Pricing',      href: '#pricing'  },
// ]

// const STATS = [
//   { value: '50+', label: 'Garment types'    },
//   { value: '∞',   label: 'Design combos'   },
//   { value: '24h', label: 'Quote turnaround' },
// ]

// const STEPS = [
//   {
//     num: '01', emoji: '🎨', bg: '#C8F135',
//     title: 'Pick & Design',
//     desc:  'Choose any garment, then go wild in the design dashboard. Add text, logos, embroidery, prints — whatever\'s in your head.',
//   },
//   {
//     num: '02', emoji: '✓', bg: '#3ABAFF',
//     title: 'Customize & Confirm',
//     desc:  'Set quantities, color variations, sizing breakdowns and review your full order summary before anything goes to production.',
//   },
//   {
//     num: '03', emoji: '📦', bg: '#FF5B3A',
//     title: 'Produced & Shipped',
//     desc:  'Your physical order gets processed by our production partners and delivered right to you. No middlemen, no mysteries.',
//   },
// ]

// const FONT_CHIPS = ['Syne Display', 'DM Sans', 'Bebas Neue', 'Playfair', 'Oswald', '+ 200 more']

// const GARMENTS = [
//   { emoji: '👒', name: 'Face Caps',   sub: '6-panel, snapback & more', bg: '#E8F4FF' },
//   { emoji: '👕', name: 'T-Shirts',    sub: 'Crew, V-neck, oversized',  bg: '#FFF0E8' },
//   { emoji: '🧥', name: 'Hoodies',     sub: 'Pullover, zip-up & coach', bg: '#F0FFE8' },
//   { emoji: '🧣', name: 'Scarves',     sub: 'Woven & printed',          bg: '#FFF8E8' },
//   { emoji: '👔', name: 'Polo Shirts', sub: 'Classic & slim fit',       bg: '#F0E8FF' },
//   { emoji: '🩳', name: 'Shorts',      sub: 'Athletic & casual',        bg: '#E8FFF4' },
//   { emoji: '👜', name: 'Tote Bags',   sub: 'Cotton & canvas',          bg: '#FFE8F0' },
// ]

// const TESTIMONIALS = [
//   {
//     text:     'We ordered custom hoodies for our whole team. The dashboard is incredibly intuitive — I had the design locked in less than 20 minutes.',
//     initials: 'AK', color: '#C8F135',
//     name:     'Adaeze K.', role: 'Startup founder, Lagos',
//   },
//   {
//     text:     'The color preview is a game changer. What you see really is what you get. First batch of caps came out exactly like the mockup.',
//     initials: 'MR', color: '#3ABAFF',
//     name:     'Marcus R.', role: 'Streetwear brand, London',
//   },
//   {
//     text:     'Our sports club uses Driply for jersey orders every season. The quantity breakdown and color variation tools save us so much time.',
//     initials: 'YB', color: '#FF5B3A',
//     name:     'Yemi B.', role: 'Club manager, Abuja',
//   },
// ]

// const MARQUEE_ITEMS = [
//   'Face Caps','T-Shirts','Hoodies','Scarves','Trousers',
//   'Jackets','Jerseys','Beanies','Polo Shirts','Tote Bags',
// ]

// // ─── Shirt SVG ────────────────────────────────────────────────────────────────
// function ShirtSVG({ color = '#2ECEFF', collarColor = '#1AAFEA', width = 340 }) {
//   return (
//     <svg
//       viewBox="0 0 340 400"
//       width={width}
//       xmlns="http://www.w3.org/2000/svg"
//       style={{ filter: 'drop-shadow(0 28px 56px rgba(0,0,0,0.16))' }}
//     >
//       <path
//         d="M85,90 L30,130 L60,160 L80,148 L80,350 L260,350 L260,148 L280,160 L310,130 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 Z"
//         fill={color}
//         style={{ transition: 'fill 0.35s ease' }}
//       />
//       <path
//         d="M155,90 C155,90 163,108 170,115 C177,108 185,90 185,90 L255,90 C240,105 220,115 170,115 C120,115 100,105 85,90 L140,75 C145,82 155,90 155,90 Z"
//         fill={collarColor}
//         style={{ transition: 'fill 0.35s ease' }}
//       />
//       <path d="M30,130 L60,160 L80,148 L80,130 Z"  fill="rgba(0,0,0,0.07)" />
//       <path d="M310,130 L280,160 L260,148 L260,130 Z" fill="rgba(0,0,0,0.07)" />
//       <rect x="120" y="165" width="100" height="80" rx="6"
//         fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="6,4" />
//       <text x="170" y="200" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">YOUR</text>
//       <text x="170" y="218" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">DESIGN</text>
//       <text x="170" y="234" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="13" fill="rgba(255,255,255,0.92)" letterSpacing="2">HERE</text>
//       <circle cx="230" cy="175" r="12" fill="rgba(255,255,255,0.13)" />
//       <text x="230" y="179" textAnchor="middle" fontFamily="Syne,sans-serif"
//         fontWeight="800" fontSize="8" fill="white">D</text>
//     </svg>
//   )
// }

// // ─── Section label + heading helper ──────────────────────────────────────────
// function SectionHeading({
//   label, heading, sub,
// }: { label: string; heading: React.ReactNode; sub?: string }) {
//   return (
//     <Reveal>
//       <span className="section-label">{label}</span>
//       <h2 className="section-h2 mt-3 mb-4">{heading}</h2>
//       {sub && <p className="section-sub">{sub}</p>}
//     </Reveal>
//   )
// }


// // ─────────────────────────────────────────────────────────────────────────────
// //  NAV
// // ─────────────────────────────────────────────────────────────────────────────
// function Nav() {
//   const [scrolled, setScrolled] = useState(false)
//   const [menuOpen, setMenuOpen]     = useState(false)
//   const { isSignedIn } = useUser()

//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 24)
//     window.addEventListener('scroll', fn)
//     return () => window.removeEventListener('scroll', fn)
//   }, [])

//   useEffect(() => {
//     document.body.style.overflow = menuOpen ? 'hidden' : ''
//     return () => { document.body.style.overflow = '' }
//   }, [menuOpen])

//   return (
//     <>
//       <nav className={`nav-shell ${scrolled ? 'nav-scrolled' : 'nav-top'}`}>
//         {/* Logo — always visible */}
//         <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
//           Drip<span className="text-[#FF5B3A]">ly</span>
//         </Link>

//         {/* Centre links — hidden below lg */}
//         <ul className="hidden lg:flex items-center justify-center gap-10 list-none m-0 p-0">
//           {NAV_LINKS.map(({ label, href }) => (
//             <li key={href}>
//               <a href={href} className="nav-link">{label}</a>
//             </li>
//           ))}
//         </ul>

//         {/* CTA */}
//         <div className="flex items-center gap-3 justify-end">
//             {/* Auth — always visible */}
//             {isSignedIn ? (
//               <Link to="/dashboard" className="btn-primary-sm">
//                 Go to Studio →
//               </Link>
//             ) : (
//               <>
//                 {/* Log in hidden on mobile — lives inside drawer instead */}
//                 <SignInButton mode="modal">
//                   <button className="hidden lg:block btn-ghost-sm">Log in</button>
//                 </SignInButton>
//                 <SignUpButton mode="modal">
//                   <button className="btn-primary-sm">
//                     <span className="hidden sm:inline">Start designing →</span>
//                     <span className="sm:hidden">Sign up</span>
//                   </button>
//                 </SignUpButton>
//               </>
//             )}

//             {/* Hamburger — hidden on lg+ */}
//             <button
//               className="lg:hidden hamburger-btn"
//               onClick={() => setMenuOpen(v => !v)}
//               aria-label={menuOpen ? 'Close menu' : 'Open menu'}
//               aria-expanded={menuOpen}
//             >
//               <span className={`ham-bar ${menuOpen ? 'ham-bar-1-open' : 'ham-bar-1'}`} />
//               <span className={`ham-bar ${menuOpen ? 'ham-bar-2-open' : 'ham-bar-2'}`} />
//               <span className={`ham-bar ${menuOpen ? 'ham-bar-3-open' : 'ham-bar-3'}`} />
//             </button>
//           </div>
//       </nav>

//       {/* Backdrop */}
//       <div
//         className={`drawer-backdrop ${menuOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closed'}`}
//         onClick={() => setMenuOpen(false)}
//         aria-hidden
//       />

//       {/* ── Side drawer ──────────────────────────────────────────────── */}
//       <aside className={`drawer ${menuOpen ? 'drawer-open' : 'drawer-closed'}`}>

//         {/* Drawer header */}
//         <div className="drawer-header">
//           <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
//             Drip<span className="text-[#FF5B3A]">ly</span>
//           </Link>
//           <button
//             className="drawer-close-btn"
//             onClick={() => setMenuOpen(false)}
//             aria-label="Close menu"
//           >
//             ✕
//           </button>
//         </div>

//         {/* Nav links */}
//         <nav className="drawer-nav">
//           {NAV_LINKS.map(({ label, href }, i) => (
//             <a
//               key={href}
//               href={href}
//               className="drawer-link"
//               style={{ transitionDelay: menuOpen ? `${i * 60}ms` : '0ms' }}
//               onClick={() => setMenuOpen(false)}
//             >
//               <span>{label}</span>
//               <span className="drawer-link-arrow">→</span>
//             </a>
//           ))}
//         </nav>

//         {/* Divider */}
//         <div className="drawer-divider" />

//         {/* Auth inside drawer */}
//         <div className="drawer-auth">
//           {isSignedIn ? (
//             <Link
//               to="/dashboard"
//               className="drawer-btn-primary"
//               onClick={() => setMenuOpen(false)}
//             >
//               Go to Studio →
//             </Link>
//           ) : (
//             <>
//               <SignInButton mode="modal">
//                 <button
//                   className="drawer-btn-ghost"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Log in
//                 </button>
//               </SignInButton>
//               <SignUpButton mode="modal">
//                 <button
//                   className="drawer-btn-primary"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Start designing →
//                 </button>
//               </SignUpButton>
//             </>
//           )}
//         </div>

//         {/* Bottom brand mark */}
//         <div className="drawer-footer">
//           Design your drip. ✦
//         </div>
//       </aside>
//     </>  
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  HERO
// // ─────────────────────────────────────────────────────────────────────────────
// function Hero() {
//   const [activeIdx, setActiveIdx] = useState(0)
//   const active = SWATCHES[activeIdx]

//    // ── Refs for GSAP targets ───────────────────────────────────
//   const containerRef = useRef<HTMLElement>(null)

//   // We use data-hero attributes so GSAP can scope queries
//   // to this component only — avoids selecting wrong elements
//   // if you ever have multiple instances on a page.

//   useGSAP(
//     () => {
//       // Master timeline
//       const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

//       // ── 1. Live badge ───────────────────────────────────────
//       tl.from('[data-hero="badge"]', {
//         y: -18,
//         opacity: 0,
//         duration: 0.4,
//       })

//       // ── 2. Headline words — drop in with overshoot ──────────
//       tl.from(
//         '[data-hero="word"]',
//         {
//           y: 60,
//           opacity: 0,
//           duration: 0.55,
//           stagger: 0.1,
//           ease: 'back.out(1.6)',
//         },
//         '-=0.2',          // overlap slightly with badge
//       )

//       // ── 3. Shirt — bounces up from below, runs in parallel ──
//       tl.from(
//         '[data-hero="shirt"]',
//         {
//           y: 80,
//           opacity: 0,
//           duration: 0.7,
//           ease: 'back.out(1.4)',
//         },
//         '<0.1',           // starts 0.1s after words begin
//       )

//       // ── 4. Subtitle ─────────────────────────────────────────
//       tl.from(
//         '[data-hero="sub"]',
//         {
//           y: 22,
//           opacity: 0,
//           duration: 0.45,
//         },
//         '-=0.3',
//       )

//       // ── 5. CTA buttons — stagger ────────────────────────────
//       tl.from(
//         '[data-hero="cta"]',
//         {
//           y: 18,
//           opacity: 0,
//           duration: 0.4,
//           stagger: 0.1,
//         },
//         '-=0.25',
//       )

//       // ── 6. Stats ─────────────────────────────────────────────
//       tl.from(
//         '[data-hero="stats"]',
//         {
//           y: 14,
//           opacity: 0,
//           duration: 0.4,
//         },
//         '-=0.2',
//       )

//       // ── 7. Floating badges — elastic pop, staggered ─────────
//       tl.from(
//         '[data-hero="badge-float"]',
//         {
//           scale: 0.6,
//           opacity: 0,
//           duration: 0.5,
//           stagger: 0.12,
//           ease: 'back.out(2)',
//         },
//         '-=0.55',         // runs parallel with CTAs
//       )

//       // ── 8. Swatch strip slides up ────────────────────────────
//       tl.from(
//         '[data-hero="swatches"]',
//         {
//           y: 20,
//           opacity: 0,
//           duration: 0.4,
//           ease: 'power2.out',
//         },
//         '-=0.3',
//       )
//     },
//     { scope: containerRef },  // scopes all queries to this component
//   )

//   return (
//     <section ref={containerRef} className="hero-grid">
//       {/* Left */}
//       <div className="hero-left">
//         {/* Live badge */}
//         <div data-hero="badge" className="live-badge">
//           <span className="live-dot" />
//           Design Studio is Live
//         </div>

//         {/* Headline */}
//         <h1 className="hero-h1">
//            {/* Each word gets data-hero="word" for the stagger */}
//           <span data-hero="word" className="block">Design</span>
//           <span data-hero="word" className="block">Your</span>
//           <span data-hero="word" className="block">
//             <span className="hero-outline">Drip.</span>
//           </span>
//         </h1>

//         <p data-hero="sub" className="hero-sub">
//           Visualize custom embroidery and prints on any garment — caps,
//           tees, hoodies, scarves and more. Create your look, order it real.
//         </p>

//         {/* CTAs */}
//         <div className="flex items-center gap-5 flex-wrap mb-12">
//           <SignUpButton mode="modal">
//             <button className="btn-hero group">
//               Start for free
//               <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
//             </button>
//           </SignUpButton>
//           <div data-hero="cta">
//             <button className="btn-hero-ghost">
//               <span className="play-btn">▶</span>
//               See it in action
//             </button>
//           </div>
//         </div>

//         {/* Stats */}
//         <div data-hero="stats" className="hero-stats">
//           {STATS.map(({ value, label }) => (
//             <div key={label}>
//               <div className="stat-val">{value}</div>
//               <div className="stat-label">{label}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Right — canvas */}
//       <div className="relative flex items-center justify-center overflow-hidden">
//         {/* Blobs */}
//         <div className="blob blob-1" />
//         <div className="blob blob-2" />
//         <div className="blob blob-3" />

//         {/* Floating badges */}
//         <div data-hero="badge-float" className="float-badge badge-tl">
//           <span className="w-2 h-2 rounded-full bg-[#3ABAFF] flex-shrink-0" />
//           Embroidery ready
//         </div>
//         <div data-hero="badge-float" className="float-badge badge-br">
//           <span className="w-2 h-2 rounded-full bg-[#FF5B3A] flex-shrink-0" />
//           Print-on-demand
//         </div>
//         <div data-hero="badge-float" className="float-badge badge-ml" style={{ background: '#C8F135', color: '#0E0E0E' }}>
//           ✦ 14 colors available
//         </div>

//         {/* Animated shirt */}
//         <div data-hero="shirt" className="animate-float-shirt z-10">
//           <ShirtSVG color={active.bg} collarColor={active.collar} />
//         </div>

//         {/* Swatch strip */}
//         <div data-hero="swatches" className="swatch-strip">
//           {SWATCHES.map((sw, i) => (
//             <button
//               key={i}
//               onClick={() => setActiveIdx(i)}
//               aria-label={sw.label}
//               className="swatch-btn"
//               style={{
//                 background: sw.bg,
//                 borderColor: i === activeIdx ? '#0E0E0E' : 'white',
//                 transform:   i === activeIdx ? 'scale(1.28)' : 'scale(1)',
//                 boxShadow:   i === activeIdx
//                   ? '0 0 0 2px #F8F5EF, 0 0 0 3.5px #0E0E0E'
//                   : 'none',
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  MARQUEE
// // ─────────────────────────────────────────────────────────────────────────────
// function Marquee() {
//   const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
//   return (
//     <div className="bg-[#0E0E0E] py-4 overflow-hidden">
//       <div className="marquee-track group">
//         {doubled.map((item, i) => (
//           <span key={i} className="marquee-item">
//             {item}
//             <span className="text-[#FF5B3A] text-lg">✦</span>
//           </span>
//         ))}
//       </div>
//     </div>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  HOW IT WORKS
// // ─────────────────────────────────────────────────────────────────────────────
// function HowItWorks() {
//   return (
//     <section id="how" className="section-pad">
//       <SectionHeading
//         label="The process"
//         heading={<>From idea to<br />your doorstep.</>}
//         sub="Three steps is all it takes. Design it, approve it, wear it."
//       />
//       <div className="steps-grid mt-16">
//         {STEPS.map((s, i) => (
//           <Reveal key={i} delay={i * 100}>
//             <div className="step-card group">
//               <span className="step-num">{s.num}</span>
//               <div
//                 className="step-icon"
//                 style={{ background: s.bg }}
//               >
//                 {s.emoji}
//               </div>
//               <h3 className="step-title">{s.title}</h3>
//               <p className="step-desc">{s.desc}</p>
//             </div>
//           </Reveal>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  FEATURES
// // ─────────────────────────────────────────────────────────────────────────────
// function Features() {
//   return (
//     <section id="features" className="section-pad pt-0">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">
//         <SectionHeading
//           label="What you get"
//           heading={<>A full creative<br />toolkit.</>}
//         />
//         <Reveal delay={100}>
//           <p className="section-sub">
//             Every tool you need to go from blank canvas to production-ready
//             artwork — no design experience required.
//           </p>
//         </Reveal>
//       </div>

//       {/* Bento grid */}
//       <div className="features-grid">
//         {/* Dark tall — typography */}
//         <Reveal className="row-span-2">
//           <div className="feat-card feat-dark h-full">
//             <span className="feat-icon">🖋</span>
//             <h3 className="feat-title text-white">Text &amp; Typography</h3>
//             <p className="feat-desc text-white/60">
//               Hundreds of fonts. Full control over size, spacing, weight,
//               color and placement anywhere on your garment.
//             </p>
//             <div className="mt-6 bg-white/[0.07] rounded-2xl p-4 flex gap-2 flex-wrap">
//               {FONT_CHIPS.map((c, i) => (
//                 <span
//                   key={i}
//                   className={`text-xs rounded-full px-3 py-1.5 ${
//                     i === 0
//                       ? 'bg-[#C8F135] text-[#0E0E0E] font-medium'
//                       : 'bg-white/10 text-white/60'
//                   }`}
//                 >
//                   {c}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </Reveal>

//         {/* Lime — color */}
//         <Reveal delay={80}>
//           <div className="feat-card feat-lime hover:scale-[1.02] transition-transform duration-300">
//             <span className="feat-icon">🎨</span>
//             <h3 className="feat-title text-[#0E0E0E]">Color System</h3>
//             <p className="feat-desc text-[#0E0E0E]/70">
//               Unlimited palettes. Use hex codes, Pantone references, or pick
//               from curated collections. Color match across garment pieces.
//             </p>
//           </div>
//         </Reveal>

//         {/* Warm — assets */}
//         <Reveal delay={140}>
//           <div className="feat-card feat-warm hover:scale-[1.02] transition-transform duration-300">
//             <span className="feat-icon">🖼</span>
//             <h3 className="feat-title text-[#0E0E0E]">Asset Import</h3>
//             <p className="feat-desc text-[#3A3A3A]">
//               Upload logos, illustrations or photos. SVG, PNG, JPEG and
//               more. Instant vectorization available.
//             </p>
//           </div>
//         </Reveal>

//         {/* Coral wide — live preview */}
//         <Reveal delay={60} className="col-span-2">
//           <div className="feat-card feat-coral hover:scale-[1.01] transition-transform duration-300">
//             <span className="feat-icon">✦</span>
//             <h3 className="feat-title text-white">Live Preview</h3>
//             <p className="feat-desc text-white/80 max-w-xl">
//               See your design on a real 3D garment mockup as you build it.
//               Every change updates instantly — no surprises at production.
//             </p>
//           </div>
//         </Reveal>
//       </div>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  GARMENTS
// // ─────────────────────────────────────────────────────────────────────────────
// function Garments() {
//   return (
//     <section id="products" className="section-pad pt-0">
//       <SectionHeading
//         label="What you can design on"
//         heading={<>Every garment,<br />one place.</>}
//       />
//       <div className="garment-scroll mt-12">
//         {GARMENTS.map((g, i) => (
//           <div key={i} className="garment-card group">
//             <div
//               className="w-full h-full flex items-center justify-center text-[6rem]"
//               style={{ background: g.bg }}
//             >
//               {g.emoji}
//             </div>
//             <div className="garment-label">
//               <h4 className="font-display font-bold text-[1.05rem] text-white">
//                 {g.name}
//               </h4>
//               <span className="text-[0.73rem] text-white/60">{g.sub}</span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  DASHBOARD PREVIEW
// // ─────────────────────────────────────────────────────────────────────────────
// function DashboardPreview() {
//   return (
//     <section className="section-pad pt-0">
//       <SectionHeading
//         label="Design studio"
//         heading={<>The dashboard<br />is your canvas.</>}
//         sub="Intuitive. Powerful. Built for both first-timers and pros. Everything you need is a click away."
//       />
//       <Reveal delay={100} className="mt-14">
//         <div className="bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/[0.05]">
//           {/* Topbar */}
//           <div className="bg-[#252525] px-6 py-3 flex items-center justify-between border-b border-white/[0.05]">
//             <div className="flex gap-1.5">
//               {['#FF5B5B','#FFD60A','#2ACB5A'].map((c, i) => (
//                 <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
//               ))}
//             </div>
//             <span className="font-display text-[0.73rem] font-semibold tracking-[0.05em] text-white/35">
//               Driply Design Studio — My Collection v2
//             </span>
//             <div className="flex gap-2">
//               <span className="bg-white/[0.07] rounded px-3 py-1 text-[0.7rem] text-white/45">Preview</span>
//               <span className="bg-[#C8F135] rounded px-3 py-1 text-[0.7rem] text-[#0E0E0E] font-bold">Save</span>
//             </div>
//           </div>

//           {/* Body */}
//           <div className="dash-body">
//             {/* Left panel */}
//             <div className="dash-panel-left">
//               <p className="dash-panel-label">Elements</p>
//               {[
//                 { icon: '🔤', label: 'Text — "YOUR DESIGN"', active: true },
//                 { icon: '🖼', label: 'Logo import'          },
//                 { icon: '⬤', label: 'Shape layer'          },
//                 { icon: '✦', label: 'Embroidery zone'      },
//               ].map((el, i) => (
//                 <div key={i} className={`dash-layer-row ${el.active ? 'dash-layer-active' : ''}`}>
//                   <span>{el.icon}</span>
//                   <span className={el.active ? 'font-medium' : ''}>{el.label}</span>
//                 </div>
//               ))}
//               <div className="border-t border-white/[0.05] mt-4 pt-4">
//                 <p className="dash-panel-label">Garment</p>
//                 <div className="dash-layer-row">
//                   <span>👕</span><span>Oversized Tee</span>
//                 </div>
//               </div>
//             </div>

//             {/* Canvas */}
//             <div className="dash-canvas">
//               <div className="absolute inset-0 dot-grid" />
//               <div className="relative z-10 flex flex-col items-center animate-gentle-float">
//                 <svg viewBox="0 0 200 220" width="180"
//                   style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))' }}>
//                   <path d="M50,52 L18,76 L36,92 L46,86 L46,200 L154,200 L154,86 L164,92 L182,76 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#C8F135" />
//                   <path d="M92,52 C92,52 97,64 100,68 C103,64 108,52 108,52 L150,52 C142,62 128,68 100,68 C72,68 58,62 50,52 Z" fill="#9BBF10" />
//                   <rect x="72" y="95" width="56" height="44" rx="3" fill="none"
//                     stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="4,3" />
//                   <text x="100" y="112" textAnchor="middle" fontFamily="Syne,sans-serif"
//                     fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">YOUR</text>
//                   <text x="100" y="122" textAnchor="middle" fontFamily="Syne,sans-serif"
//                     fontWeight="800" fontSize="7.5" fill="#0E0E0E" letterSpacing="1.5">DESIGN</text>
//                 </svg>
//                 <span className="text-[0.68rem] font-display font-bold uppercase tracking-[0.08em] border border-dashed border-[#C8F135]/40 text-[#C8F135]/70 px-3 py-1 rounded mt-1">
//                   Text Layer · Active
//                 </span>
//               </div>
//             </div>

//             {/* Right panel */}
//             <div className="dash-panel-right">
//               <p className="dash-panel-label">Text Color</p>
//               <div className="flex gap-1.5 flex-wrap mb-4">
//                 {['#0E0E0E','#C8F135','#FF5B3A','#3ABAFF','#7B5BFF','white'].map((c, i) => (
//                   <div key={i}
//                     className={`w-5 h-5 rounded-full cursor-pointer border transition-transform ${
//                       i === 0
//                         ? 'border-white scale-110 shadow-[0_0_0_2px_#1E1E1E,0_0_0_3px_white]'
//                         : 'border-transparent'
//                     }`}
//                     style={{ background: c }}
//                   />
//                 ))}
//               </div>
//               <p className="dash-panel-label">Font Size · 14px</p>
//               <div className="h-1 bg-white/10 rounded-full relative mb-4">
//                 <div className="h-full w-[40%] bg-[#C8F135] rounded-full" />
//                 <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md" style={{ left:'calc(40% - 7px)' }} />
//               </div>
//               <p className="dash-panel-label">Garment Color</p>
//               <div className="flex gap-1.5 flex-wrap mb-4">
//                 {['#C8F135','#3ABAFF','#FF5B3A','#0E0E0E','white'].map((c, i) => (
//                   <div key={i}
//                     className={`w-5 h-5 rounded-full cursor-pointer border transition-transform ${
//                       i === 0
//                         ? 'border-white scale-110 shadow-[0_0_0_2px_#1E1E1E,0_0_0_3px_white]'
//                         : 'border-transparent'
//                     }`}
//                     style={{ background: c }}
//                   />
//                 ))}
//               </div>
//               <p className="dash-panel-label">Font Family</p>
//               <div className="flex gap-1 flex-wrap">
//                 {['Syne','Bebas','DM Sans'].map((f, i) => (
//                   <span key={i} className={`text-[0.68rem] rounded px-2 py-1 ${
//                     i === 0
//                       ? 'bg-[#C8F135]/15 text-[#C8F135] border border-[#C8F135]/30'
//                       : 'bg-white/[0.07] text-white/50'
//                   }`}>{f}</span>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </Reveal>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  TESTIMONIALS
// // ─────────────────────────────────────────────────────────────────────────────
// function Testimonials() {
//   return (
//     <section className="bg-[#0E0E0E] px-8 lg:px-16 py-28">
//       <Reveal>
//         <span className="section-label text-white/35">Real users</span>
//         <h2 className="section-h2 text-white mt-3">
//           They designed.<br />They loved it.
//         </h2>
//       </Reveal>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
//         {TESTIMONIALS.map((t, i) => (
//           <Reveal key={i} delay={i * 100}>
//             <div className="testi-card">
//               <div className="text-[#C8F135] tracking-[0.1em] mb-4">
//                 {'★'.repeat(5)}
//               </div>
//               <p className="text-[0.93rem] font-light leading-[1.7] text-white/75 italic mb-6">
//                 "{t.text}"
//               </p>
//               <div className="flex items-center gap-3">
//                 <div
//                   className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0E0E0E] flex-shrink-0"
//                   style={{ background: t.color }}
//                 >
//                   {t.initials}
//                 </div>
//                 <div>
//                   <div className="text-[0.83rem] font-medium text-white/85">{t.name}</div>
//                   <div className="text-[0.73rem] text-white/35">{t.role}</div>
//                 </div>
//               </div>
//             </div>
//           </Reveal>
//         ))}
//       </div>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  CTA
// // ─────────────────────────────────────────────────────────────────────────────
// function CTA() {
//   return (
//     <section className="section-pad text-center relative overflow-hidden">
//       <div className="cta-blob cta-blob-lime" />
//       <div className="cta-blob cta-blob-coral" />
//       <Reveal>
//         <h2 className="cta-h2">
//           Your drip.<br />
//           <span className="text-[#FF5B3A]">Starts here.</span>
//         </h2>
//         <p className="section-sub mx-auto mb-12">
//           Join thousands of individuals, brands and organizations designing
//           custom clothing on Driply. Free to start.
//         </p>
//         <div className="flex items-center justify-center gap-5 flex-wrap">
//           <SignUpButton mode="modal">
//             <button className="btn-cta-primary">
//               Create your first design →
//             </button>
//           </SignUpButton>
//           <Link to="/dashboard" className="btn-cta-ghost">
//             Explore the dashboard
//           </Link>
//         </div>
//       </Reveal>
//     </section>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  FOOTER
// // ─────────────────────────────────────────────────────────────────────────────
// const FOOTER_COLS = [
//   { title: 'Product', links: ['Dashboard','Garment catalog','Embroidery','Bulk orders'] },
//   { title: 'Company', links: ['About','Blog','Careers','Contact'] },
//   { title: 'Legal',   links: ['Privacy','Terms','Cookies'] },
// ]

// function Footer() {
//   return (
//     <footer className="bg-[#0E0E0E] px-8 lg:px-16 pt-16 pb-10">
//       <div className="footer-grid mb-14">
//         <div>
//           <span className="logo text-white mb-4 block">
//             Drip<span className="text-[#FF5B3A]">ly</span>
//           </span>
//           <p className="text-[0.875rem] text-white/40 leading-[1.65] max-w-[260px]">
//             Design your drip. Visualize custom prints and embroidery on any
//             garment, then order the real thing.
//           </p>
//         </div>
//         {FOOTER_COLS.map((col) => (
//           <div key={col.title}>
//             <h5 className="text-[0.72rem] tracking-[0.08em] uppercase text-white/30 mb-5">
//               {col.title}
//             </h5>
//             <ul className="list-none space-y-2.5">
//               {col.links.map((l) => (
//                 <li key={l}>
//                   <a href="#" className="text-[0.875rem] text-white/50 no-underline hover:text-white transition-colors">
//                     {l}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//       <div className="flex items-center justify-between border-t border-white/[0.07] pt-6">
//         <span className="text-[0.78rem] text-white/25">
//           © 2025 Driply. All rights reserved.
//         </span>
//         <span className="text-[0.78rem] text-white/25">
//           Made with <span className="text-[#FF5B3A]">♥</span> for creators everywhere
//         </span>
//       </div>
//     </footer>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  HOME PAGE (root export)
// // ─────────────────────────────────────────────────────────────────────────────
// export default function HomePage() {
//   return (
//     <div className="bg-[#F8F5EF] text-[#0E0E0E] overflow-x-hidden">
//       <Nav />
//       <Hero />
//       <Marquee />
//       <HowItWorks />
//       <Features />
//       <Garments />
//       <DashboardPreview />
//       <Testimonials />
//       <CTA />
//       <Footer />
//     </div>
//   )
// }


// =============================================================
//  CSS BLOCK — paste everything below into your index.css
//  (after your @import "tailwindcss"; line)
// =============================================================

// @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300;1,9..40,400&display=swap');

// /* ── Theme tokens ── */
// @theme {
//   --font-display: 'Syne', sans-serif;
//   --font-body:    'DM Sans', sans-serif;
//   --color-lime:   #C8F135;
//   --color-coral:  #FF5B3A;
//   --color-sky:    #3ABAFF;
//   --color-ink:    #0E0E0E;
//   --color-warm:   #F8F5EF;
// }

// /* ── Base ── */
// html { scroll-behavior: smooth; }
// body { font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

// /* ── Keyframes ── */
// @keyframes float-shirt {
//   0%,100% { transform: translateY(0px) rotate(-2deg); }
//   50%      { transform: translateY(-18px) rotate(2deg); }
// }
// @keyframes badge-float {
//   0%,100% { transform: translateY(0); }
//   50%      { transform: translateY(-8px); }
// }
// @keyframes blob1 {
//   0%,100% { transform: translateY(0) scale(1); }
//   50%      { transform: translateY(-25px) scale(1.04); }
// }
// @keyframes blob2 {
//   0%,100% { transform: translateY(0) scale(1); }
//   50%      { transform: translateY(20px) scale(0.97); }
// }
// @keyframes blob3 {
//   0%,100% { transform: translateY(0); }
//   50%      { transform: translateY(-15px); }
// }
// @keyframes marquee {
//   from { transform: translateX(0); }
//   to   { transform: translateX(-50%); }
// }
// @keyframes gentle-float {
//   0%,100% { transform: translateY(0px) rotate(-0.5deg); }
//   50%      { transform: translateY(-10px) rotate(0.5deg); }
// }
// @keyframes pulse-dot {
//   0%,100% { opacity: 1; transform: scale(1); }
//   50%      { opacity: 0.5; transform: scale(0.8); }
// }

// /* ── Animation utilities ── */
// @utility animate-float-shirt  { animation: float-shirt 6s ease-in-out infinite; }
// @utility animate-gentle-float { animation: gentle-float 7s ease-in-out infinite; }
// @utility animate-badge-float  { animation: badge-float 8s ease-in-out infinite; }
// @utility animate-pulse-dot    { animation: pulse-dot 2s infinite; }

// /* ── Marquee ── */
// @utility marquee-track {
//   display: flex;
//   animation: marquee 22s linear infinite;
//   white-space: nowrap;
// }
// .marquee-track:hover { animation-play-state: paused; }
// @utility marquee-item {
//   display: inline-flex;
//   align-items: center;
//   gap: 1.25rem;
//   padding: 0 2rem;
//   font-family: var(--font-display);
//   font-size: 0.88rem;
//   font-weight: 600;
//   letter-spacing: 0.05em;
//   text-transform: uppercase;
//   color: rgba(255,255,255,0.5);
// }

// /* ── Nav ── */
// @utility nav-shell {
//   position: fixed; top: 0; left: 0; right: 0; z-index: 50;
//   display: grid; grid-template-columns: 1fr auto 1fr;
//   align-items: center;
//   padding-left: 4rem; padding-right: 4rem;
// }
// @utility nav-top     { padding-top: 1.25rem; padding-bottom: 1.25rem; background: rgba(248,245,239,0.8); backdrop-filter: blur(10px); }
// @utility nav-scrolled { padding-top: 0.875rem; padding-bottom: 0.875rem; background: rgba(248,245,239,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(14,14,14,0.06); box-shadow: 0 1px 12px rgba(0,0,0,0.04); }
// @utility logo { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: #0E0E0E; text-decoration: none; }
// @utility nav-link { font-size: 0.875rem; font-weight: 500; color: #3A3A3A; text-decoration: none; letter-spacing: 0.01em; transition: color 0.2s; }
// .nav-link:hover { color: #0E0E0E; }
// @utility btn-ghost-sm { font-size: 0.875rem; font-weight: 500; color: #0E0E0E; background: none; border: 1.5px solid rgba(14,14,14,0.2); padding: 0.5rem 1.25rem; border-radius: 100px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
// .btn-ghost-sm:hover { border-color: #0E0E0E; background: rgba(14,14,14,0.04); }
// @utility btn-primary-sm { font-size: 0.875rem; font-weight: 500; color: #0E0E0E; background: #C8F135; border: none; padding: 0.55rem 1.35rem; border-radius: 100px; cursor: pointer; text-decoration: none; transition: background 0.2s; }
// .btn-primary-sm:hover { background: #9BBF10; color: white; }

// /* ── Hero ── */
// @utility hero-grid { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; padding-top: 6rem; overflow: hidden; }
// @utility hero-left  { display: flex; flex-direction: column; justify-content: center; padding: 4rem 3rem 4rem 4rem; position: relative; z-index: 2; }
// @utility hero-h1    { font-family: var(--font-display); font-size: clamp(3.5rem,5.5vw,5.5rem); font-weight: 800; line-height: 0.95; letter-spacing: -0.04em; color: #0E0E0E; margin-bottom: 1.75rem; }
// @utility hero-outline { color: transparent; -webkit-text-stroke: 2.5px #0E0E0E; }
// @utility hero-sub   { font-size: 1.05rem; font-weight: 300; color: #3A3A3A; line-height: 1.65; max-width: 430px; margin-bottom: 2.5rem; }
// @utility live-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #0E0E0E; color: #C8F135; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.4rem 1rem; border-radius: 100px; width: fit-content; margin-bottom: 2rem; }
// @utility live-dot   { width: 6px; height: 6px; border-radius: 50%; background: #C8F135; animation: pulse-dot 2s infinite; flex-shrink: 0; }
// @utility hero-stats { display: flex; gap: 2.5rem; border-top: 1px solid rgba(14,14,14,0.1); padding-top: 1.75rem; }
// @utility stat-val   { font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: #0E0E0E; letter-spacing: -0.03em; }
// @utility stat-label { font-size: 0.78rem; color: #888; margin-top: 0.15rem; }
// @utility btn-hero   { display: inline-flex; align-items: center; gap: 0.5rem; background: #C8F135; color: #0E0E0E; font-size: 1rem; font-weight: 500; padding: 1rem 2.25rem; border-radius: 100px; border: none; cursor: pointer; text-decoration: none; transition: background 0.2s; }
// .btn-hero:hover { background: #9BBF10; color: white; }
// @utility btn-hero-ghost { display: inline-flex; align-items: center; gap: 0.75rem; color: #3A3A3A; font-size: 1rem; background: none; border: none; cursor: pointer; transition: color 0.2s; }
// .btn-hero-ghost:hover { color: #0E0E0E; }
// @utility play-btn { width: 44px; height: 44px; border-radius: 50%; background: #0E0E0E; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; flex-shrink: 0; }

// /* ── Blobs ── */
// @utility blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.32; pointer-events: none; }
// @utility blob-1 { width: 420px; height: 420px; background: #C8F135; top: 10%; right: -60px; animation: blob1 8s ease-in-out infinite; }
// @utility blob-2 { width: 280px; height: 280px; background: #FF5B3A; bottom: 15%; left: 0;    animation: blob2 10s ease-in-out infinite; }
// @utility blob-3 { width: 200px; height: 200px; background: #3ABAFF; top: 50%;  right: 15%;  animation: blob3 7s ease-in-out infinite; }

// /* ── Floating badges ── */
// @utility float-badge { position: absolute; z-index: 20; display: flex; align-items: center; gap: 0.5rem; background: #0E0E0E; color: white; font-size: 0.75rem; font-weight: 500; padding: 0.55rem 1rem; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); white-space: nowrap; animation: badge-float 8s ease-in-out infinite; }
// @utility badge-tl { top: 18%; left: 4%; animation-delay: 0s; }
// @utility badge-br { bottom: 22%; right: 3%; animation-delay: 1s; }
// @utility badge-ml { top: 55%; left: -2%; animation-delay: 0.5s; }

// /* ── Swatch strip ── */
// @utility swatch-strip { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); z-index: 20; display: flex; gap: 8px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); padding: 0.6rem 1rem; border-radius: 100px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
// @utility swatch-btn   { width: 22px; height: 22px; border-radius: 50%; border-width: 2px; cursor: pointer; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }

// /* ── Sections ── */
// @utility section-pad  { padding: 7rem 4rem; }
// @utility section-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888; }
// @utility section-h2   { font-family: var(--font-display); font-size: clamp(2.5rem,4vw,3.75rem); font-weight: 800; line-height: 1; letter-spacing: -0.035em; color: #0E0E0E; }
// @utility section-sub  { font-size: 1.05rem; font-weight: 300; color: #3A3A3A; max-width: 520px; line-height: 1.65; }

// /* ── Steps ── */
// @utility steps-grid  { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
// @utility step-card   { background: #F2EFEA; border-radius: 24px; padding: 2.5rem 2rem; position: relative; overflow: hidden; transition: transform 0.25s; }
// .step-card:hover     { transform: translateY(-6px); }
// @utility step-num    { position: absolute; top: 1rem; right: 1.5rem; font-family: var(--font-display); font-size: 5rem; font-weight: 800; line-height: 1; letter-spacing: -0.05em; color: rgba(14,14,14,0.06); user-select: none; }
// @utility step-icon   { width: 54px; height: 54px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.5rem; }
// @utility step-title  { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em; color: #0E0E0E; margin-bottom: 0.75rem; }
// @utility step-desc   { font-size: 0.88rem; font-weight: 300; color: #3A3A3A; line-height: 1.65; }

// /* ── Feature bento ── */
// @utility features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem; }
// @utility feat-card     { border-radius: 24px; padding: 2.25rem; position: relative; overflow: hidden; }
// @utility feat-dark     { background: #0E0E0E; }
// @utility feat-lime     { background: #C8F135; }
// @utility feat-warm     { background: #F2EFEA; }
// @utility feat-coral    { grid-column: span 2; background: #FF5B3A; }
// @utility feat-icon     { font-size: 2.5rem; margin-bottom: 1.25rem; display: block; }
// @utility feat-title    { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.6rem; }
// @utility feat-desc     { font-size: 0.875rem; font-weight: 300; line-height: 1.65; }

// /* ── Garments ── */
// @utility garment-scroll { display: flex; gap: 1.25rem; overflow-x: auto; padding-bottom: 1rem; scroll-snap-type: x mandatory; scrollbar-width: none; }
// .garment-scroll::-webkit-scrollbar { display: none; }
// @utility garment-card   { flex: 0 0 240px; scroll-snap-align: start; border-radius: 20px; overflow: hidden; position: relative; aspect-ratio: 3/4; cursor: pointer; transition: transform 0.25s; }
// .garment-card:hover     { transform: scale(1.03); }
// @utility garment-label  { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem 1.25rem 1.25rem; background: linear-gradient(transparent, rgba(0,0,0,0.6)); }

// /* ── Dashboard preview ── */
// @utility dash-body       { display: grid; grid-template-columns: 200px 1fr 220px; height: 460px; }
// @utility dash-panel-left { background: #1E1E1E; border-right: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 1rem; overflow: hidden; }
// @utility dash-canvas     { background: #2A2A2A; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
// @utility dash-panel-right{ background: #1E1E1E; border-left: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 1rem; overflow: hidden; }
// @utility dash-panel-label{ font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 0.6rem; display: block; }
// @utility dash-layer-row  { display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; border-radius: 8px; margin-bottom: 2px; cursor: pointer; color: rgba(255,255,255,0.5); font-size: 0.75rem; border: 1px solid transparent; transition: background 0.12s; }
// .dash-layer-row:hover    { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
// @utility dash-layer-active { background: rgba(200,241,53,0.1); color: #C8F135; border-color: rgba(200,241,53,0.18); font-weight: 500; }
// @utility dot-grid { background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }

// /* ── Testimonials ── */
// @utility testi-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem; transition: background 0.2s; }
// .testi-card:hover   { background: rgba(255,255,255,0.09); }

// /* ── CTA ── */
// @utility cta-h2        { font-family: var(--font-display); font-size: clamp(3rem,6vw,5.5rem); font-weight: 800; line-height: 0.95; letter-spacing: -0.04em; color: #0E0E0E; margin-bottom: 1.5rem; position: relative; }
// @utility cta-blob      { position: absolute; border-radius: 50%; pointer-events: none; }
// @utility cta-blob-lime { width: 600px; height: 600px; background: #C8F135; opacity: 0.1; top: -200px; left: -100px; filter: blur(80px); }
// @utility cta-blob-coral{ width: 400px; height: 400px; background: #FF5B3A; opacity: 0.09; bottom: -100px; right: 0; filter: blur(80px); }
// @utility btn-cta-primary { font-size: 1.05rem; font-weight: 500; color: #0E0E0E; background: #C8F135; border: none; padding: 1.1rem 2.75rem; border-radius: 100px; cursor: pointer; transition: background 0.2s; }
// .btn-cta-primary:hover   { background: #9BBF10; color: white; }
// @utility btn-cta-ghost   { font-size: 1rem; font-weight: 400; color: #3A3A3A; background: none; border: 1.5px solid rgba(14,14,14,0.2); padding: 1.05rem 2.25rem; border-radius: 100px; text-decoration: none; display: inline-flex; align-items: center; transition: border-color 0.2s, color 0.2s; }
// .btn-cta-ghost:hover     { border-color: #0E0E0E; color: #0E0E0E; }

// /* ── Footer ── */
// @utility footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; }
