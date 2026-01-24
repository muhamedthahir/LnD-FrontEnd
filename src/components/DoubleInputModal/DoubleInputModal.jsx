import { useState, useEffect } from 'react'
import styles from './DoubleInputModal.module.css'

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>
        <div className={styles.body}>
          <div className={styles.inputGroup}>
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
          <div className={styles.inputGroup}>
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
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={!value1.trim() || !value2.trim()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoubleInputModal

