import { Children, cloneElement, createContext, forwardRef, isValidElement, useContext, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ActionButton } from './Primitives'
import usePresence from './usePresence'

const DialogContext = createContext(null)
const layers = []
let savedOverflow = ''
let nextLayerZ = 1000
const originalInert = new Map()
const activeRoots = new Map()
const restoreTargets = new Map()
function syncDialogInert() {
  const top = activeRoots.get(layers.at(-1))
  for (const sibling of document.body.children) {
    if (sibling.matches('script,style')) continue
    if (!originalInert.has(sibling)) originalInert.set(sibling, sibling.inert)
    sibling.inert = top ? !sibling.contains(top) || top.dataset?.state === 'closed' : originalInert.get(sibling)
  }
  if (!top) { for (const [element, inert] of originalInert) element.inert = element.dataset?.state === 'closed' || inert; originalInert.clear() }
}
const focusables = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
export function DialogLayer({ children, className = '', onClick, onClose, busy = false, dismissible = true, open = true, exitDuration = 150, ...props }) {
  const present = usePresence(open, exitDuration)
  const content = useRef(children)
  if (open) content.current = children
  const id = useId()
  const layer = useRef(null)
  const returnFocus = useRef(document.activeElement)
  const wasOpen = useRef(false)
  if (open && !wasOpen.current) returnFocus.current = document.activeElement
  wasOpen.current = open
  const zIndex = useRef(1000)
  const close = useRef(onClose || onClick)
  const state = useRef({ busy, dismissible })
  close.current = onClose || onClick
  state.current = { busy, dismissible: dismissible && open }
  useEffect(() => {
    if (!open) return
    restoreTargets.set(id, returnFocus.current)
    if (!layers.length) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; nextLayerZ = 1000 }
    layers.push(id)
    const root = layer.current
    zIndex.current = nextLayerZ
    nextLayerZ += 10
    root.style.zIndex = String(zIndex.current)
    const surface = root.querySelector('[role="dialog"],[role="alertdialog"]') || root
    const heading = surface.querySelector('h1,h2,h3')
    if (!surface.hasAttribute('aria-label') && heading) {
      if (!heading.id) heading.id = `${id}-heading`
      surface.setAttribute('aria-labelledby', heading.id)
    }
    activeRoots.set(id, root)
    syncDialogInert()
    const visible = element => element.getClientRects().length && !element.closest('[inert]') && element.getAttribute('aria-hidden') !== 'true'
    const first = surface.contains(document.activeElement) && visible(document.activeElement) ? document.activeElement : [...surface.querySelectorAll('[autofocus],[data-autofocus=true]')].find(visible) || [...surface.querySelectorAll(focusables)].find(visible) || surface
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
        const items = [...surface.querySelectorAll(focusables)].filter(visible)
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
      activeRoots.delete(id)
      const before = restoreTargets.get(id)
      for (const [otherId, target] of restoreTargets) {
        if (otherId !== id && root.contains(target)) restoreTargets.set(otherId, before)
      }
      restoreTargets.delete(id)
      syncDialogInert()
      if (!layers.length) document.body.style.overflow = savedOverflow
      const nextRoot = activeRoots.get(layers.at(-1))
      if (before?.isConnected && (!layers.length || nextRoot?.contains(before))) before.focus()
    }
  }, [id, open])
  if (!present) return null
  return createPortal(<DialogContext.Provider value={id}><div ref={layer} data-state={open ? 'open' : 'closed'} inert={open ? undefined : ''} className={`cz-dialog-layer ${className}`} style={{ zIndex: zIndex.current }} onClick={event => { if (event.target === event.currentTarget && !busy && dismissible && open) close.current?.(event) }} {...props}>{content.current}</div></DialogContext.Provider>, document.body)
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
export function Dialog({ open = true, id, title, description, children, footer, onClose, busy, size = 'medium', dismissible = true, alert = false }) {
  const titleId = useId()
  return <DialogLayer open={open} onClose={onClose} busy={busy} dismissible={dismissible}><DialogSurface id={id} role={alert ? 'alertdialog' : 'dialog'} aria-labelledby={titleId} data-size={size}>
    <header className="cz-dialog-heading"><div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>{onClose && <ActionButton aria-label={`Close ${title}`} variant="quiet" disabled={busy} onClick={onClose}>×</ActionButton>}</header>
    <div className="cz-dialog-body">{children}</div>{footer && <footer className="cz-dialog-actions">{footer}</footer>}
  </DialogSurface></DialogLayer>
}
