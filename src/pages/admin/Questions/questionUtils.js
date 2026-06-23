/** Plain text for table previews — strips tags from rich-text HTML. */
export function stripHtml(value) {
  if (value == null) return ''
  const s = String(value)
  if (!s.includes('<')) return s.replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = s
  const text = div.textContent || div.innerText || ''
  return text.replace(/\s+/g, ' ').trim()
}
