import { Children, cloneElement, createContext, forwardRef, isValidElement, useContext, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ActionButton } from './Primitives'

const DialogContext = createContext(null)
const layers = []
let savedOverflow = ''
const focusables = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
export function DialogLayer({ children, className = '', onClick, onClose, busy = false, dismissible = true, ...props }) {
  const id = useId()
  const layer = useRef(null)
  const zIndex = useRef(1000 + layers.length * 10)
  const close = useRef(onClose || onClick)
  const state = useRef({ busy, dismissible })
  close.current = onClose || onClick
  state.current = { busy, dismissible }
  useEffect(() => {
    const before = document.activeElement
    if (!layers.length) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
    layers.push(id)
    const root = layer.current
    const surface = root.querySelector('[role="dialog"],[role="alertdialog"]') || root
    const heading = surface.querySelector('h1,h2,h3')
    if (!surface.hasAttribute('aria-label') && heading) {
      if (!heading.id) heading.id = `${id}-heading`
      surface.setAttribute('aria-labelledby', heading.id)
    }
    const hidden = []
    for (const sibling of document.body.children) {
      if (sibling.contains(root) || sibling.matches('script,style')) continue
      hidden.push([sibling, sibling.inert])
      sibling.inert = true
    }
    const first = surface.querySelector('[autofocus]') || surface.querySelector(focusables) || surface
    first.focus()
    const keydown = event => {
      if (layers.at(-1) !== id) return
      if (event.key === 'Tab' && event.target.closest?.('.cz-combobox-menu')) return
      // An open select owns Escape until its popup has closed.
      if (event.key === 'Escape' && (event.target.closest?.('.cz-combobox-menu') || surface.querySelector('[role="combobox"][aria-expanded="true"]'))) return
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation()
        if (state.current.dismissible && !state.current.busy) close.current?.(event)
      }
      if (event.key === 'Tab') {
        const items = [...surface.querySelectorAll(focusables)].filter(element => element.getClientRects().length && element.getAttribute('aria-hidden') !== 'true')
        if (!items.length) { event.preventDefault(); surface.focus(); return }
        const firstItem = items[0], lastItem = items.at(-1)
        if (event.shiftKey && (document.activeElement === firstItem || !surface.contains(document.activeElement))) { event.preventDefault(); lastItem.focus() }
        if (!event.shiftKey && (document.activeElement === lastItem || !surface.contains(document.activeElement))) { event.preventDefault(); firstItem.focus() }
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      const index = layers.indexOf(id)
      if (index >= 0) layers.splice(index, 1)
      for (const [sibling, inert] of hidden) if (sibling.isConnected) sibling.inert = inert
      if (!layers.length) document.body.style.overflow = savedOverflow
      if (before?.isConnected) before.focus()
    }
  }, [id])
  return createPortal(<DialogContext.Provider value={id}><div ref={layer} className={`cz-dialog-layer ${className}`} style={{ zIndex: zIndex.current }} onClick={event => { if (event.target === event.currentTarget && !busy && dismissible) close.current?.(event) }} {...props}>{children}</div></DialogContext.Provider>, document.body)
}
export const DialogSurface = forwardRef(function DialogSurface({ children, className = '', role = 'dialog', ...props }, ref) {
  const id = useContext(DialogContext)
  return <section ref={ref} role={role} aria-modal="true" tabIndex={-1} data-dialog={id} className={`cz-dialog ${className}`} onClick={event => event.stopPropagation()} {...props}>{structureDialog(children)}</section>
})
function part(element) {
  if (!isValidElement(element)) return 'body'
  const classes = element.props.className || ''
  if (element.type === 'header' || /(?:^|[\s-])(?:\w*ModalHeader|modalHeader|modal-header|header|heading)(?:\s|$)/.test(classes) || ['h2','h3'].includes(element.type)) return 'heading'
  if (element.type === 'footer' || /(?:^|[\s-])(?:\w*ModalFooter|modalFooter|modal-footer|modalActions|formActions|modal-actions|form-actions|footer|actions)(?:\s|$)/.test(classes)) return 'actions'
  return 'body'
}
function styled(element, section) {
  return cloneElement(element, { className: `${element.props.className || ''} cz-dialog-${section}`.trim() })
}
function structureDialog(children) {
  const items = Children.toArray(children)
  // The new Dialog API already provides a complete layout.
  if (items.some(item => isValidElement(item) && /cz-dialog-body/.test(item.props.className || ''))) return children
  const heading = items.filter(item => part(item) === 'heading')
  const actions = items.filter(item => part(item) === 'actions')
  const body = items.filter(item => part(item) === 'body')
  const forms = body.filter(item => isValidElement(item) && item.type === 'form')
  const content = forms.length === 1 ? (() => {
    const form = forms[0], fields = body.flatMap(item => item === form ? Children.toArray(form.props.children) : [item])
    const footer = []
    function separate(item) {
      if (!isValidElement(item)) return item
      if (part(item) === 'actions') { footer.push(item); return null }
      if (typeof item.type === 'string' && item.props.children) return cloneElement(item, {}, Children.toArray(item.props.children).map(separate))
      return item
    }
    const fieldsOnly = fields.map(separate)
    return cloneElement(form, { className: `${form.props.className || ''} cz-dialog-form` }, <><div className="cz-dialog-body">{fieldsOnly}</div>{footer.map(item => styled(item, 'actions'))}</>)
  })() : <div className="cz-dialog-body">{body}</div>
  return <>{heading.map(item => styled(item, 'heading'))}{content}{actions.map(item => styled(item, 'actions'))}</>
}
export function Dialog({ open = true, title, description, children, footer, onClose, busy, size = 'medium', dismissible = true, alert = false }) {
  const titleId = useId()
  if (!open) return null
  return <DialogLayer onClose={onClose} busy={busy} dismissible={dismissible}><DialogSurface role={alert ? 'alertdialog' : 'dialog'} aria-labelledby={titleId} data-size={size}>
    <header className="cz-dialog-heading"><div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>{onClose && <ActionButton aria-label={`Close ${title}`} variant="quiet" disabled={busy} onClick={onClose}>×</ActionButton>}</header>
    <div className="cz-dialog-body">{children}</div>{footer && <footer className="cz-dialog-actions">{footer}</footer>}
  </DialogSurface></DialogLayer>
}
