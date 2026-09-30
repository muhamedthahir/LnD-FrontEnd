// Local visual test only. No account data or passwords are sent to any server.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '../src/contexts/ThemeContext'
import ThemeToggle from '../src/components/ThemeToggle/ThemeToggle'
import BulkResetModal from '../src/pages/admin/Users/BulkResetModal'
import '../src/index.css'
import '../src/pages/admin/Users/Users.css'

const groups = Array.from({ length: 60 }, (_, index) => ({
  id: index + 1,
  name: index === 0 ? 'Computer Science — Final Year' : index === 1 ? 'Restricted group (error test)' : `Sample group ${index + 1}`,
  college_name: 'Example College', member_count: index === 2 ? 0 : 25
}))
async function previewRequest(path, options = {}) {
  if (options.method === 'POST') {
    const { groupId } = JSON.parse(options.body)
    const group = groups.find(row => row.id === groupId)
    return groupId === 2
      ? new Response(JSON.stringify({ error: 'You can only reset groups from your institution. No passwords were changed.' }), { status: 403 })
      : new Response(JSON.stringify({ groupName: group.name, updatedCount: group.member_count }))
  }
  const url = new URL(path, 'http://preview.invalid')
  const search = url.searchParams.get('search') || ''
  const offset = Number(url.searchParams.get('offset') || 0)
  const filtered = groups.filter(group => `${group.name} ${group.college_name}`.toLowerCase().includes(search.toLowerCase()))
  return new Response(JSON.stringify({ groups: filtered.slice(offset, offset + 50), total: filtered.length }))
}
function Preview() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('')
  return <main style={{ padding: '2rem' }}>
    <ThemeToggle />
    <h1>Bulk reset UI test</h1>
    <p>Synthetic groups only. Passwords stay in this test page; no accounts are changed.</p>
    <button className="btn-secondary" onClick={() => setOpen(true)}>Bulk reset passwords</button>
    <p role="status">{result}</p>
    {open && <BulkResetModal apiBaseUrl="/preview" request={previewRequest} onClose={() => setOpen(false)} onSuccess={data => {
      setResult(`Preview succeeded: ${data.updatedCount} users in ${data.groupName}.`)
      setOpen(false)
    }} />}
  </main>
}
createRoot(document.getElementById('root')).render(<ThemeProvider><Preview /></ThemeProvider>)
