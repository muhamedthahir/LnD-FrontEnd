import styles from './Table.module.css'

function Table({ children, className = '', ...props }) {
  const tableClassName = className ? `${styles.table} ${className}` : styles.table

  return (
    <table className={tableClassName} {...props}>
      {children}
    </table>
  )
}

export default Table

