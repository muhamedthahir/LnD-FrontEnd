import { useEffect, useState } from 'react'
import { Dialog } from './Dialog'
import { ActionButton, FieldGroup } from './Primitives'

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', errorMessage, disabled }) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  useEffect(() => { if (isOpen) setFailure('') }, [isOpen])
  const confirm = async () => {
    if (busy || disabled) return
    setBusy(true)
    try { await onConfirm() } catch (error) { setFailure(error.message || 'Unable to complete this action.') } finally { setBusy(false) }
  }
  return <Dialog open={isOpen} title={title} onClose={onClose} busy={busy} alert footer={<><ActionButton disabled={busy} onClick={onClose}>{cancelText}</ActionButton><ActionButton variant={/delete|expire|remove/i.test(confirmText) ? 'danger' : 'primary'} disabled={disabled} loading={busy} onClick={confirm}>{confirmText}</ActionButton></>}><div className="cz-confirm-message">{typeof message === 'string' ? <p style={{ whiteSpace: 'pre-line' }}>{message}</p> : message}</div>{(failure || errorMessage) && <p role="alert">{failure || errorMessage}</p>}</Dialog>
}
export function TextDialog({ isOpen, onClose, onConfirm, title, label, placeholder = '', initialValue = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'text' }) {
  const [value, setValue] = useState(initialValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (isOpen) { setValue(initialValue); setError('') } }, [isOpen, initialValue])
  const submit = async event => {
    event.preventDefault()
    if (!value.trim() || busy) return
    setBusy(true)
    try { await onConfirm(value.trim()); onClose() } catch (err) { setError(err.message || 'Unable to save this value.') } finally { setBusy(false) }
  }
  return <Dialog open={isOpen} title={title} onClose={onClose} busy={busy}><form onSubmit={submit}><FieldGroup><label>{label}</label><input type={type} value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} autoFocus disabled={busy}/></FieldGroup>{error && <p role="alert">{error}</p>}<div className="cz-dialog-actions"><ActionButton disabled={busy} onClick={onClose}>{cancelText}</ActionButton><ActionButton type="submit" variant="primary" disabled={!value.trim()} loading={busy}>{confirmText}</ActionButton></div></form></Dialog>
}
export function TwoFieldDialog({ isOpen, onClose, onConfirm, title, label1, label2, placeholder1 = '', placeholder2 = '', initialValue1 = '', initialValue2 = '', confirmText = 'Confirm', cancelText = 'Cancel', type1 = 'text', type2 = 'text' }) {
  const [values, setValues] = useState([initialValue1, initialValue2])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (isOpen) { setValues([initialValue1, initialValue2]); setError('') } }, [isOpen, initialValue1, initialValue2])
  const submit = async event => {
    event.preventDefault()
    if (busy || values.some(value => !value.trim())) return
    setBusy(true)
    try { await onConfirm(...values.map(value => value.trim())); onClose() } catch (err) { setError(err.message || 'Unable to save these values.') } finally { setBusy(false) }
  }
  return <Dialog open={isOpen} title={title} onClose={onClose} busy={busy}><form onSubmit={submit}>{[0,1].map(index => <FieldGroup key={index}><label>{index === 0 ? label1 : label2}</label><input type={index === 0 ? type1 : type2} value={values[index]} placeholder={index === 0 ? placeholder1 : placeholder2} autoFocus={index === 0} disabled={busy} onChange={event => setValues(previous => previous.map((value, number) => index === number ? event.target.value : value))}/></FieldGroup>)}{error && <p role="alert">{error}</p>}<div className="cz-dialog-actions"><ActionButton disabled={busy} onClick={onClose}>{cancelText}</ActionButton><ActionButton type="submit" variant="primary" loading={busy} disabled={values.some(value => !value.trim())}>{confirmText}</ActionButton></div></form></Dialog>
}
