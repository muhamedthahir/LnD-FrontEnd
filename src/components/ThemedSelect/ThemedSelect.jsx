import { useState, useRef, useEffect, useLayoutEffect, useId, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import './ThemedSelect.css'

/** Strip classes meant for native <select> / filter inputs — they must not sit on the wrapper or you get a double frame + chevrons. */
function wrapperClassName(className) {
  return className
    .replace(/\berror\b/g, '')
    .replace(/\buser-styled-select\b/g, '')
    .replace(/\bfilter-select\b/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Theme-styled dropdown (custom list). Native <select> option menus cannot be styled in browsers.
 * onChange matches native: (e) => e.target.name / e.target.value
 */
function ThemedSelect({
  name = '',
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  size = 'default',
  id,
  'aria-label': ariaLabel
}) {
  const uid = useId()
  const listboxId = `${uid}-listbox`
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const portalRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 })

  const hasError = /\berror\b/.test(className)
  const extraWrapperClass = wrapperClassName(className)
  const wrapperClass = [
    'themed-select',
    size === 'compact' && 'themed-select--compact',
    open && 'themed-select--open',
    disabled && 'themed-select--disabled',
    hasError && 'themed-select--error',
    extraWrapperClass
  ]
    .filter(Boolean)
    .join(' ')

  const [highlightIndex, setHighlightIndex] = useState(-1)

  const displayLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value)
    if (hit) return hit.label
    if (value !== undefined && value !== null && String(value) !== '') return String(value)
    const first = options[0]
    return first && !first.disabled ? first.label : '—'
  }, [options, value])

  const commit = useCallback(
    (nextValue) => {
      setOpen(false)
      setHighlightIndex(-1)
      if (nextValue === value) {
        triggerRef.current?.focus()
        return
      }
      onChange({ target: { name, value: nextValue } })
      requestAnimationFrame(() => triggerRef.current?.focus())
    },
    [name, onChange, value]
  )

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 4
    const maxWant = 280
    const below = window.innerHeight - r.bottom - gap - 8
    const above = r.top - gap - 8
    const openDown = below >= 140 || below >= above
    const maxHeight = Math.min(maxWant, Math.max(120, openDown ? below : above))
    const top = openDown ? r.bottom + gap : Math.max(8, r.top - gap - maxHeight)
    setCoords({
      top,
      left: r.left,
      width: r.width,
      maxHeight
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, options.length, updatePosition])

  useEffect(() => {
    if (!open) return
    const onScrollResize = () => updatePosition()
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e) => {
      const t = e.target
      if (rootRef.current?.contains(t)) return
      if (portalRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setHighlightIndex(-1)
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const delta = e.key === 'ArrowDown' ? 1 : -1
        let start = highlightIndex
        if (start < 0) {
          const vi = options.findIndex((o) => o.value === value)
          start = vi >= 0 ? vi : 0
        }
        let next = start
        for (let attempt = 0; attempt <= options.length + 2; attempt++) {
          next += delta
          if (next < 0) next = options.length - 1
          if (next >= options.length) next = 0
          if (options[next] && !options[next].disabled) {
            setHighlightIndex(next)
            break
          }
          if (next === start || attempt > options.length) break
        }
        return
      }
      if (e.key === 'Enter') {
        const idx = highlightIndex >= 0 ? highlightIndex : options.findIndex((o) => o.value === value)
        const opt = options[idx]
        if (opt && !opt.disabled) {
          e.preventDefault()
          commit(opt.value)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, highlightIndex, options, value, commit])

  const toggleOpen = () => {
    if (disabled) return
    setOpen((o) => {
      const next = !o
      if (next) {
        const i = options.findIndex((opt) => opt.value === value)
        const firstSel = options.findIndex((opt) => !opt.disabled)
        setHighlightIndex(i >= 0 ? i : firstSel >= 0 ? firstSel : -1)
      } else setHighlightIndex(-1)
      return next
    })
  }

  const triggerId = id || `${uid}-trigger`

  const list = open
    ? createPortal(
        <div
          ref={portalRef}
          className="themed-select__portal"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 4000
          }}
        >
          <ul
            id={listboxId}
            role="listbox"
            className="themed-select__list"
            style={{ maxHeight: coords.maxHeight }}
          >
            {options.map((opt, i) => {
              const selected = opt.value === value
              const hi = i === highlightIndex
              return (
                <li
                  key={`${String(opt.value)}-${i}`}
                  role="option"
                  aria-selected={selected}
                  className={[
                    'themed-select__option',
                    opt.disabled && 'themed-select__option--disabled',
                    selected && 'themed-select__option--selected',
                    hi && 'themed-select__option--highlight'
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => !opt.disabled && setHighlightIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => !opt.disabled && commit(opt.value)}
                >
                  {opt.label}
                </li>
              )
            })}
          </ul>
        </div>,
        document.body
      )
    : null

  return (
    <div ref={rootRef} className={wrapperClass}>
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        name={name}
        className="themed-select__trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={toggleOpen}
      >
        <span className="themed-select__value">{displayLabel}</span>
        <span className="themed-select__chevron" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {list}
    </div>
  )
}

export default ThemedSelect
