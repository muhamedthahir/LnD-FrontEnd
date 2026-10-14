export default function Switch({ checked = false, onChange, label = '', disabled = false, className = '' }) {
  return <label className={`cz-switch ${className}`}><input type="checkbox" role="switch" checked={checked} onChange={event => onChange?.(event.target.checked)} disabled={disabled} aria-label={label || 'Toggle option'}/><span className="cz-switch-track"/>{label && <span>{label}</span>}</label>
}
