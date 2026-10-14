import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
export function SelectControl({ name = '', value, onChange, options = [], disabled, className = '', id, size, 'aria-label': label, ...props }) {
  return <select id={id} name={name} value={value ?? ''} onChange={onChange} disabled={disabled} aria-label={label || name.replaceAll('_',' ') || 'Select an option'} className={className} {...props}>{options.map((option,index) => <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select>
}
export default function Combobox({ options = [], value, onChange, placeholder = 'Select an option', label = '', disabled = false, required = false, error = '', searchable = false, multiple = false, className = '', renderOption, valueKey = 'id', labelKey = 'name', onCreateNew }) {
  const id = useId()
  const button = useRef(null)
  const popup = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({})
  const key = option => typeof option === 'object' ? option[valueKey] : option
  const text = option => String(typeof option === 'object' ? option[labelKey] : option)
  const filtered = options.filter(option => text(option).toLowerCase().includes(search.toLowerCase()))
  const selected = option => multiple ? (value || []).includes(key(option)) : String(value) === String(key(option))
  const labels = options.filter(selected).map(text).join(', ')
  const choose = option => {
    const item = key(option)
    onChange(multiple ? selected(option) ? value.filter(existing => existing !== item) : [...(value || []),item] : item)
    if (!multiple) { setOpen(false); setSearch(''); button.current?.focus() }
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
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus() }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0,Math.min(filtered.length - 1,index + (event.key === 'ArrowDown' ? 1 : -1)))) }
    if (open && event.key === 'Enter' && filtered[active]) { event.preventDefault(); choose(filtered[active]) }
    if (event.key === 'Tab') { setOpen(false); button.current?.focus() }
  }
  return <div className={`cz-combobox ${className}`}>{label && <label htmlFor={id}>{label}{required ? ' *' : ''}</label>}<button ref={button} id={id} type="button" role="combobox" aria-expanded={open} aria-controls={`${id}-options`} aria-label={label || placeholder} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-option-${active}` : undefined} disabled={disabled} className="cz-combobox-trigger" onKeyDown={keyboard} onClick={() => { setOpen(!open); setActive(0) }}><span>{labels || placeholder}</span><Icon name="chevron" style={{ transform: 'rotate(90deg)' }}/></button>{labels && !disabled && <button type="button" className="cz-combobox-clear" aria-label={`Clear ${label || placeholder}`} onClick={() => {onChange(multiple ? [] : null); setSearch(''); button.current?.focus()}}>×</button>}{error && <small role="alert">{error}</small>}{open && createPortal(<div ref={popup} className="cz-combobox-menu" style={position} onKeyDown={keyboard}>{searchable && <div className="cz-combobox-search"><input aria-label={`Search ${label || 'options'}`} value={search} onChange={event => { setSearch(event.target.value); setActive(0) }} autoFocus/></div>}<div id={`${id}-options`} role="listbox" aria-multiselectable={multiple || undefined}>{filtered.map((option,index) => <button type="button" tabIndex={-1} role="option" aria-selected={selected(option)} id={`${id}-option-${index}`} key={`${key(option)}-${index}`} className="cz-combobox-option" onClick={() => choose(option)} onPointerMove={() => setActive(index)}>{multiple && <span aria-hidden="true">{selected(option) ? '✓ ' : '○ '}</span>}{renderOption ? renderOption(option) : text(option)}</button>)}</div>{!filtered.length && <p className="cz-combobox-empty">No matches found</p>}{onCreateNew && search.trim() && !options.some(option => text(option).toLowerCase() === search.trim().toLowerCase()) && <button type="button" className="cz-combobox-option" onClick={() => { onCreateNew(search.trim()); setSearch('') }}>Create “{search.trim()}”</button>}</div>,document.body)}</div>
}
