// Dev tool: replace hard-coded semantic colours with theme tokens (works in light + dark).
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const write = process.argv.includes('--write')
const root = path.resolve('src')
const EXCLUDE = /CodeEditor|Playground|MediaPlayer|node_modules/
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css') && !EXCLUDE.test(p)) {
      const rel = path.relative(root, p)
      if (rel.startsWith('pages') || p.endsWith('.module.css')) files.push(p)
    }
  }
})(root)

const fam = {
  '--success': ['#10b981', '#28a745', '#4caf50', '#22c55e', '#059669', '#00a67d', '#00c896', '#238636', '#16a34a', '#3d8a6a'],
  '--error': ['#ef4444', '#dc3545', '#f44336', '#dc2626', '#b91c1c', '#f85149', '#e53e3e'],
  '--warning': ['#f59e0b', '#d39e00', '#ffc107', '#fd7e14', '#f57c00', '#b8862e'],
  '--accent-primary': ['#3b82f6', '#007bff', '#2563eb', '#2f5d8a']
}
const hexToToken = new Map()
const rgbToToken = new Map()
for (const [tok, hexes] of Object.entries(fam)) {
  for (const h of hexes) {
    hexToToken.set(h, tok)
    const n = parseInt(h.slice(1), 16)
    rgbToToken.set(`${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`, tok)
  }
}
const neutral = new Map([
  ['#6c757d', 'var(--text-muted)'],
  ['#9ca3af', 'var(--text-muted)']
])

let total = 0
for (const f of files) {
  const ast = postcss.parse(fs.readFileSync(f, 'utf8'))
  let n = 0
  ast.walkDecls((d) => {
    let v = d.value
    const orig = v
    v = v.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi, (m, r, g, b, a) => {
      const tok = rgbToToken.get(`${r},${g},${b}`)
      if (!tok) return m
      return `color-mix(in srgb, var(${tok}) ${Math.round(parseFloat(a) * 100)}%, transparent)`
    })
    v = v.replace(/#[0-9a-fA-F]{6}\b/g, (m) => {
      const lower = m.toLowerCase()
      if (hexToToken.has(lower)) return `var(${hexToToken.get(lower)})`
      if (neutral.has(lower)) return neutral.get(lower)
      return m
    })
    if (/^background(-color)?$/.test(d.prop)) {
      v = v.replace(/^(white|#fff|#ffffff)$/i, 'var(--bg-card)')
    }
    if (v !== orig) {
      d.value = v
      n++
    }
  })
  if (n) {
    total += n
    console.log(String(n).padStart(4), path.relative(root, f))
    if (write) fs.writeFileSync(f, ast.toString())
  }
}
console.log('declarations updated:', total, write ? '(written)' : '(dry run)')
