import { useState, useEffect } from 'react'
import './DoubleInputModal.css'

function DoubleInputModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  label1,
  label2,
  placeholder1 = '', 
  placeholder2 = '',
  initialValue1 = '',
  initialValue2 = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type1 = 'text',
  type2 = 'text'
}) {
  const [value1, setValue1] = useState(initialValue1)
  const [value2, setValue2] = useState(initialValue2)

  useEffect(() => {
    if (isOpen) {
      setValue1(initialValue1)
      setValue2(initialValue2)
    }
  }, [isOpen, initialValue1, initialValue2])

  const handleConfirm = () => {
    if (value1.trim() && value2.trim()) {
      onConfirm(value1.trim(), value2.trim())
      setValue1('')
      setValue2('')
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
    <div className="double-input-modal-overlay" onClick={onClose}>
      <div className="double-input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="double-input-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="double-input-modal-body">
          <div className="input-group">
            <label>{label1}</label>
            <input
              type={type1}
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder1}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>{label2}</label>
            <input
              type={type2}
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder2}
            />
          </div>
        </div>
        <div className="double-input-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={!value1.trim() || !value2.trim()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoubleInputModal

