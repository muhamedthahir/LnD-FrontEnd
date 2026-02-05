import styles from './ConfirmModal.module.css'

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', errorMessage = null, disabled = false }) {
  if (!isOpen) return null

  const renderedMessage = typeof message === 'string' ? <p>{message}</p> : message

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>
        <div className={styles.body}>
          {renderedMessage}
          {errorMessage && (
            <div className={styles.error}>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`${styles.btnConfirm} ${disabled ? styles.disabled : ''}`} 
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

