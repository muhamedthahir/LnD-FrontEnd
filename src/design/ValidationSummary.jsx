export function focusFirstInvalidField(form) {
  const scope = form?.matches('form') ? form : form?.closest('form')
  scope?.querySelector('[aria-invalid="true"]')?.focus()
}

export default function ValidationSummary({ errors }) {
  const messages = Object.values(errors || {}).filter(message => typeof message === 'string' && message)
  if (!messages.length) return null
  return <div className="cz-validation-summary" role="alert"><strong>Please check {messages.length === 1 ? 'this field' : 'these fields'}.</strong><ul>{messages.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}</ul></div>
}
