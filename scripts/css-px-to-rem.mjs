// Dev tool: convert layout px values to rem so screens scale on tablets → 4K TVs (root font-size is fluid).
// Usage: node scripts/css-px-to-rem.mjs [--write]
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const write = process.argv.includes('--write')
const root = path.resolve('src')
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css')) {
      const rel = path.relative(root, p)
      const isPage = rel.startsWith('pages')
      const isModule = p.endsWith('.module.css')
      if (isPage || isModule) files.push(p)
    }
  }
})(root)

const PROPS = /^(font-size|padding(-[a-z]+)*|margin(-[a-z]+)*|gap|row-gap|column-gap|width|min-width|max-width|height|min-height|max-height|border-radius|border-(top|bottom)-(left|right)-radius|top|left|right|bottom|inset|flex-basis|line-height|letter-spacing|background-size|grid-template-columns|grid-template-rows|grid-auto-rows|grid-auto-columns|scroll-margin(-[a-z]+)*)$/

let total = 0
for (const f of files) {
  const ast = postcss.parse(fs.readFileSync(f, 'utf8'))
  let n = 0
  ast.walkDecls((d) => {
    if (!PROPS.test(d.prop)) return
    if (!/px/.test(d.value)) return
    const v = d.value.replace(/(-?\d*\.?\d+)px\b/g, (m, num) => {
      const x = parseFloat(num)
      if (Math.abs(x) < 2) return m // keep hairlines / 1px
      n++
      const rem = Math.round((x / 16) * 10000) / 10000
      return `${rem}rem`
    })
    d.value = v
  })
  if (n) {
    total += n
    console.log(String(n).padStart(4), path.relative(root, f))
    if (write) fs.writeFileSync(f, ast.toString())
  }
}
console.log('values converted:', total, write ? '(written)' : '(dry run)')
