// Development-only visual fixture; Vite's production entry does not include this page.
// Uses synthetic content and the real shared components without signing in.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ThemeProvider } from '../src/contexts/ThemeContext'
import { ApiProvider } from '../src/contexts/ApiContext'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Header from '../src/components/Header/Header'
import ConfirmModal from '../src/components/ConfirmModal/ConfirmModal'
import InputModal from '../src/components/InputModal/InputModal'
import DoubleInputModal from '../src/components/DoubleInputModal/DoubleInputModal'
import styles from '../src/components/Layout/Layout.module.css'
import '../src/index.css'
import '../src/App.css'

function Preview() {
  const [collapsed, setCollapsed] = useState(true)
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const { pathname } = useLocation()
  const user = { name: 'Sample Administrator With A Very Long Display Name', email: 'preview@example.invalid', role: 'primary_admin' }
  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = String(collapsed)
  }, [collapsed])
  useEffect(() => { setOpen(false) }, [pathname])
  const close = () => setModal(null)
  return <div className={styles.layout}>
    {open && <div className={styles.sidebarBackdrop} onClick={() => setOpen(false)} />}
    <Sidebar user={user} isCollapsed={collapsed} isOpen={open} />
    <Header user={user} logout={() => {}} isSidebarCollapsed={collapsed} onToggleSidebar={() => {
      if (innerWidth <= 600) setOpen(value => !value)
      else setCollapsed(value => !value)
    }} />
    <main className={styles.main}>
      <section style={{ padding: '1rem', overflowWrap: 'anywhere' }}>
        <h1>UI regression preview</h1>
        <p>Synthetic data • saved desktop sidebar starts collapsed.</p>
        <p>Check widths 320, 375, 768 and 1280 pixels in both themes.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBlock: '1rem' }}>
          <button onClick={() => setModal('confirm')}>Open confirmation</button>
          <button onClick={() => setModal('input')}>Open input</button>
          <button onClick={() => setModal('double')}>Open two inputs</button>
        </div>
        <div role="status" aria-label="Loading page" className="spinner" />
        <p>The content starts below the header and stays within the viewport. Dialogs must cover both the header and sidebar.</p>
      </section>
      <ConfirmModal isOpen={modal === 'confirm'} onClose={close} onConfirm={close} title="Long confirmation" message={Array.from({ length: 12 }, (_, i) => <p key={i}>Review item {i + 1}: this deliberately long message checks scrolling and button visibility in short viewports.</p>)} />
      <InputModal isOpen={modal === 'input'} onClose={close} onConfirm={close} title="Input preview" label="Name" initialValue="Sample text" />
      <DoubleInputModal isOpen={modal === 'double'} onClose={close} onConfirm={close} title="Two input preview" label1="First value" label2="Second value" />
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(
  <ApiProvider><ThemeProvider><MemoryRouter initialEntries={['/dashboard']}><Preview /></MemoryRouter></ThemeProvider></ApiProvider>
)
