import styles from './Button.module.css'

function Button({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) {
  const buttonClasses = `${styles.button} ${styles[variant]} ${className}`.trim()
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button


