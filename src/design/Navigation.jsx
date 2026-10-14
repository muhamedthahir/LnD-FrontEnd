import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { navigation } from './routeMeta'

export default function Navigation({ user, isCollapsed, isOpen, onClose }) {
  const { pathname } = useLocation()
  const admin = ['primary_admin', 'campuszen_admin', 'college_admin'].includes(user?.role)
  const platform = ['primary_admin', 'campuszen_admin'].includes(user?.role)
  const links = navigation.filter(item => item.roles === 'all' || item.roles === 'admin' && admin || item.roles === 'platform' && platform || item.roles === 'student' && !admin)
  const groups = [...new Set(links.map(item => item.group))]
  return <aside className={`cz-navigation ${isCollapsed ? 'is-collapsed' : ''} ${isOpen ? 'is-open' : ''}`} aria-label="Workspace navigation">
    <Link to="/dashboard" className="cz-brand" aria-label="CampusZen overview"><img className="cz-brand-mark" src="/campuszen-logo.png" alt="" /><span className="cz-brand-name">CampusZen<span>Learning workspace</span></span></Link>
    <div className="cz-nav-context"><span className="cz-context-dot" /><span>{admin ? 'Administration' : 'Student workspace'}</span></div>
    <nav>{groups.map(group => <section key={group} className="cz-nav-group"><h2>{group}</h2>{links.filter(item => item.group === group).map(item => {
      const active = pathname === item.path || item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`)
      return <Link key={item.path} to={item.path} onClick={onClose} title={isCollapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} className={`cz-nav-link ${active ? 'is-active' : ''}`}><Icon name={item.icon}/><span>{item.label}</span>{active && <i className="cz-nav-active-dot"/>}</Link>
    })}</section>)}</nav>
    <div className="cz-nav-footer"><span className="cz-avatar">{user?.name?.charAt(0) || 'C'}</span><div><strong>{user?.name || 'Your workspace'}</strong><small>{user?.college_name || (platform ? 'Platform administrator' : 'CampusZen')}</small></div></div>
  </aside>
}
