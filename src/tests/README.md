# Driply — Test Suite

## Stack
- **Vitest** — test runner (Jest-compatible API, native Vite/ESM)
- **@testing-library/react** — component tests
- **jsdom** — browser-like environment for React tests
- **node** environment — pure logic tests (faster, no DOM overhead)

## Running tests

```bash
# Run all tests once
pnpm test

# Watch mode — re-runs on file change (best for active development)
pnpm vitest

# With coverage report
pnpm vitest --coverage

# Run a specific file
pnpm vitest src/tests/garments.test.ts

# Run tests matching a name pattern
pnpm vitest -t "createSubmission"
```

## File structure

```
src/
  tests/
    __setup__.ts              ← global mocks (Konva, GSAP, Clerk, Mongoose)
    garments.test.ts          ← pure data/util logic
    submission_actions.test.ts ← server action logic (DB mocked)
    useCanvasDesign.test.ts   ← hook behaviour (coming next)
    TopBar.test.tsx           ← component rendering + interactions
  
  # Co-located tests also work:
  components/
    TopBar.test.tsx           ← same as above, just closer to source
```

## Environment per file

Tests default to **jsdom** (good for components).  
Add this comment at the top of any file that doesn't need a DOM:

```ts
// @vitest-environment node
```

Node environment is ~3x faster — use it for actions, utils, and data files.

## What's mocked globally (`__setup__.ts`)

| Module | Why |
|--------|-----|
| `konva` / `react-konva` | jsdom has no canvas implementation |
| `gsap` / `@gsap/react` | Reads `window.matchMedia` / `requestAnimationFrame` |
| `@clerk/tanstack-react-start` | Never hit real auth in unit tests |
| `@tanstack/react-router` | Route primitives error outside a router context |
| `mongoose` / `connectToDatabase` | Never connect to a real DB in unit tests |

## What NOT to test here

- **API route handlers** (`src/routes/api/`) — these import Nitro server internals. Test them with integration/e2e tools (Playwright, supertest against a running server).
- **Full page routes** — same reason.
- **Paystack flows** — mock the fetch call, test your own logic around it.
