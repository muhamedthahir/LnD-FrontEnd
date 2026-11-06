import DOMPurify from 'dompurify'

export default function safeHtml(value) {
  return DOMPurify.sanitize(String(value ?? ''), { USE_PROFILES: { html: true } })
}
