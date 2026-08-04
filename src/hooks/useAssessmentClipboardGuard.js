import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

const BLOCKED_TOAST = 'Copy/Paste is disabled for this assessment'

const clearClipboard = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText('')
    }
  } catch {
    // Clipboard API may be denied; key/paste handlers still apply.
  }
}

/**
 * Blocks clipboard usage during proctored assessments (Ctrl/Cmd shortcuts,
 * context menu, drag-drop paste, and clipboard API on tab return).
 */
export function useAssessmentClipboardGuard(enabled) {
  const toastAtRef = useRef(0)

  const warnBlocked = () => {
    const now = Date.now()
    if (now - toastAtRef.current < 1200) return
    toastAtRef.current = now
    toast.warning(BLOCKED_TOAST)
  }

  useEffect(() => {
    if (!enabled) return

    const prevent = (event) => {
      event.preventDefault()
      event.stopPropagation()
      warnBlocked()
      return false
    }

    const blockKeyboardShortcuts = (event) => {
      const key = event.key?.toLowerCase()
      const mod = event.ctrlKey || event.metaKey

      if (mod && (key === 'c' || key === 'v' || key === 'x')) {
        prevent(event)
        return
      }

      if (mod && key === 'insert') {
        prevent(event)
        return
      }

      if (event.shiftKey && key === 'insert') {
        prevent(event)
      }
    }

    const blockBeforeInput = (event) => {
      const type = event.inputType || ''
      if (type === 'insertFromPaste' || type === 'insertFromDrop' || type === 'insertFromYank') {
        prevent(event)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearClipboard()
      }
    }

    const handleWindowFocus = () => {
      clearClipboard()
    }

    clearClipboard()

    window.addEventListener('keydown', blockKeyboardShortcuts, true)
    window.addEventListener('keyup', blockKeyboardShortcuts, true)
    document.addEventListener('copy', prevent, true)
    document.addEventListener('cut', prevent, true)
    document.addEventListener('paste', prevent, true)
    document.addEventListener('contextmenu', prevent, true)
    document.addEventListener('dragstart', prevent, true)
    document.addEventListener('drop', prevent, true)
    document.addEventListener('beforeinput', blockBeforeInput, true)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('keydown', blockKeyboardShortcuts, true)
      window.removeEventListener('keyup', blockKeyboardShortcuts, true)
      document.removeEventListener('copy', prevent, true)
      document.removeEventListener('cut', prevent, true)
      document.removeEventListener('paste', prevent, true)
      document.removeEventListener('contextmenu', prevent, true)
      document.removeEventListener('dragstart', prevent, true)
      document.removeEventListener('drop', prevent, true)
      document.removeEventListener('beforeinput', blockBeforeInput, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [enabled])
}

export function configureMonacoClipboardBlock(editor, monaco, onBlocked = () => toast.warning(BLOCKED_TOAST)) {
  if (!editor || !monaco) return

  const noop = () => {
    onBlocked()
    return null
  }

  const KeyMod = monaco.KeyMod
  const KeyCode = monaco.KeyCode

  editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyC, noop)
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyX, noop)
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyV, noop)
  editor.addCommand(KeyMod.CtrlCmd | KeyCode.Insert, noop)
  editor.addCommand(KeyMod.Shift | KeyCode.Insert, noop)

  editor.onContextMenu(() => {
    onBlocked()
  })
}
