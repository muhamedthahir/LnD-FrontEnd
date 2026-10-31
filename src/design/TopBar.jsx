import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { ActionButton } from './Primitives'
import { getRouteMeta } from './routeMeta'
import { useTheme } from '../contexts/ThemeContext'

export default function TopBar({ user, logout, onToggleSidebar, isSidebarCollapsed, isSidebarOpen, isMobile }) {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)
  const { theme, toggleTheme, preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const accountId = useId()
  const keyboardOpening = useRef(false)
  useEffect(() => {
    const close = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const key = event => { if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus() } }
    if (open) {
      document.addEventListener('pointerdown', close); document.addEventListener('keydown', key)
      if (keyboardOpening.current) ref.current?.querySelector('a')?.focus()
    }
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [open])
  useEffect(() => { setOpen(false) }, [pathname])
  return <header className="cz-topbar">
    <div className="cz-topbar-start"><ActionButton variant="quiet" aria-label={isMobile ? isSidebarOpen ? 'Close navigation' : 'Open navigation' : isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={isMobile ? isSidebarOpen : !isSidebarCollapsed} aria-controls="workspace-navigation" onClick={onToggleSidebar}><Icon name="menu"/></ActionButton><nav className="cz-breadcrumbs" aria-label="Breadcrumb"><span>{meta.group}</span><Icon name="chevron" size={14}/><Link to={meta.path || '/dashboard'}>{meta.title}</Link>{meta.detail && <><Icon name="chevron" size={14}/><span>{meta.detail}</span></>}</nav></div>
    <div className="cz-topbar-end"><ActionButton variant="quiet" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'}/></ActionButton><div className="cz-account" ref={ref} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}><button type="button" className="cz-account-trigger" aria-expanded={open} aria-controls={open ? accountId : undefined} aria-label="User menu" onClick={event => { keyboardOpening.current = event.detail === 0; setOpen(!open) }}><span className="cz-avatar">{user?.name?.charAt(0) || 'C'}</span><span className="cz-account-name">{user?.name?.split(' ')[0] || 'Account'}</span><Icon name="chevron" size={14}/></button>{open && <div id={accountId} role="region" aria-label="Account actions" data-input={keyboardOpening.current ? 'keyboard' : 'pointer'} className="cz-account-popover"><div className="cz-account-summary"><strong>{user?.name}</strong><span>{user?.email}</span><small>{user?.role?.replaceAll('_', ' ')}</small></div><label className="cz-appearance-setting">Appearance<select value={preference} onChange={event => setPreference(event.target.value)}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></label><Link to="/personal-details"><Icon name="person"/>My profile</Link>{['primary_admin','campuszen_admin'].includes(user?.role) && <Link to="/admin/settings"><Icon name="settings"/>Workspace settings</Link>}<ActionButton variant="danger" onClick={logout}><Icon name="exit"/>Sign out</ActionButton></div>}</div></div>
  </header>
}
