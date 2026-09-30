import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { authenticatedFetch } from '../../../utils/api'
import { validateBulkReset } from './bulkResetValidation'
import styles from './BulkResetModal.module.css'

const PAGE_SIZE = 50

export default function BulkResetModal({ apiBaseUrl, accessToken, onClose, onSuccess, request = authenticatedFetch }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const [groups, setGroups] = useState([])
  const [total, setTotal] = useState(0)
  const [group, setGroup] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const dialogRef = useRef(null)
  const busyRef = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const before = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('input')?.focus()
    const handleKeys = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!busyRef.current) closeRef.current()
      }
      if (event.key === 'Tab') {
        const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')]
        const first = items[0]
        const last = items[items.length - 1]
        if (!first) { event.preventDefault(); dialogRef.current.focus(); return }
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault(); last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault(); first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeys)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handleKeys)
      before?.focus()
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { setFilter(search.trim()); setOffset(0) }, 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!apiBaseUrl) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    setGroup(null)
    const params = new URLSearchParams({ search: filter, limit: String(PAGE_SIZE), offset: String(offset) })
    request(`/api/admin/users/bulk-reset/groups?${params}`, { signal: controller.signal }, apiBaseUrl, accessToken)
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load groups.')
        if (!controller.signal.aborted) { setGroups(data.groups || []); setTotal(data.total || 0) }
      })
      .catch(err => { if (!controller.signal.aborted) setLoadError(err.message || 'Unable to load groups.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [apiBaseUrl, accessToken, filter, offset, retry, request])

  const submit = async event => {
    event.preventDefault()
    if (busyRef.current || loading || loadError) return
    const validation = validateBulkReset({ group, password, confirmation })
    setError(validation)
    if (validation) return
    busyRef.current = true
    setBusy(true)
    try {
      const response = await request('/api/admin/users/bulk-reset-password', {
        method: 'POST', body: JSON.stringify({ groupId: group.id, password })
      }, apiBaseUrl, accessToken)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to reset passwords.')
      setPassword('')
      setConfirmation('')
      onSuccess(data)
    } catch (err) {
      setError(err.message || 'The request could not be completed. Check the connection before trying again.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  return createPortal(
    <div className={styles.overlay} onClick={() => { if (!busyRef.current) onClose() }}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="bulk-reset-title" tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className={styles.header}>
          <h2 id="bulk-reset-title">Bulk reset passwords</h2>
          <button type="button" aria-label="Close bulk password reset" onClick={onClose} disabled={busy}>×</button>
        </header>
        <form onSubmit={submit} className={styles.form}>
          <p>Choose a group and set one new password for all its users. No email will be sent.</p>
          <label htmlFor="bulk-group-search">Find a group</label>
          <input id="bulk-group-search" type="search" value={search} disabled={busy} placeholder="Search group or institution" onChange={event => { setSearch(event.target.value); setGroup(null) }} />
          <label htmlFor="bulk-group">Group</label>
          <select id="bulk-group" required value={group?.id || ''} disabled={busy || loading || !!loadError} onChange={event => { setGroup(groups.find(item => String(item.id) === event.target.value) || null); setError('') }}>
            <option value="">{loading ? 'Loading groups…' : 'Select a group'}</option>
            {groups.map(item => <option key={item.id} value={item.id}>{item.name} — {item.college_name} ({item.member_count} users)</option>)}
          </select>
          {loadError ? <div role="alert" className={styles.error}>{loadError} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : !loading && !groups.length ? <p role="status">No groups found.</p> : null}
          {total > PAGE_SIZE && <div className={styles.pagination}>
            <button type="button" disabled={busy || loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}>Previous groups</button>
            <span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <button type="button" disabled={busy || loading || offset + PAGE_SIZE >= total} onClick={() => setOffset(value => value + PAGE_SIZE)}>Next groups</button>
          </div>}
          {group && <p className={styles.summary} role="status"><strong>{group.name}</strong>: all {group.member_count} users will receive this password. Users outside this group are unchanged.</p>}
          <label htmlFor="bulk-password">New password</label>
          <input id="bulk-password" type="password" autoComplete="new-password" required minLength={6} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} aria-describedby="bulk-password-help" />
          <small id="bulk-password-help">At least 6 characters. Users can sign in with this password after the reset.</small>
          <label htmlFor="bulk-password-confirm">Confirm new password</label>
          <input id="bulk-password-confirm" type="password" autoComplete="new-password" required value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <footer className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy || loading || !group || Number(group.member_count) === 0 || !!loadError}>{busy ? 'Resetting…' : `Reset ${group ? `${group.member_count} users’ ` : ''}passwords`}</button>
          </footer>
        </form>
      </section>
    </div>, document.body
  )
}
