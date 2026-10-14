import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { ActionButton } from './Primitives'
import { getRouteMeta } from './routeMeta'
import { useTheme } from '../contexts/ThemeContext'

export default function TopBar({ user, logout, onToggleSidebar, isSidebarCollapsed }) {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const key = event => { if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus() } }
    if (open) { document.addEventListener('pointerdown', close); document.addEventListener('keydown', key) }
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [open])
  useEffect(() => { setOpen(false) }, [pathname])
  return <header className="cz-topbar">
    <div className="cz-topbar-start"><ActionButton variant="quiet" aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggleSidebar}><Icon name="menu"/></ActionButton><nav className="cz-breadcrumbs" aria-label="Breadcrumb"><span>{meta.group}</span><Icon name="chevron" size={14}/><Link to={meta.path || '/dashboard'}>{meta.title}</Link>{meta.detail && <><Icon name="chevron" size={14}/><span>{meta.detail}</span></>}</nav></div>
    <div className="cz-topbar-end"><ActionButton variant="quiet" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'}/></ActionButton><div className="cz-account" ref={ref}><button type="button" className="cz-account-trigger" aria-expanded={open} aria-haspopup="true" aria-label="User menu" onClick={() => setOpen(!open)}><span className="cz-avatar">{user?.name?.charAt(0) || 'C'}</span><span className="cz-account-name">{user?.name?.split(' ')[0] || 'Account'}</span><Icon name="chevron" size={14}/></button>{open && <div className="cz-account-popover"><div className="cz-account-summary"><strong>{user?.name}</strong><span>{user?.email}</span><small>{user?.role?.replaceAll('_', ' ')}</small></div><Link to="/personal-details"><Icon name="person"/>My profile</Link>{['primary_admin','campuszen_admin'].includes(user?.role) && <Link to="/admin/settings"><Icon name="settings"/>Workspace settings</Link>}<ActionButton variant="danger" onClick={logout}><Icon name="exit"/>Sign out</ActionButton></div>}</div></div>
  </header>
}
