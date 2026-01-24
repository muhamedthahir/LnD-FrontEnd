import React from 'react'
import styles from './Pagination.module.css'

const Pagination = ({
  currentPage,
  pageSize,
  totalCount,
  itemName = 'items', // e.g., 'users', 'groups', 'items'
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 500, 1000]
}) => {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = totalCount > 0 ? ((currentPage - 1) * pageSize + 1) : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  const getPageNumbers = () => {
    const pageNumbers = []
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)
    
    // Adjust if we're near the start
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages)
    }
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    return pageNumbers
  }

  const handlePageSizeChange = (e) => {
    const newPageSize = Number(e.target.value)
    onPageSizeChange(newPageSize)
    // Reset to page 1 when page size changes
    onPageChange(1)
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span>
          Showing {startItem} to {endItem} of {totalCount} {itemName}
        </span>
        <div className={styles.pageSizeSelector}>
          <label>Per page:</label>
          <select 
            value={pageSize} 
            onChange={handlePageSizeChange}
            className={styles.pageSizeSelect}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        {getPageNumbers().map(pageNum => (
          <button
            key={pageNum}
            className={`${styles.btn} ${currentPage === pageNum ? styles.active : ''}`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        
        <button
          className={styles.btn}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination

