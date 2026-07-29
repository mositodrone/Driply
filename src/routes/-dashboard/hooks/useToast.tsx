import { useRef, useState } from 'react'

/**
 * Lightweight toast notification. Returns the trigger function plus
 * the JSX to render — drop `{Toast}` once near the root of the page.
 */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  function showToast(m: string) {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2400)
  }

  const Toast = msg ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] pointer-events-none">
      <div className="dash-toast">{msg}</div>
    </div>
  ) : null

  return { showToast, Toast }
}
