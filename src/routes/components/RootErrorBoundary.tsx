// src/components/RootErrorBoundary.tsx
//
// Passed to createRootRoute({ errorComponent: RootErrorBoundary })
// Catches any error not handled by a route-level errorComponent.
// Styled to match the Driply dark theme.

import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function RootErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router  = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    gsap.fromTo(rootRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, [])

  // Log to console in dev so you can still see the full stack
  useEffect(() => {
    console.error('[RootErrorBoundary]', error)
  }, [error])

  const isDev     = import.meta.env.DEV
  const isAuthErr = error?.message?.toLowerCase().includes('auth') ||
                    error?.message?.toLowerCase().includes('clerk')

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#0E0E0E',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      fontFamily:     'Syne, sans-serif',
    }}>
      <div
        ref={rootRef}
        style={{
          maxWidth:     480,
          width:        '100%',
          textAlign:    'center',
          opacity:       0,
        }}
      >
        {/* Icon */}
        <div style={{
          width:          64,
          height:         64,
          borderRadius:   18,
          background:     'rgba(255,91,58,0.1)',
          border:         '1px solid rgba(255,91,58,0.2)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '1.75rem',
          margin:         '0 auto 1.5rem',
        }}>
          ⚠️
        </div>

        <h1 style={{
          fontSize:      '1.35rem',
          fontWeight:     800,
          color:         '#F8F5EF',
          letterSpacing: '-0.02em',
          marginBottom:  '0.6rem',
        }}>
          {isAuthErr ? 'Session error' : 'Something went wrong'}
        </h1>

        <p style={{
          fontSize:     '0.85rem',
          color:        'rgba(248,245,239,0.45)',
          lineHeight:    1.6,
          marginBottom: '2rem',
        }}>
          {isAuthErr
            ? 'There was a problem with your session. Try signing in again.'
            : 'An unexpected error occurred. Refreshing usually fixes it.'}
        </p>

        {/* Dev-only error details */}
        {isDev && error?.message && (
          <pre style={{
            background:   'rgba(255,255,255,0.04)',
            border:       '1px solid rgba(255,255,255,0.07)',
            borderRadius:  12,
            padding:      '0.875rem 1rem',
            fontSize:     '0.7rem',
            color:        'rgba(255,91,58,0.8)',
            textAlign:    'left',
            overflowX:    'auto',
            marginBottom: '1.5rem',
            whiteSpace:   'pre-wrap',
            wordBreak:    'break-word',
          }}>
            {error.message}
          </pre>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding:       '0.7rem 1.5rem',
              background:    '#C8F135',
              color:         '#0E0E0E',
              fontFamily:    'Syne, sans-serif',
              fontWeight:     700,
              fontSize:      '0.85rem',
              border:        'none',
              borderRadius:   12,
              cursor:        'pointer',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d4f54d')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C8F135')}
          >
            Try again
          </button>

          <button
            onClick={() => router.navigate({ to: '/' })}
            style={{
              padding:       '0.7rem 1.5rem',
              background:    'transparent',
              color:         'rgba(248,245,239,0.6)',
              fontFamily:    'Syne, sans-serif',
              fontWeight:     600,
              fontSize:      '0.85rem',
              border:        '1px solid rgba(255,255,255,0.1)',
              borderRadius:   12,
              cursor:        'pointer',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            ← Go home
          </button>
        </div>

        <p style={{
          marginTop:     '2rem',
          fontSize:      '0.65rem',
          color:         'rgba(255,255,255,0.15)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Driply · Error boundary
        </p>
      </div>
    </div>
  )
}
