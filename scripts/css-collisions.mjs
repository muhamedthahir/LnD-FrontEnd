// Dev tool: list root class names defined by more than one global (non-module) stylesheet.
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const root = path.resolve('src')
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css') && !p.endsWith('.module.css')) files.push(p)
  }
})(root)

const map = new Map()
for (const f of files) {
  const css = fs.readFileSync(f, 'utf8')
  const ast = postcss.parse(css)
  ast.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return
    for (const sel of rule.selectors) {
      const m = sel.match(/\.([A-Za-z_][\w-]*)/)
      if (!m) continue
      const k = m[1]
      if (!map.has(k)) map.set(k, new Set())
      map.get(k).add(path.relative(root, f))
    }
  })
}
const out = [...map.entries()].filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size)
for (const [k, s] of out) console.log(String(s.size).padStart(3), k)
console.log('total shared root classes:', out.length)
