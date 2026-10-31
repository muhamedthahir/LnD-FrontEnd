import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

// A critically damped spring for the one direct-manipulation surface in the shell.
// Position/velocity stay outside React so reversing a gesture does not restart it.
export default function useDrawerMotion(ref, enabled, open, onClose) {
  const position = useRef(null)
  const velocity = useRef(0)
  const frame = useRef(null)
  const drag = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  const paint = useCallback(value => {
    position.current = value
    if (ref.current) ref.current.style.transform = `translateX(${value}px)`
  }, [ref])
  const spring = useCallback(target => {
    cancelAnimationFrame(frame.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { velocity.current = 0; paint(target); return }
    let previous = performance.now()
    const tick = now => {
      const dt = Math.min((now - previous) / 1000, .032)
      previous = now
      // Analytic critically damped solution, stable even under a delayed frame.
      const displacement = (position.current ?? target) - target
      const omega = 25
      const coefficient = velocity.current + omega * displacement
      const decay = Math.exp(-omega * dt)
      const next = (displacement + coefficient * dt) * decay
      velocity.current = (velocity.current - omega * coefficient * dt) * decay
      if (target === 0 && next > 0) { paint(0); velocity.current = 0; frame.current = null; return }
      paint(target + next)
      if (Math.abs(next) < .25 && Math.abs(velocity.current) < 2) { paint(target); velocity.current = 0; frame.current = null; return }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [paint])
  useLayoutEffect(() => {
    if (!enabled || !ref.current) { position.current = null; return }
    const node = ref.current
    node.style.transition = 'none'
    const width = node.getBoundingClientRect().width
    if (position.current === null) paint(-width)
    drag.current = null
    spring(open ? 0 : -width)
    return () => cancelAnimationFrame(frame.current)
  }, [enabled, open, paint, ref, spring])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  return {
    onPointerDown(event) {
      if (!enabled || !open || event.pointerType === 'mouse' || event.target.closest('a,button,input,select,textarea')) return
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, previousX: event.clientX, previousTime: event.timeStamp, start: position.current || 0, width: event.currentTarget.getBoundingClientRect().width, tracking: false }
    },
    onPointerMove(event) {
      const state = drag.current
      if (!state || state.id !== event.pointerId) return
      const dx = event.clientX - state.x, dy = event.clientY - state.y
      if (!state.tracking) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag.current = null; return }
        if (Math.abs(dx) < 8) return
        state.tracking = true
        cancelAnimationFrame(frame.current)
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      event.preventDefault()
      const elapsed = event.timeStamp - state.previousTime
      if (elapsed > 0) velocity.current = Math.max(-2000, Math.min(2000, (event.clientX - state.previousX) / elapsed * 1000))
      state.previousX = event.clientX; state.previousTime = event.timeStamp
      paint(Math.max(-state.width, Math.min(0, state.start + dx)))
    },
    onPointerUp(event) {
      const state = drag.current
      drag.current = null
      if (!state?.tracking) return
      const releaseDelay = event.timeStamp - state.previousTime
      if (releaseDelay > 80) velocity.current *= Math.exp(-releaseDelay / 50)
      if ((position.current || 0) < -state.width * .28 || velocity.current < -550) close.current?.()
      else spring(0)
    },
    onPointerCancel() { if (drag.current?.tracking) { drag.current = null; spring(0) } else drag.current = null },
    onLostPointerCapture() { if (drag.current?.tracking) { drag.current = null; spring(0) } }
  }
}
