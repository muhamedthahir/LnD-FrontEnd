import { useEffect, useRef } from 'react'

/** Percentage-based pane separator, shared by coding workspaces. */
export default function ResizeHandle({ containerRef, value, onChange, min = 20, max = 80, step = 4, orientation = 'vertical', label = 'Resize panels', className = '', onDraggingChange, children }) {
  const drag = useRef(null)
  const frame = useRef(null)
  const latest = useRef({ value, onChange, onDraggingChange })
  latest.current = { value, onChange, onDraggingChange }
  const clamp = next => Math.max(min, Math.min(max, next))
  const finish = (cancel = false) => {
    if (!drag.current) return
    cancelAnimationFrame(frame.current)
    frame.current = null
    const state = drag.current
    drag.current = null
    latest.current.onChange(cancel ? state.startValue : state.nextValue)
    document.body.style.userSelect = state.userSelect
    document.body.style.cursor = state.cursor
    latest.current.onDraggingChange?.(false)
  }
  useEffect(() => () => {
    cancelAnimationFrame(frame.current)
    if (drag.current) {
      document.body.style.userSelect = drag.current.userSelect
      document.body.style.cursor = drag.current.cursor
    }
  }, [])
  return <div role="separator" tabIndex={0} aria-label={label} aria-orientation={orientation} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-valuetext={`${Math.round(value)} percent`} className={`cz-resize-handle ${className}`} onKeyDown={event => {
    const previous = orientation === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
    const next = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown'
    if (![previous, next, 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    onChange(event.key === 'Home' ? min : event.key === 'End' ? max : clamp(value + (event.key === previous ? -step : step)))
  }} onPointerDown={event => {
    if (event.button !== 0 || !containerRef.current) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { rect: containerRef.current.getBoundingClientRect(), startValue: value, nextValue: value, userSelect: document.body.style.userSelect, cursor: document.body.style.cursor }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize'
    onDraggingChange?.(true)
  }} onPointerMove={event => {
    if (!drag.current) return
    const { rect } = drag.current
    const extent = orientation === 'vertical' ? rect.width : rect.height
    if (!extent) return
    drag.current.nextValue = clamp((orientation === 'vertical' ? event.clientX - rect.left : event.clientY - rect.top) / extent * 100)
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      if (drag.current) latest.current.onChange(drag.current.nextValue)
    })
  }} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish()}>{children}</div>
}
