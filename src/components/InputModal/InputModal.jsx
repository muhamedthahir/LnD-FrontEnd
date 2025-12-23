import { useState, useEffect } from 'react'
import './InputModal.css'

function InputModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  label, 
  placeholder = '', 
  initialValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'text'
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
    }
  }, [isOpen, initialValue])

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim())
      setValue('')
      onClose()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="input-modal-overlay" onClick={onClose}>
      <div className="input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="input-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="input-modal-body">
          <label>{label}</label>
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <div className="input-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={!value.trim()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InputModal

