import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

const BLOCKED_TOAST = 'Copy/Paste is disabled for this assessment'

/**
 * Blocks clipboard usage during proctored assessments (Ctrl/Cmd shortcuts,
 * clipboard events and paste/drop input). Ordinary pointer gestures remain usable.
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

    window.addEventListener('keydown', blockKeyboardShortcuts, true)
    document.addEventListener('copy', prevent, true)
    document.addEventListener('cut', prevent, true)
    document.addEventListener('paste', prevent, true)
    document.addEventListener('beforeinput', blockBeforeInput, true)

    return () => {
      window.removeEventListener('keydown', blockKeyboardShortcuts, true)
      document.removeEventListener('copy', prevent, true)
      document.removeEventListener('cut', prevent, true)
      document.removeEventListener('paste', prevent, true)
      document.removeEventListener('beforeinput', blockBeforeInput, true)
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


}
