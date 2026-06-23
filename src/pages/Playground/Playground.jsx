import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Editor from '@monaco-editor/react'
import { useApi } from '../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../constants/constants'
import styles from './Playground.module.css'

const DEFAULT_HTML = `<div class="card">
  <h1>Hello Playground</h1>
  <p>Edit HTML, CSS &amp; JS — the preview updates as you type.</p>
  <button id="btn">Click me</button>
</div>`

const DEFAULT_CSS = `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #0d1117;
}

.card {
  background: #161b22;
  color: #e6edf3;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #30363d;
  text-align: center;
}

button {
  margin-top: 12px;
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  background: #2f81f7;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}`

const DEFAULT_JS = `const btn = document.getElementById('btn');
let count = 0;
btn.addEventListener('click', () => {
  count += 1;
  console.log('Button clicked', count, 'time(s)');
  btn.textContent = 'Clicked ' + count + ' time' + (count === 1 ? '' : 's');
});

console.log('Playground ready!');`

const TABS = [
  { key: 'html', label: 'HTML', language: 'html' },
  { key: 'css', label: 'CSS', language: 'css' },
  { key: 'js', label: 'JS', language: 'javascript' },
]

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function Playground() {
  const { shareId } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const shareMode = Boolean(shareId)

  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)
  const [js, setJs] = useState(DEFAULT_JS)
  const [activeTab, setActiveTab] = useState('html')
  const [srcDoc, setSrcDoc] = useState('')
  const [title, setTitle] = useState('Untitled')

  // Saved-project tracking.
  const [projectId, setProjectId] = useState(null)
  const [currentShareId, setCurrentShareId] = useState(null)
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saving, setSaving] = useState(false)

  // Resizable layout (editor width as a percentage of the workspace).
  const [leftWidth, setLeftWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [previewWidthPx, setPreviewWidthPx] = useState(0)
  const workspaceRef = useRef(null)
  const previewRef = useRef(null)

  // Console panel.
  const [logs, setLogs] = useState([])
  const [consoleOpen, setConsoleOpen] = useState(false)

  // ----- API helper -----
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || err.error || `Request failed (${res.status})`)
    }
    return res.status === 204 ? null : res.json()
  }, [apiBaseUrl, accessToken])

  const loadProjects = useCallback(async (searchTerm = '') => {
    if (!apiBaseUrl || !accessToken) return
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const data = await apiFetch(`${API_ENDPOINTS.PLAYGROUND.LIST}${params}`)
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Failed to load playground projects:', err)
    }
  }, [apiBaseUrl, accessToken, apiFetch])

  // Initial list load (debounced when searching).
  useEffect(() => {
    if (shareMode) return
    const t = setTimeout(() => loadProjects(search), 250)
    return () => clearTimeout(t)
  }, [search, shareMode, loadProjects])

  // Load a shared (public) playground.
  useEffect(() => {
    if (!shareMode || !apiBaseUrl) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch(API_ENDPOINTS.PLAYGROUND.PUBLIC(shareId))
        if (cancelled) return
        const p = data.project
        setHtml(p.html || '')
        setCss(p.css || '')
        setJs(p.js || '')
        setTitle(p.title || 'Untitled')
        // Viewer edits are local only - never tied to the original record.
        setProjectId(null)
        setCurrentShareId(null)
      } catch (err) {
        toast.error('Shared playground not found')
        navigate('/playground', { replace: true })
      }
    })()
    return () => { cancelled = true }
  }, [shareMode, shareId, apiBaseUrl, apiFetch, navigate])

  // Debounce preview updates so it refreshes shortly after typing stops.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLogs([])
      setSrcDoc(`<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
    <script>
      (function () {
        var send = function (level, args) {
          try {
            var msg = Array.prototype.map.call(args, function (a) {
              try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
              catch (e) { return String(a); }
            }).join(' ');
            parent.postMessage({ source: 'playground-console', level: level, message: msg }, '*');
          } catch (e) {}
        };
        ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
          var orig = console[level];
          console[level] = function () { send(level, arguments); if (orig) orig.apply(console, arguments); };
        });
        window.addEventListener('error', function (e) { send('error', [e.message]); });
        window.addEventListener('unhandledrejection', function (e) { send('error', ['Unhandled promise rejection: ' + e.reason]); });
      })();
    <\/script>
  </head>
  <body>
    ${html}
    <script>
      try {
${js}
      } catch (err) {
        console.error(err && err.message ? err.message : err);
      }
    <\/script>
  </body>
</html>`)
    }, 350)

    return () => clearTimeout(timeout)
  }, [html, css, js])

  // Receive console output from the preview iframe.
  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data
      if (data && data.source === 'playground-console') {
        setLogs((prev) => [...prev, { level: data.level, message: data.message, id: Date.now() + Math.random() }])
        setConsoleOpen((open) => open || data.level === 'error')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ----- Drag handling for the divider -----
  const updatePreviewWidth = useCallback(() => {
    if (previewRef.current) {
      setPreviewWidthPx(Math.round(previewRef.current.getBoundingClientRect().width))
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!workspaceRef.current) return
    const rect = workspaceRef.current.getBoundingClientRect()
    const newLeft = ((e.clientX - rect.left) / rect.width) * 100
    if (newLeft >= 15 && newLeft <= 85) {
      setLeftWidth(newLeft)
    }
  }, [])

  const stopDragging = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopDragging)
  }, [handleMouseMove])

  const startDragging = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopDragging)
  }, [handleMouseMove, stopDragging])

  useEffect(() => {
    updatePreviewWidth()
  }, [leftWidth, sidebarOpen, updatePreviewWidth])

  useEffect(() => {
    window.addEventListener('resize', updatePreviewWidth)
    return () => window.removeEventListener('resize', updatePreviewWidth)
  }, [updatePreviewWidth])

  // ----- Editor binding -----
  const valueForTab = useCallback(() => {
    if (activeTab === 'html') return html
    if (activeTab === 'css') return css
    return js
  }, [activeTab, html, css, js])

  const handleChange = useCallback((value) => {
    const next = value ?? ''
    if (activeTab === 'html') setHtml(next)
    else if (activeTab === 'css') setCss(next)
    else setJs(next)
  }, [activeTab])

  const activeLanguage = TABS.find((t) => t.key === activeTab)?.language

  // ----- Project actions -----
  const resetToNew = useCallback(() => {
    setHtml(DEFAULT_HTML)
    setCss(DEFAULT_CSS)
    setJs(DEFAULT_JS)
    setTitle('Untitled')
    setProjectId(null)
    setCurrentShareId(null)
    setLogs([])
  }, [])

  const handleNew = useCallback(() => {
    if (shareMode) navigate('/playground')
    resetToNew()
  }, [shareMode, navigate, resetToNew])

  const openProject = useCallback(async (id) => {
    try {
      const data = await apiFetch(API_ENDPOINTS.PLAYGROUND.GET(id))
      const p = data.project
      setHtml(p.html || '')
      setCss(p.css || '')
      setJs(p.js || '')
      setTitle(p.title || 'Untitled')
      setProjectId(p.id)
      setCurrentShareId(p.share_id)
      setLogs([])
      if (shareMode) navigate('/playground')
    } catch (err) {
      toast.error(err.message || 'Failed to open project')
    }
  }, [apiFetch, shareMode, navigate])

  // Saves the current editor state. In share mode (or when there is no owned
  // project yet) this creates a brand-new project so the original is untouched.
  // Returns the project's share id on success, or null on failure.
  const handleSave = useCallback(async () => {
    if (!accessToken) {
      toast.error('Please log in to save playgrounds')
      return null
    }
    setSaving(true)
    try {
      const payload = { title: title || 'Untitled', html, css, js }
      if (projectId && !shareMode) {
        await apiFetch(API_ENDPOINTS.PLAYGROUND.UPDATE(projectId), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Saved')
        loadProjects(search)
        return currentShareId
      }
      const data = await apiFetch(API_ENDPOINTS.PLAYGROUND.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setProjectId(data.id)
      setCurrentShareId(data.share_id)
      if (shareMode) navigate('/playground')
      toast.success('Saved as a new copy')
      loadProjects(search)
      return data.share_id
    } catch (err) {
      toast.error(err.message || 'Failed to save')
      return null
    } finally {
      setSaving(false)
    }
  }, [accessToken, title, html, css, js, projectId, currentShareId, shareMode, apiFetch, loadProjects, search, navigate])

  const handleShare = useCallback(async () => {
    let share = (!shareMode && projectId) ? currentShareId : null
    // Must be saved (and owned) before it can be shared.
    if (!share) {
      share = await handleSave()
      if (!share) return
    }
    const url = `${window.location.origin}/playground/share/${share}`
    navigator.clipboard?.writeText(url).then(
      () => toast.success('Share link copied to clipboard'),
      () => toast.info(url)
    )
  }, [currentShareId, projectId, shareMode, handleSave])

  const handleDelete = useCallback(async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this playground?')) return
    try {
      await apiFetch(API_ENDPOINTS.PLAYGROUND.DELETE(id), { method: 'DELETE' })
      if (id === projectId) resetToNew()
      loadProjects(search)
      toast.success('Deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }, [apiFetch, projectId, resetToNew, loadProjects, search])

  return (
    <div className={styles.playground}>
      {/* Sidebar */}
      {!shareMode && (
        <div className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarCollapsed}`}>
          {sidebarOpen ? (
            <>
              <div className={styles.sidebarHeader}>
                <span className={styles.sidebarTitle}>Playgrounds</span>
                <button
                  className={styles.iconBtn}
                  title="Collapse sidebar"
                  onClick={() => setSidebarOpen(false)}
                >
                  «
                </button>
              </div>
              <button className={styles.newBtn} onClick={handleNew}>
                + New Exercise
              </button>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search saved…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className={styles.projectList}>
                {!accessToken ? (
                  <div className={styles.emptyNote}>Log in to save and view your playgrounds.</div>
                ) : projects.length === 0 ? (
                  <div className={styles.emptyNote}>No saved playgrounds yet.</div>
                ) : (
                  projects.map((p) => (
                    <div
                      key={p.id}
                      className={`${styles.projectItem} ${p.id === projectId ? styles.projectItemActive : ''}`}
                      onClick={() => openProject(p.id)}
                    >
                      <div className={styles.projectInfo}>
                        <div className={styles.projectName}>{p.title}</div>
                        <div className={styles.projectDate}>{formatDate(p.updated_at)}</div>
                      </div>
                      <button
                        className={styles.deleteBtn}
                        title="Delete"
                        onClick={(e) => handleDelete(p.id, e)}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <button
              className={styles.expandBtn}
              title="Expand sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              »
            </button>
          )}
        </div>
      )}

      {/* Main area */}
      <div className={styles.mainArea}>
        <div className={styles.toolbar}>
          {shareMode && (
            <span className={styles.shareBadge}>Shared copy — edits won&apos;t affect the original</span>
          )}
          <input
            className={styles.titleInput}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
          />
          <div className={styles.toolbarActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : shareMode ? 'Save a copy' : 'Save'}
            </button>
            <button className={styles.shareBtn} onClick={handleShare} disabled={saving}>
              Share
            </button>
          </div>
        </div>

        <div className={styles.workspace} ref={workspaceRef}>
          <div className={styles.editorPane} style={{ width: `${leftWidth}%` }}>
            <div className={styles.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.editorWrapper}>
              <Editor
                height="100%"
                theme="vs-dark"
                path={activeTab}
                language={activeLanguage}
                value={valueForTab()}
                onChange={handleChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>

            <div className={`${styles.console} ${consoleOpen ? styles.consoleOpen : ''}`}>
              <div className={styles.consoleHeader}>
                <button className={styles.consoleToggle} onClick={() => setConsoleOpen((o) => !o)}>
                  <span className={`${styles.chevron} ${consoleOpen ? styles.chevronUp : ''}`}>▸</span>
                  Console
                  {logs.length > 0 && <span className={styles.logBadge}>{logs.length}</span>}
                </button>
                {consoleOpen && logs.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setLogs([])}>Clear</button>
                )}
              </div>
              {consoleOpen && (
                <div className={styles.consoleBody}>
                  {logs.length === 0 ? (
                    <div className={styles.consoleEmpty}>Console output will appear here…</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className={`${styles.logLine} ${styles[`log_${log.level}`] || ''}`}>
                        {log.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            className={`${styles.resizer} ${isDragging ? styles.resizerActive : ''}`}
            onMouseDown={startDragging}
          >
            <div className={styles.resizerGrip} />
          </div>

          <div className={styles.previewPane} style={{ width: `${100 - leftWidth}%` }} ref={previewRef}>
            <div className={styles.previewHeader}>Preview</div>
            {isDragging && <div className={styles.widthIndicator}>{previewWidthPx}px</div>}
            <iframe
              className={styles.previewFrame}
              title="playground-preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc}
            />
            {isDragging && <div className={styles.dragShield} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Playground
