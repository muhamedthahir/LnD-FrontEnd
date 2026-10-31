import { Children, cloneElement, forwardRef, isValidElement, useId } from 'react'
import { pageTitles } from './pageTitles'
import { FieldContext } from './FieldContext'

const join = (...values) => values.filter(Boolean).join(' ')
export const ActionButton = forwardRef(function ActionButton({ variant = 'secondary', className = '', loading = false, children, disabled, type = 'button', ...props }, ref) {
  const tone = variant
  const hasText = Children.toArray(children).some(child => typeof child === 'string' && /[a-z0-9]/i.test(child))
  const iconLabel = /back/i.test(className) ? 'Back' : /close/i.test(className) ? 'Close' : /delete/i.test(className) ? 'Delete' : undefined
  return <button ref={ref} type={type} className={join('cz-button', `cz-button--${tone}`, className)} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={props['aria-label'] || (!hasText && (props.title || iconLabel)) || undefined} {...props}>{loading && <span className="cz-button-spinner" />}{children}</button>
})
export function Panel({ as: Element = 'section', className, children, ...props }) {
  return <Element className={join('cz-panel', className)} {...props}>{children}</Element>
}
export const PageContent = forwardRef(function PageContent({ className, children, view, title = pageTitles[view], backAction, ...props }, ref) {
  return <div ref={ref} className={join('cz-page', className)} data-view={view} {...props}>{title && <header className="cz-page-heading"><h1>{title}</h1>{backAction && <div className="cz-page-back">{backAction}</div>}</header>}{children}</div>
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
  const label = items.find(item => isValidElement(item) && item.type === 'label')
  const help = items.find(item => isValidElement(item) && ['small', 'p'].includes(item.type) && !item.props.role)
  const error = items.find(item => isValidElement(item) && (item.props.role === 'alert' || /error[-_ ]?(text|message)|(?:^|-)fieldError/i.test(item.props.className || '')))
  const helpId = help?.props.id || `${fieldId}-help`
  const errorId = error?.props.id || `${fieldId}-error`
  const describedBy = [field?.props['aria-describedby'], help && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  const labelId = label?.props.id || `${fieldId}-label`
  const labelText = element => typeof element === 'string' ? element : isValidElement(element) ? Children.toArray(element.props.children).map(labelText).join('') : ''
  const required = field?.props.required || labelText(label).includes('*')
  return <FieldContext.Provider value={{ controlId: fieldId, labelText: labelText(label).replaceAll('*', '').trim(), labelId: label ? labelId : undefined, describedBy, invalid: Boolean(error), required }}><div className={join('cz-field', className)} {...props}>{items.map(item => {
    if (!isValidElement(item)) return item
    if (item === label) return cloneElement(item, { id: labelId, htmlFor: item.props.htmlFor || fieldId })
    if (item === field) return cloneElement(item, {
      id: fieldId,
      'data-autofocus': field.props.autoFocus || undefined,
      'aria-describedby': describedBy,
      'aria-invalid': field.props['aria-invalid'] ?? Boolean(error),
      'aria-required': field.props['aria-required'] ?? (required || undefined)
    })
    if (item === help) return cloneElement(item, { id: helpId })
    if (item === error) return cloneElement(item, { id: errorId })
    return item
  })}</div></FieldContext.Provider>
}
export function DataTable({ className, children, variant, stickyActions = false, ...props }) {
  return <div className="cz-table-scroll" role="region" aria-label={props['aria-label'] || 'Data table'} tabIndex={0}><table data-sticky-actions={stickyActions || undefined} className={join('cz-table', className)} {...props}>{children}</table></div>
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
