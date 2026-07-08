import styles from './Table.module.css'

function Table({ children, className = '', variant = 'standalone', ...props }) {
  const tableClassName = [
    styles.table,
    variant === 'embedded' && styles.embedded,
    className
  ].filter(Boolean).join(' ')

  return (
    <table className={tableClassName} {...props}>
      {children}
    </table>
  )
}

export default Table

