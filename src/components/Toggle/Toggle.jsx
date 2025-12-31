import './Toggle.css'

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
    <label className={`toggle-container toggle-${size} ${disabled ? 'disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="toggle-input"
      />
      <span className="toggle-slider"></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}

export default Toggle

