import { useState, useCallback, useEffect, useRef } from 'react'
import ConfirmModal from '../components/ConfirmModal/ConfirmModal'

/**
 * Promise-based confirmation dialog. Use instead of window.confirm().
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirmModal()
 * const ok = await confirm({ title: 'Delete?', message: 'This cannot be undone.', confirmText: 'Delete' })
 * if (!ok) return
 */
export function useConfirmModal() {
  const resolverRef = useRef(null)
  const [config, setConfig] = useState(null)
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => () => {
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  const confirm = useCallback((options) => {
    // A new request cancels the previous pending request instead of orphaning it.
    resolverRef.current?.(false)
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setConfig({
        title: options.title || 'Confirm',
        message: options.message ?? 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        disabled: false
      })
    })
  }, [])

  const handleClose = useCallback(() => {
    setConfig(null)
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  const handleConfirm = useCallback(() => {
    const resolve = resolverRef.current
    setConfig(null)
    resolverRef.current = null
    resolve?.(true)
  }, [])

  const ConfirmDialog = useCallback(() => {
    const current = configRef.current
    return (
    <ConfirmModal
      isOpen={!!current}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={current?.title || ''}
      message={current?.message ?? ''}
      confirmText={current?.confirmText}
      cancelText={current?.cancelText}
      disabled={current?.disabled}
    />
  )}, [handleClose, handleConfirm])

  return { confirm, ConfirmDialog }
}
