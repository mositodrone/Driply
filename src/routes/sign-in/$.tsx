// routes/sign-in/$.tsx
//
// Catch-all ("/sign-in/$") — required, not optional, so Clerk's <SignIn>
// can navigate to its own nested sub-steps (2FA, SSO callback, etc.)
// without 404ing. Same idea as Next.js's [[...sign-in]] catch-all segment.
//
// Reads a `redirect` search param (set by protected routes' beforeLoad —
// see my-designs.tsx) so signing in sends the user back to wherever they
// actually came from, not always to a fixed default.

import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/tanstack-react-start'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { z } from 'zod' // swap for your project's validator if you're not on zod

const signInSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
  validateSearch: signInSearchSchema,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  const wrapRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(wrapRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
    // Slow ambient drift — subtle, not a focal point
    gsap.to(glowRef.current, { x: 40, y: -30, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0B0B0C] flex items-center justify-center px-4 overflow-hidden">

      {/* Ambient glow — the same two brand colors already in play elsewhere
          (orange from the logo/Clerk accents, lime from dash-btn-lime),
          just soft and slow here so it doesn't compete with the form. */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[120px] opacity-20"
        style={{ background: 'radial-gradient(circle, #FF5B3A, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 w-[480px] h-[480px] rounded-full blur-[130px] opacity-[0.14]"
        style={{ background: 'radial-gradient(circle, #C8F135, transparent 70%)' }}
      />

      <div ref={wrapRef} className="relative z-10 w-full max-w-[400px] flex flex-col items-center">

        {/* Logo — same mark as the navbar, links home */}
        <a href="/" className="text-2xl font-bold tracking-tight mb-8 text-white">
          Drip<span style={{ color: '#FF5B3A' }}>ly</span>
        </a>

        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          // forceRedirectUrl always wins over any other redirect Clerk
          // might otherwise apply, so "came from /my-designs" reliably
          // lands back on /my-designs rather than a fixed default.
          forceRedirectUrl={redirect || '/dashboard'}
          appearance={{
            // Same palette already established for Clerk's UserButton in
            // the navbar (colorPrimary #FF5B3A, #141416 panel, etc.) —
            // kept identical rather than introducing a second Clerk theme.
            variables: {
              colorPrimary:         '#FF5B3A',
              colorBackground:      '#141416',
              colorText:            '#F8F5EF',
              colorTextSecondary:   'rgba(255,255,255,0.5)',
              colorInputBackground: 'rgba(255,255,255,0.04)',
              colorInputText:       '#F8F5EF',
              borderRadius:         '10px',
            },
            elements: {
              rootBox: { width: '100%' },
              card: {
                background:   '#141416',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow:    '0 24px 60px rgba(0,0,0,0.55)',
                padding:      '2rem',
              },
              headerTitle:    { color: '#F8F5EF', fontWeight: 700, fontSize: '1.3rem' },
              headerSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' },
              socialButtonsBlockButton: {
                background:   'rgba(255,255,255,0.04)',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color:        'rgba(255,255,255,0.85)',
              },
              socialButtonsBlockButtonText: { fontSize: '0.82rem', fontWeight: 500 },
              dividerLine: { background: 'rgba(255,255,255,0.08)' },
              dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' },
              formFieldLabel: { color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' },
              formFieldInput: {
                background:   'rgba(255,255,255,0.04)',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color:        '#F8F5EF',
              },
              formButtonPrimary: {
                borderRadius:   '10px',
                fontSize:       '0.85rem',
                textTransform:  'none',
                boxShadow:      'none',
              },
              footerActionText: { color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' },
              footerActionLink: { color: '#FF5B3A', fontSize: '0.78rem' },
              identityPreviewEditButton: { color: '#FF5B3A' },
            },
          }}
        />

        <p className="mt-6 text-[0.72rem] text-white/25 text-center">
          Custom apparel, designed by you.
        </p>
      </div>
    </div>
  )
}
