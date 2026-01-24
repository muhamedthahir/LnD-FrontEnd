import styles from './Toggle.module.css'

function Toggle({
  checked = false,
  onChange,
  label = '',
  disabled = false,
  size = 'medium', // small, medium, large
  className = ''
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked)
    }
  }

  return (
    <label className={`${styles.container} ${styles[size]} ${disabled ? styles.disabled : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.slider}></span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}

export default Toggle




