export default function Switch({ checked = false, onChange, label = '', disabled = false, className = '' }) {
  const isChecked = !!checked
  return <label className={`cz-switch ${className}`}><input type="checkbox" role="switch" checked={isChecked} aria-checked={isChecked} value={isChecked ? 'true' : 'false'} onChange={event => onChange?.(event.target.checked)} disabled={disabled} aria-label={label || 'Toggle option'}/><span className="cz-switch-track" aria-hidden="true"/>{label && <span>{label}</span>}</label>
}
