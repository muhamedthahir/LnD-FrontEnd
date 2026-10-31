import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Dialog } from '../../src/design/Dialog'
import Combobox from '../../src/design/Combobox'
import ResizeHandle from '../../src/design/ResizeHandle'
import { ActionButton, FieldGroup } from '../../src/design/Primitives'
import { useConfirmModal } from '../../src/hooks/useConfirmModal'
import '../../src/index.css'

function InteractionChecks() {
  const [outer, setOuter] = useState(false)
  const [inner, setInner] = useState(false)
  const [choice, setChoice] = useState(null)
  const [width, setWidth] = useState(40)
  const [results, setResults] = useState([])
  const containerRef = useRef(null)
  const { confirm, ConfirmDialog } = useConfirmModal()
  const selector = <Combobox label="Programming language" searchable options={['JavaScript', 'Python', 'Java', 'C++', 'C']} value={choice} onChange={setChoice} />
  return <main className="cz-page" style={{ maxWidth: 800, margin: 'auto' }}>
    <h1>Shared interaction checks</h1>
    <FieldGroup><label>Associated feedback</label><input required /><small id="existing-help">Persistent help</small><p role="alert" id="existing-error">Example validation error</p></FieldGroup>
    {selector}
    <ActionButton onClick={() => setOuter(true)}>Open outer dialog</ActionButton>
    <ActionButton onClick={() => {
      const first = confirm({ title: 'First confirmation' })
      const second = confirm({ title: 'Second confirmation' })
      Promise.all([first, second]).then(setResults)
    }}>Request two confirmations</ActionButton>
    <output aria-live="polite">Confirmation results: {JSON.stringify(results)}</output>
    <div ref={containerRef} style={{ display: 'flex', height: 160, border: '1px solid var(--border-control)' }}>
      <div style={{ width: `${width}%` }}>Problem</div>
      <ResizeHandle containerRef={containerRef} value={width} onChange={setWidth} label="Resize test panes" style={{}} className="test-separator">↔</ResizeHandle>
      <div style={{ flex: 1 }}>Editor</div>
    </div>
    <Dialog open={outer} title="Outer dialog" onClose={() => setOuter(false)}>
      <input aria-label="Initial dialog field" data-autofocus="true" autoFocus />
      {selector}
      <ActionButton onClick={() => setInner(true)}>Open inner dialog</ActionButton>
    </Dialog>
    <Dialog open={inner} title="Inner dialog" onClose={() => setInner(false)}><ActionButton onClick={() => setOuter(false)}>Close outer first</ActionButton></Dialog>
    <ConfirmDialog />
  </main>
}
createRoot(document.getElementById('root')).render(<InteractionChecks />)
