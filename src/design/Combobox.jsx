import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { FieldContext } from './FieldContext'
export function SelectControl({ name = '', value, onChange, options = [], disabled, className = '', id, size, 'aria-label': label, ...props }) {
  const field = useContext(FieldContext)
  return <select id={id || field?.controlId} name={name} value={value ?? ''} onChange={onChange} disabled={disabled} aria-label={label || (field?.labelId ? undefined : name.replaceAll('_',' ') || 'Select an option')} aria-describedby={field?.describedBy} aria-invalid={field?.invalid || undefined} aria-required={field?.required || undefined} className={className} {...props}>{options.map((option,index) => <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select>
}
export default function Combobox({ options = [], value, onChange, placeholder = 'Select an option', label = '', disabled = false, required = false, error = '', searchable = false, multiple = false, className = '', renderOption, valueKey = 'id', labelKey = 'name', onCreateNew }) {
  const generatedId = useId()
  const field = useContext(FieldContext)
  const id = field?.controlId || generatedId
  const accessibleLabel = label || field?.labelText || placeholder
  const button = useRef(null)
  const popup = useRef(null)
  const keyboardOpening = useRef(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({})
  const key = option => typeof option === 'object' ? option[valueKey] : option
  const text = option => String(typeof option === 'object' ? option[labelKey] : option)
  const filtered = options.filter(option => text(option).toLowerCase().includes(search.toLowerCase()))
  const selected = option => multiple ? (value || []).includes(key(option)) : String(value) === String(key(option))
  const activeOptionId = active >= 0 && active < filtered.length ? `${id}-option-${active}` : undefined
  const labels = options.filter(selected).map(text).join(', ')
  const choose = option => {
    const item = key(option)
    onChange(multiple ? selected(option) ? value.filter(existing => existing !== item) : [...(value || []),item] : item)
    if (!multiple) { setOpen(false); setSearch(''); button.current?.focus() }
    else (popup.current?.querySelector('input') || button.current)?.focus({ preventScroll: true })
  }
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const rect = button.current.getBoundingClientRect()
      const height = Math.min(300,window.innerHeight - 24)
      const below = window.innerHeight - rect.bottom
      const above = rect.top
      const upward = below < 180 && above > below
      setPosition({ left: Math.max(8,Math.min(rect.left,window.innerWidth - rect.width - 8)), width: Math.min(rect.width,window.innerWidth - 16), maxHeight: upward ? Math.min(height,above - 12) : Math.min(height,below - 12), ...(upward ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }) })
    }
    update()
    window.addEventListener('resize',update)
    window.addEventListener('scroll',update,true)
    return () => { window.removeEventListener('resize',update); window.removeEventListener('scroll',update,true) }
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = event => { if (!popup.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown',close)
    return () => document.removeEventListener('pointerdown',close)
  }, [open])
  const keyboard = event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus(); return }
    if (event.key === 'Tab') {
      if (popup.current?.contains(event.target)) {
        const dialog = button.current.closest('[role="dialog"],[role="alertdialog"]')
        const scope = dialog || document
        const controls = [...scope.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(element => element.getClientRects().length && !element.closest('[inert]') && !popup.current?.contains(element))
        const index = controls.indexOf(button.current)
        const nextIndex = index + (event.shiftKey ? -1 : 1)
        const target = controls[dialog ? (nextIndex + controls.length) % controls.length : nextIndex]
        if (target) { event.preventDefault(); target.focus() } else button.current.focus()
      }
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { keyboardOpening.current = true; setSearch(''); setOpen(true); setActive(event.key === 'ArrowDown' ? 0 : options.length - 1) }
      else setActive(index => filtered.length ? Math.max(0,Math.min(filtered.length - 1,index + (event.key === 'ArrowDown' ? 1 : -1))) : -1)
    }
    if (open && event.key === 'Home' && filtered.length) { event.preventDefault(); setActive(0) }
    if (open && event.key === 'End' && filtered.length) { event.preventDefault(); setActive(filtered.length - 1) }
    if (open && event.key === 'Enter' && activeOptionId) { event.preventDefault(); choose(filtered[active]) }
  }
  useEffect(() => { if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [active, id, open, search])
  return <div className={`cz-combobox ${className}`}>{label && <label htmlFor={id}>{label}{required ? ' *' : ''}</label>}<button ref={button} id={id} type="button" role={searchable ? undefined : 'combobox'} aria-expanded={open} aria-controls={open ? `${id}-options` : undefined} aria-label={label || placeholder} aria-labelledby={!label ? field?.labelId : undefined} aria-haspopup="listbox" aria-activedescendant={open && !searchable ? activeOptionId : undefined} aria-required={!searchable ? required || field?.required || undefined : undefined} aria-invalid={Boolean(error) || field?.invalid || undefined} aria-describedby={[field?.describedBy, error && `${id}-error`].filter(Boolean).join(' ') || undefined} disabled={disabled} className="cz-combobox-trigger" onKeyDown={keyboard} onClick={event => { keyboardOpening.current = event.detail === 0; setSearch(''); setOpen(!open); setActive(0) }}><span>{labels || placeholder}</span><Icon name="chevron" style={{ transform: 'rotate(90deg)' }}/></button>{labels && !disabled && <button type="button" className="cz-combobox-clear" aria-label={`Clear ${accessibleLabel}`} onClick={() => {onChange(multiple ? [] : null); setSearch(''); button.current?.focus()}}>×</button>}{error && <small id={`${id}-error`} role="alert">{error}</small>}{open && createPortal(<div ref={popup} data-side={position.bottom !== undefined ? 'top' : 'bottom'} data-input={keyboardOpening.current ? 'keyboard' : 'pointer'} className="cz-combobox-menu" style={position} onKeyDown={keyboard}>{searchable && <div className="cz-combobox-search"><input role="combobox" aria-label={`Search ${accessibleLabel}`} aria-required={required || field?.required || undefined} aria-invalid={Boolean(error) || field?.invalid || undefined} aria-describedby={[field?.describedBy, error && `${id}-error`].filter(Boolean).join(' ') || undefined} aria-expanded="true" aria-controls={`${id}-options`} aria-activedescendant={activeOptionId} aria-autocomplete="list" value={search} onChange={event => { setSearch(event.target.value); setActive(0) }} autoFocus/></div>}<div id={`${id}-options`} role="listbox" aria-multiselectable={multiple || undefined}>{filtered.map((option,index) => <button type="button" tabIndex={-1} role="option" aria-selected={selected(option)} id={`${id}-option-${index}`} key={`${key(option)}-${index}`} className="cz-combobox-option" data-active={active === index || undefined} onPointerDown={event => { if (event.pointerType === 'mouse') event.preventDefault() }} onClick={() => choose(option)} onPointerMove={() => setActive(index)}>{multiple && <span aria-hidden="true">{selected(option) ? '✓ ' : '○ '}</span>}{renderOption ? renderOption(option) : text(option)}</button>)}</div>{!filtered.length && <p className="cz-combobox-empty">No matches found</p>}{onCreateNew && search.trim() && !options.some(option => text(option).toLowerCase() === search.trim().toLowerCase()) && <button type="button" className="cz-combobox-option" onClick={() => { onCreateNew(search.trim()); setSearch(''); (popup.current?.querySelector('input') || button.current)?.focus({ preventScroll: true }) }}>Create “{search.trim()}”</button>}</div>,document.body)}</div>
}
