// Dev tool: drop page-level badge colour rules now covered by kit.css tokens.
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const root = path.resolve('src/pages')
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css') && !p.endsWith('.module.css')) files.push(p)
  }
})(root)

const BASE = /^\.(status-badge|institution-status-badge|role-badge|segment-status-badge)$/
const VARIANT = /^\.(status-badge|institution-status-badge|role-badge|segment-status-badge)\.[\w-]+$/
const BARE = /^\.(status|role)-(?!icon|indicator)[\w-]+$/
for (const f of files) {
  const ast = postcss.parse(fs.readFileSync(f, 'utf8'))
  let n = 0
  ast.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return
    const keep = rule.selectors.filter((s) => !(BASE.test(s.trim()) || VARIANT.test(s.trim()) || BARE.test(s.trim())))
    if (keep.length === rule.selectors.length) return
    n += rule.selectors.length - keep.length
    if (!keep.length) rule.remove()
    else rule.selectors = keep
  })
  if (n) {
    fs.writeFileSync(f, ast.toString())
    console.log(n, path.relative(root, f))
  }
}
