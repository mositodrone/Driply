// components/DashboardTutorial.tsx
//
// First-time dashboard walkthrough. Spotlights real UI via Driver.js rather
// than a generic slideshow — see the panel-level data-dash attributes
// already on LeftPanel/RightPanel/TopBar's root elements, reused here as
// selectors. Two elements need a small new attribute each (flagged below,
// not applied blind since I don't have current copies of those two files).
//
// npm install driver.js — required, not yet a dependency.
// Also needs `import 'driver.js/dist/driver.css'` added once, globally —
// alongside wherever styles.css is imported in routes/__root.tsx.

import { driver, type DriveStep } from 'driver.js'
import { useEffect, useRef } from 'react'
import { markTutorialSeen } from '@/lib/actions/user.actions'

// ── Mark-seen server fn ─────────────────────────────────────────────────────
// Called once, whichever way the tour ends — finished all 8 steps, or
// closed early via the × / Escape. Driver.js's onDestroyed hook fires in
// both cases, so one hook covers "completed" and "skipped" identically —
// skipping shouldn't mean the tour nags again next login.

// ── Step definitions ─────────────────────────────────────────────────────────
//  Selectors used, and what needs to exist for each:
//   [data-dash="left"]     — LeftPanel root, already present
//   .dash-garment-card     — already present (LeftPanel)
//   [data-tour="add-elements"]  — NEW, needs adding to LeftPanel's "Add" section wrapper
//   .dash-canvas-area      — already present (dashboard.tsx)
//   [data-dash="layer-list"]    — already present (LeftPanel)
//   [data-dash="right"]    — RightPanel root, already present
//   [data-tour="undo-redo"]     — NEW, needs adding to LeftPanel's undo/redo row wrapper
//   [data-dash="topbar"] .dash-btn-ghost / .dash-btn-lime — already present (TopBar)
const steps: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Driply',
      description: "Quick tour — 8 steps, skip anytime with the × or Escape.",
    },
  },
  {
    element: '.dash-garment-card',
    popover: {
      title: '1. Pick a garment',
      description: 'Start here — choose what you\u2019re designing on.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="add-elements"]',
    popover: {
      title: '2. Add elements',
      description: 'Text, images, or shapes — drop them onto the canvas.',
      side: 'right',
    },
  },
  {
    element: '.dash-canvas-area',
    popover: {
      title: '3. Your canvas',
      description: 'Drag, resize, and rotate anything you\u2019ve placed.',
      side: 'left',
    },
  },
  {
    element: '[data-dash="layer-list"]',
    popover: {
      title: '4. Layers',
      description: 'Every element you add shows up here — reorder, lock, or delete.',
      side: 'right',
    },
  },
  {
    element: '[data-dash="right"]',
    popover: {
      title: '5. Properties',
      description: 'Select anything on the canvas to edit its color, size, font, and more here.',
      side: 'left',
    },
  },
  {
    element: '[data-tour="undo-redo"]',
    popover: {
      title: '6. Undo / redo',
      description: 'Your safety net — nothing here is permanent until you export or order.',
      side: 'right',
    },
  },
  {
    element: '[data-dash="topbar"] .dash-btn-ghost',
    popover: {
      title: '7. Export preview',
      description: 'See exactly what your design will look like before committing to anything.',
      side: 'bottom',
    },
  },
  {
    element: '[data-dash="topbar"] .dash-btn-lime',
    popover: {
      title: '8. Request a quote',
      description: 'Ready to order? This starts the checkout flow. That\u2019s the whole tour!',
      side: 'bottom',
    },
  },
]

export function DashboardTutorial({ hasSeenTutorial }: { hasSeenTutorial: boolean }) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (hasSeenTutorial || startedRef.current) return
    startedRef.current = true

    // One tick so the dashboard's own mount/layout effects settle first —
    // spotlighting against layout that's still shifting looks broken.
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        steps,
        // waitForElement / skipMissingElement matter here specifically:
        // the dashboard conditionally renders based on canAct/activeGarment
        // state, so a step's target isn't guaranteed to exist the instant
        // the tour starts.
        allowClose: true,
        overlayOpacity: 0.7,
        onDestroyed: () => {
          markTutorialSeenFn()
        },
      })
      driverObj.drive()
    }, 400)

    return () => clearTimeout(timer)
  }, [hasSeenTutorial])

  return null // Driver.js manages its own DOM — nothing to render here
}
