import { useState, useCallback, useRef } from 'react'
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

  const confirm = useCallback((options) => {
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

  const ConfirmDialog = useCallback(() => (
    <ConfirmModal
      isOpen={!!config}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={config?.title || ''}
      message={config?.message ?? ''}
      confirmText={config?.confirmText}
      cancelText={config?.cancelText}
      disabled={config?.disabled}
    />
  ), [config, handleClose, handleConfirm])

  return { confirm, ConfirmDialog }
}
