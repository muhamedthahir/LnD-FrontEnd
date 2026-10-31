import { useEffect, useState } from 'react'

export default function usePresence(open, exitDuration = 150) {
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) { if (!present) setPresent(true); return }
    if (!present) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPresent(false); return }
    const timer = setTimeout(() => setPresent(false), exitDuration)
    return () => clearTimeout(timer)
  }, [open, exitDuration, present])
  return open || present
}
