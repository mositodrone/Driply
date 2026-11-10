import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRouteWithContext,
  DefaultGlobalNotFound,
  HeadContent,
  NotFoundRoute,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { NavProgress } from './components/PageLoader'
import { RootErrorBoundary } from './components/RootErrorBoundary'

import ClerkProvider from '../integrations/clerk/provider'
import 'driver.js/dist/driver.css'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import { useGSAP } from '@gsap/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import gsap from 'gsap'
import { useRef } from 'react'

gsap.registerPlugin(useGSAP)

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Driply',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: RootErrorBoundary,
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

// ─── Floating garment data ────────────────────────────────────────────────────
const FLOATERS = [
  { emoji: '👕', x: '8%',  y: '18%', size: 56, delay: 0,    rot: -18, color: '#C8F135' },
  { emoji: '👖', x: '82%', y: '12%', size: 44, delay: 0.3,  rot: 12,  color: '#2ECEFF' },
  { emoji: '🧢', x: '72%', y: '72%', size: 48, delay: 0.6,  rot: -8,  color: '#FF5B3A' },
  { emoji: '👟', x: '14%', y: '76%', size: 40, delay: 0.9,  rot: 22,  color: '#7B5BFF' },
  { emoji: '🧥', x: '88%', y: '44%', size: 52, delay: 0.15, rot: -14, color: '#C8F135' },
  { emoji: '🩳', x: '4%',  y: '50%', size: 38, delay: 0.45, rot: 16,  color: '#FFD60A' },
  { emoji: '🧦', x: '54%', y: '88%', size: 34, delay: 0.75, rot: -25, color: '#2ECEFF' },
  { emoji: '👜', x: '38%', y: '6%',  size: 42, delay: 1.0,  rot: 10,  color: '#FF5B3A' },
]

// ─── Witty messages ───────────────────────────────────────────────────────────
const SUBTEXTS = [
  "This page went to the laundry and never came back.",
  "Looks like this URL got lost in the fabric of the internet.",
  "We checked every pocket. Nothing.",
  "Even our best seamstress couldn't stitch this one back together.",
  "This page is out of stock in all sizes.",
]
const SUB = SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)]


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
	<NavProgress />
	{/* Change v1 to v2 */}
	<script src="https://js.paystack.co/v2/inline.js"></script>
        <ClerkProvider>
          {children}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}


