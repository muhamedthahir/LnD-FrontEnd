import axe from 'axe-core'

// Test-only UI: a real keyboard/click action runs the DOM audit without remote injection.
const panel = document.createElement('section')
panel.id = 'qa-a11y-panel'
panel.setAttribute('aria-label', 'Accessibility verification')
Object.assign(panel.style, { position: 'fixed', bottom: '0', right: '0', zIndex: '5000', maxWidth: 'min(36rem,100vw)', maxHeight: '10rem', overflow: 'auto', background: '#fff', color: '#111', border: '1px solid #555', padding: '.5rem', fontSize: '12px' })
const trigger = document.createElement('button')
trigger.textContent = 'Audit accessibility (Alt+Shift+A)'
const result = document.createElement('output')
result.id = 'qa-a11y-result'
result.setAttribute('aria-live', 'polite')
result.style.display = 'block'
panel.append(trigger, result)
document.body.append(panel)
let running = false
async function audit() {
  if (running) return
  running = true
  result.textContent = 'Running'
  try {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const transitions = document.getAnimations().filter(animation => {
      const duration = animation.effect?.getComputedTiming().endTime
      return Number.isFinite(duration) && duration <= 1000
    })
    await Promise.all(transitions.map(animation => animation.finished.catch(() => {})))
    const report = await axe.run({ exclude: [['#qa-a11y-panel']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
    result.textContent = JSON.stringify({ version: axe.version, violations: report.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), incomplete: report.incomplete.map(item => ({ id: item.id, impact: item.impact, count: item.nodes.length, nodes: item.nodes.map(node => ({ target: node.target, reasons: [...node.any, ...node.all, ...node.none].map(check => check.message) })) })) })
  } catch (error) { result.textContent = JSON.stringify({ error: error.message }) }
  finally { running = false }
}
trigger.addEventListener('click', audit)
document.addEventListener('keydown', event => {
  if (event.altKey && event.shiftKey && event.code === 'KeyA') { event.preventDefault(); event.stopPropagation(); audit() }
}, true)
