// Dev tool: turn fixed-viewport-height admin page shells into normal flowing pages.
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const root = path.resolve('src/pages')
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css')) files.push(p)
  }
})(root)

const HEADER_CALC = /calc\(100d?vh\s*-\s*var\(--layout-header-height\)\)/
for (const f of files) {
  const ast = postcss.parse(fs.readFileSync(f, 'utf8'))
  let changed = 0
  ast.walkRules((rule) => {
    let hasViewportHeight = false
    rule.each((d) => {
      if (d.type === 'decl' && ['height', 'max-height', 'min-height'].includes(d.prop) && HEADER_CALC.test(d.value)) hasViewportHeight = true
    })
    if (!hasViewportHeight) return
    rule.each((d) => {
      if (d.type !== 'decl') return
      if (d.prop === 'max-height' && HEADER_CALC.test(d.value)) { d.remove(); changed++ }
      else if (d.prop === 'height' && HEADER_CALC.test(d.value)) { d.prop = 'min-height'; changed++ }
      else if (d.prop === 'overflow' && d.value === 'hidden') { d.value = 'visible'; changed++ }
    })
  })
  // de-dup min-height declarations that ended up twice in one rule
  ast.walkRules((rule) => {
    const seen = new Map()
    rule.each((d) => {
      if (d.type === 'decl' && d.prop === 'min-height') {
        if (seen.has('min-height')) seen.get('min-height').remove()
        seen.set('min-height', d)
      }
    })
  })
  if (changed) {
    fs.writeFileSync(f, ast.toString())
    console.log(String(changed).padStart(3), path.relative(root, f))
  }
}