//------------404 page---------------------//
export default function NotFoundPage() {
  const rootRef     = useRef<HTMLDivElement>(null)
  const fourRef     = useRef<HTMLDivElement>(null)
  const zeroRef     = useRef<HTMLDivElement>(null)
  const four2Ref    = useRef<HTMLDivElement>(null)
  const tagRef      = useRef<HTMLDivElement>(null)
  const subRef      = useRef<HTMLParagraphElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)
  const threadRef   = useRef<HTMLDivElement>(null)
  const floatersRef = useRef<(HTMLDivElement | null)[]>([])

  useGSAP(() => {
    // ── 1. Entrance: numbers drop + bounce ───────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: 'back.out(1.6)' } })

    tl.from([fourRef.current, zeroRef.current, four2Ref.current], {
      y: -120,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
    })
    .from(tagRef.current, {
      scale: 0,
      rotation: -20,
      opacity: 0,
      duration: 0.55,
      ease: 'back.out(2.5)',
    }, '-=0.3')
    .from(subRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out',
    }, '-=0.1')
    .from(ctaRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out',
    }, '-=0.2')
    .from(threadRef.current, {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 1.2,
      ease: 'power2.out',
    }, '-=0.8')

    // ── 2. Floaters: stagger in then loop-float independently ────────────────
    floatersRef.current.forEach((el, i) => {
      if (!el) return
      const f = FLOATERS[i]

      gsap.from(el, {
        scale:   0,
        opacity: 0,
        rotation: f.rot * 2,
        duration: 0.6,
        delay:   0.4 + f.delay,
        ease:    'back.out(2)',
      })

      // Each floater gets its own lazy float loop — all different durations/arcs
      gsap.to(el, {
        y:        `${-18 - i * 4}px`,
        rotation: f.rot * 0.6,
        duration: 2.8 + i * 0.4,
        ease:     'sine.inOut',
        yoyo:     true,
        repeat:   -1,
        delay:    f.delay,
      })

      // Subtle scale breath
      gsap.to(el, {
        scale:    1.06,
        duration: 3.2 + i * 0.3,
        ease:     'sine.inOut',
        yoyo:     true,
        repeat:   -1,
        delay:    f.delay + 0.5,
      })
    })

    // ── 3. "404" digits glitch on loop ───────────────────────────────────────
    const glitchLoop = () => {
      const targets = [fourRef.current, zeroRef.current, four2Ref.current]
      const picked = targets[Math.floor(Math.random() * targets.length)]
      if (!picked) return
      gsap.timeline()
        .to(picked, { x: 6,  skewX: 8,  duration: 0.06, ease: 'none' })
        .to(picked, { x: -4, skewX: -4, duration: 0.06, ease: 'none' })
        .to(picked, { x: 0,  skewX: 0,  duration: 0.08, ease: 'none' })
    }
    // Random glitch every 3–6 seconds
    const glitchInterval = setInterval(glitchLoop, 3000 + Math.random() * 3000)

    // ── 4. Tag swing ─────────────────────────────────────────────────────────
    gsap.to(tagRef.current, {
      rotation: 6,
      duration: 2,
      ease:     'sine.inOut',
      yoyo:     true,
      repeat:   -1,
    })

    // ── 5. Thread dangle ─────────────────────────────────────────────────────
    gsap.to(threadRef.current, {
      scaleX:   1.04,
      skewX:    1.5,
      duration: 1.8,
      ease:     'sine.inOut',
      yoyo:     true,
      repeat:   -1,
    })

    return () => clearInterval(glitchInterval)
  }, { scope: rootRef })

  // ── Magnetic CTA ─────────────────────────────────────────────────────────
  function magneticEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    gsap.to(e.currentTarget, { scale: 1.06, duration: 0.25, ease: 'power2.out' })
  }
  function magneticMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width  / 2) * 0.28
    const y = (e.clientY - r.top  - r.height / 2) * 0.28
    gsap.to(e.currentTarget, { x, y, duration: 0.25, ease: 'power2.out' })
  }
  function magneticLeave(e: React.MouseEvent<HTMLAnchorElement>) {
    gsap.to(e.currentTarget, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.5)' })
  }

  return (
    <div ref={rootRef} style={{
      minHeight: '100vh',
      background: '#0E0E0E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Syne, sans-serif',
    }}>

      {/* ── Noise grain overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: '200px',
        opacity: 0.4,
      }}/>

      {/* ── Radial glow ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,241,53,0.07) 0%, transparent 70%)',
      }}/>

      {/* ── Floating garments ── */}
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          ref={el => { floatersRef.current[i] = el }}
          style={{
            position:  'absolute',
            left:       f.x,
            top:        f.y,
            fontSize:  `${f.size}px`,
            filter:    `drop-shadow(0 0 12px ${f.color}55)`,
            transform: `rotate(${f.rot}deg)`,
            zIndex:     1,
            userSelect: 'none',
            willChange: 'transform',
          }}
        >
          {f.emoji}
        </div>
      ))}

      {/* ── Thread dangling from top ── */}
      <div ref={threadRef} style={{
        position:        'absolute',
        top:             0,
        left:            '50%',
        transform:       'translateX(-50%)',
        width:           2,
        height:          120,
        background:      'linear-gradient(to bottom, rgba(200,241,53,0.6), transparent)',
        zIndex:          2,
        transformOrigin: 'top center',
        borderRadius:    99,
      }}/>

      {/* ── Clothing tag ── */}
      <div ref={tagRef} style={{
        position:        'absolute',
        top:             108,
        left:            '50%',
        transform:       'translateX(-50%)',
        background:      '#F8F5EF',
        borderRadius:    6,
        padding:         '6px 12px',
        zIndex:          3,
        boxShadow:       '0 4px 20px rgba(0,0,0,0.35)',
        transformOrigin: 'top center',
        textAlign:       'center',
        minWidth:        80,
      }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: '#0E0E0E', textTransform: 'uppercase' }}>DRIPLY®</div>
        <div style={{ fontSize: '0.48rem', color: '#888', letterSpacing: '0.08em', marginTop: 2 }}>SIZE: NOT FOUND</div>
        <div style={{ fontSize: '0.48rem', color: '#888', letterSpacing: '0.04em' }}>WASH: COLD. PAGE: MISSING.</div>
        {/* Barcode lines */}
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
          {[3,1,2,1,3,2,1,2,1,3,1,2,1,1,3].map((w,i) => (
            <div key={i} style={{ width: w, height: 16, background: '#0E0E0E' }}/>
          ))}
        </div>
        <div style={{ fontSize: '0.42rem', color: '#888', marginTop: 2, letterSpacing: '0.1em' }}>4-0-4</div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        position:   'relative',
        zIndex:      4,
        textAlign:  'center',
        padding:    '0 1.5rem',
        marginTop:   64,
        maxWidth:    640,
      }}>

        {/* 404 digits */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap:         '0.1em',
          lineHeight:  0.9,
          marginBottom: 20,
          userSelect: 'none',
        }}>
          <div ref={fourRef} style={{
            fontSize:    'clamp(100px, 22vw, 210px)',
            fontWeight:   800,
            color:        '#C8F135',
            letterSpacing: '-0.04em',
            willChange:   'transform',
          }}>4</div>

          {/* Zero is a shirt hole */}
          <div ref={zeroRef} style={{
            position:    'relative',
            fontSize:    'clamp(100px, 22vw, 210px)',
            fontWeight:   800,
            color:        '#F8F5EF',
            letterSpacing: '-0.04em',
            willChange:   'transform',
          }}>
            0
            <div style={{
              position:    'absolute',
              inset:       '30% 28%',
              borderRadius: '50%',
              background:   '#0E0E0E',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     'clamp(14px, 3vw, 28px)',
            }}>
              🕳️
            </div>
          </div>

          <div ref={four2Ref} style={{
            fontSize:    'clamp(100px, 22vw, 210px)',
            fontWeight:   800,
            color:        '#FF5B3A',
            letterSpacing: '-0.04em',
            willChange:   'transform',
          }}>4</div>
        </div>

        {/* ── Explicit "Page Not Found" — non-tech users need this front and centre ── */}
        <div style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:              8,
          background:      'rgba(248,245,239,0.07)',
          border:          '1px solid rgba(248,245,239,0.12)',
          borderRadius:     99,
          padding:         '6px 18px',
          marginBottom:     20,
        }}>
          <span style={{ fontSize: '0.8rem' }}>⚠️</span>
          <span style={{
            fontSize:      '0.85rem',
            fontWeight:     700,
            color:          'rgba(248,245,239,0.9)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            Page not found
          </span>
        </div>

        {/* Explanation — plain language, no jargon */}
        <p style={{
          fontSize:      'clamp(1rem, 2vw, 1.1rem)',
          fontWeight:     600,
          color:          '#F8F5EF',
          lineHeight:     1.6,
          marginBottom:   8,
          letterSpacing: '-0.01em',
          opacity:        0.92,
        }}>
          The page you're looking for doesn't exist or may have moved.
        </p>

        {/* Witty line — secondary, smaller, clearly decorative */}
        <p ref={subRef} style={{
          fontSize:     '0.9rem',
          fontWeight:    500,
          color:         'rgba(248,245,239,0.42)',
          lineHeight:    1.55,
          marginBottom:  36,
          fontStyle:    'italic',
        }}>
          {SUB}
        </p>

        {/* CTAs */}
        <div ref={ctaRef} style={{
          display:        'flex',
          gap:             16,
          justifyContent: 'center',
          flexWrap:        'wrap',
        }}>
          <Link
            to="/"
            onMouseEnter={magneticEnter}
            onMouseMove={magneticMove}
            onMouseLeave={magneticLeave}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:              8,
              padding:          '0.85rem 2rem',
              background:       '#C8F135',
              color:            '#0E0E0E',
              fontFamily:       'Syne, sans-serif',
              fontWeight:        800,
              fontSize:          '0.95rem',
              borderRadius:      14,
              textDecoration:    'none',
              letterSpacing:    '-0.01em',
              boxShadow:        '0 4px 24px rgba(200,241,53,0.3)',
              willChange:       'transform',
            }}
          >
            ← Go back home
          </Link>

          <Link
            to="/dashboard"
            onMouseEnter={magneticEnter}
            onMouseMove={magneticMove}
            onMouseLeave={magneticLeave}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:             8,
              padding:         '0.85rem 2rem',
              background:      'transparent',
              color:           '#F8F5EF',
              fontFamily:      'Syne, sans-serif',
              fontWeight:       700,
              fontSize:         '0.95rem',
              borderRadius:     14,
              textDecoration:   'none',
              border:           '1.5px solid rgba(248,245,239,0.15)',
              letterSpacing:   '-0.01em',
              willChange:      'transform',
            }}
          >
            👕 Start designing
          </Link>
        </div>

        {/* Easter egg bottom line */}
        <p style={{
          marginTop:     40,
          fontSize:      '0.72rem',
          color:          'rgba(248,245,239,0.18)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          100% cotton error · Pre-shrunk · Machine wash cold
        </p>
      </div>

      {/* ── Nav logo top left ── */}
      <div style={{
        position:   'absolute',
        top:         24,
        left:        28,
        zIndex:      10,
        fontFamily: 'Syne, sans-serif',
        fontWeight:  800,
        fontSize:    '1.4rem',
        letterSpacing: '-0.03em',
        color:        '#F8F5EF',
      }}>
        Drip<span style={{ color: '#FF5B3A' }}>ly</span>
      </div>

      {/* ── Scan lines on the 0 for texture ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        @keyframes flicker {
          0%, 97%, 100% { opacity: 1 }
          98%            { opacity: 0.6 }
          99%            { opacity: 0.9 }
        }

        @keyframes spark {
          0%   { transform: scale(0) rotate(0deg);   opacity: 1 }
          100% { transform: scale(1.5) rotate(90deg); opacity: 0 }
        }
      `}</style>
    </div>
  )
}

