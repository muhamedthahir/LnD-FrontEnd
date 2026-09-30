// Dev tool: strip rules that duplicate shared UI-kit primitives (src/styles/kit.css) from page stylesheets.
// Usage: node scripts/css-dedupe.mjs [--write]
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const write = process.argv.includes('--write')
const root = path.resolve('src')

const KIT = new Set(`btn-primary btn-secondary btn-danger btn-delete btn-back btn-clear-filters btn-edit btn-review
btn-confirm btn-cancel btn-icon action-btn menu-button btn-spinner form-row form-group required error-text form-hint
field-hint form-actions form-section filters-section filters filter-group filter-select filter-input search-input
table-container table-inner-box action-buttons pagination-wrapper status-badge role-badge loading loading-state
empty-state empty-state-icon modal-overlay modal-content modal-header modal-body modal-actions modal-footer
modal-close btn-close spinner user-styled-select create-page create-page-header create-page-content create-form`.split(/\s+/))

const SKIP = new Set(['index.css', 'kit.css', 'App.css', 'ThemedSelect.css'])
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css') && !p.endsWith('.module.css') && !SKIP.has(e.name)) files.push(p)
  }
})(path.join(root, 'pages'))

const TABLE_TAIL = /(^|[\s>+~])(table|thead|tbody|tfoot|tr|th|td)((:[a-z-]+(\([^)]*\))?)*)$/i

function kitOwned(sel) {
  if (/[#\[]/.test(sel)) return false
  const classes = [...sel.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1])
  if (classes.length && classes.every((c) => KIT.has(c))) return true
  return false
}
function isTableRule(sel) {
  // Only strip plain "<class-or-nothing> th/td/tr/table" rules
  return TABLE_TAIL.test(sel.trim()) && !/\.(?:[A-Za-z_][\w-]*)[A-Za-z_-]*\s*$/.test(sel.trim())
}

let totalRemoved = 0
for (const f of files) {
  const css = fs.readFileSync(f, 'utf8')
  const ast = postcss.parse(css)
  let removed = 0
  ast.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return
    const keep = rule.selectors.filter((s) => !(kitOwned(s) || isTableRule(s)))
    if (keep.length === rule.selectors.length) return
    removed += rule.selectors.length - keep.length
    if (keep.length === 0) rule.remove()
    else rule.selectors = keep
  })
  ast.walkAtRules((at) => {
    if (['media', 'supports'].includes(at.name) && (!at.nodes || at.nodes.length === 0)) at.remove()
  })
  if (removed) {
    console.log(String(removed).padStart(4), path.relative(root, f))
    totalRemoved += removed
    if (write) fs.writeFileSync(f, ast.toString())
  }
}
console.log('selectors removed:', totalRemoved, write ? '(written)' : '(dry run)')
