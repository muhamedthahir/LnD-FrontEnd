import { Children, cloneElement, forwardRef, isValidElement, useId } from 'react'

const join = (...values) => values.filter(Boolean).join(' ')
export const ActionButton = forwardRef(function ActionButton({ variant, className = '', loading = false, children, disabled, type = 'button', ...props }, ref) {
  const tone = variant || (/danger|delete|logout|expire/i.test(className) ? 'danger' : /primary|confirm|submit|save|start|publish/i.test(className) ? 'primary' : 'secondary')
  const hasText = Children.toArray(children).some(child => typeof child === 'string' && /[a-z0-9]/i.test(child))
  const iconLabel = /back/i.test(className) ? 'Back' : /close/i.test(className) ? 'Close' : /delete/i.test(className) ? 'Delete' : undefined
  return <button ref={ref} type={type} className={join('cz-button', `cz-button--${tone}`, className)} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={props['aria-label'] || (!hasText && (props.title || iconLabel)) || undefined} {...props}>{loading && <span className="cz-button-spinner" />}{children}</button>
})
export function Panel({ as: Element = 'section', className, children, ...props }) {
  return <Element className={join('cz-panel', className)} {...props}>{children}</Element>
}
export const PageContent = forwardRef(function PageContent({ className, children, view, ...props }, ref) {
  return <div ref={ref} className={join('cz-page', className)} data-view={view} {...props}>{children}</div>
})
export function Toolbar({ className, children, ...props }) {
  return <div className={join('cz-toolbar', className)} {...props}>{children}</div>
}
export function FieldRow({ className, children, ...props }) {
  return <div className={join('cz-field-row', className)} {...props}>{children}</div>
}
export function FieldGroup({ className, children, ...props }) {
  const id = useId()
  const items = Children.toArray(children)
  const field = items.find(item => isValidElement(item) && (['input', 'select', 'textarea'].includes(item.type)))
  const fieldId = field?.props.id || id
  return <div className={join('cz-field', className)} {...props}>{items.map(item => {
    if (!isValidElement(item)) return item
    if (item.type === 'label' && field) return cloneElement(item, { htmlFor: item.props.htmlFor || fieldId })
    if (item === field) return cloneElement(item, { id: fieldId })
    return item
  })}</div>
}
export function DataTable({ className, children, variant, ...props }) {
  return <div className="cz-table-scroll" role="region" aria-label={props['aria-label'] || 'Data table'} tabIndex={0}><table className={join('cz-table', className)} {...props}>{children}</table></div>
}
export function EmptyState({ className, children, ...props }) {
  return <div className={join('cz-empty', className)} {...props}><span className="cz-empty-mark" aria-hidden="true">○</span>{children}</div>
}
export function LoadingState({ className, children, ...props }) {
  return <div className={join('cz-loading', className)} role="status" aria-label="Loading" {...props}><span className="cz-spinner" />{children}</div>
}
export function Metric({ label, value, note, tone }) {
  return <div className="cz-metric" data-tone={tone}><span className="cz-metric-label">{label}</span><strong>{value}</strong>{note && <span className="cz-metric-note">{note}</span>}</div>
}
