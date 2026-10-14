import { ActionButton } from './Primitives'
import Icon from './Icon'
export default function Pagination({ currentPage, pageSize, totalCount, itemName = 'items', onPageChange, onPageSizeChange, pageSizeOptions = [10,20,50,100,500,1000] }) {
  if (!totalCount) return null
  const pages = Math.ceil(totalCount / pageSize)
  const first = (currentPage - 1) * pageSize + 1
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(currentPage - 2, pages - 4)) + index)
  return <nav className="cz-pagination" aria-label={`${itemName} pagination`}><div><span>{first}–{Math.min(currentPage * pageSize,totalCount)} of {totalCount} {itemName}</span>{onPageSizeChange && <label>Rows<select aria-label="Rows per page" value={pageSize} onChange={event => { onPageSizeChange(Number(event.target.value)); onPageChange(1) }}>{pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}</select></label>}</div><div><ActionButton aria-label="First page" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>«</ActionButton><ActionButton aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>‹</ActionButton>{numbers.map(page => <ActionButton key={page} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} variant={page === currentPage ? 'primary' : 'quiet'} onClick={() => onPageChange(page)}>{page}</ActionButton>)}<ActionButton aria-label="Next page" disabled={currentPage >= pages} onClick={() => onPageChange(currentPage + 1)}>›</ActionButton><ActionButton aria-label="Last page" disabled={currentPage >= pages} onClick={() => onPageChange(pages)}>»</ActionButton></div></nav>
}
