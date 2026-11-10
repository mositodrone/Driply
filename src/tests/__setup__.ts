// src/tests/__setup__.ts
//
// Runs before every test file. Sets up global mocks that would otherwise
// break in jsdom — canvas, Konva, Clerk, GSAP, and server modules.

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// ── Cleanup React trees after each test ───────────────────────────────────────
afterEach(() => {
  cleanup()
})

// ── Canvas / Konva ────────────────────────────────────────────────────────────
vi.mock('konva', () => ({
  default: {
    Stage:       vi.fn(),
    Layer:       vi.fn(),
    Rect:        vi.fn(),
    Text:        vi.fn(),
    Image:       vi.fn(),
    Group:       vi.fn(),
    Transformer: vi.fn(),
  },
}))

vi.mock('react-konva', () => ({
  Stage:       ({ children }: any) => children,
  Layer:       ({ children }: any) => children,
  Rect:        () => null,
  Text:        () => null,
  KonvaImage:  () => null,
  Group:       ({ children }: any) => children,
  Transformer: () => null,
}))

// ── GSAP ──────────────────────────────────────────────────────────────────────
vi.mock('gsap', () => ({
  default: {
    to:       vi.fn(),
    from:     vi.fn(),
    fromTo:   vi.fn(),
    set:      vi.fn(),
    timeline: vi.fn(() => ({
      to:     vi.fn().mockReturnThis(),
      from:   vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      set:    vi.fn().mockReturnThis(),
      play:   vi.fn().mockReturnThis(),
      pause:  vi.fn().mockReturnThis(),
    })),
    registerPlugin: vi.fn(),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: (fn: () => void) => fn(),
}))

// ── Clerk ─────────────────────────────────────────────────────────────────────
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(() => ({
    user: {
      id:         'test-user-id',
      firstName:  'Test',
      lastName:   'User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
    isLoaded:   true,
    isSignedIn: true,
  })),
  useAuth:     vi.fn(() => ({ userId: 'test-user-id', isSignedIn: true })),
  SignInButton: () => null,
  UserButton:   () => null,
}))

// ── TanStack Router ───────────────────────────────────────────────────────────
vi.mock('@tanstack/react-router', () => ({
  Link:            ({ children }: any) => children,
  useNavigate:     vi.fn(() => vi.fn()),
  useParams:       vi.fn(() => ({})),
  useSearch:       vi.fn(() => ({})),
  createFileRoute: vi.fn(() => vi.fn()),
}))

// ── Mongoose / DB ─────────────────────────────────────────────────────────────
vi.mock('../database/mongoose', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}))

// ── window APIs jsdom doesn't implement ───────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  })),
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}))

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()
