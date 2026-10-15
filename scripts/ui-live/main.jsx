// Real UI + real local API/database. No mocked CRUD responses.
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {Provider} from 'react-redux'
import store from '../../src/store'
import App from '../../src/App.jsx'
import '../../src/index.css'
const params=new URLSearchParams(location.search)
const session=await fetch('http://127.0.0.1:3183/session?role='+(params.get('role')||'primary_admin')).then(r=>r.json())
localStorage.setItem('accessToken',session.token)
localStorage.setItem('user',JSON.stringify(session.user))
localStorage.setItem('theme',params.get('theme')||'light')
localStorage.removeItem('refreshToken')
const fetchApi=window.fetch.bind(window)
// Keep secure assessment QA in this isolated harness; the ordinary popup entry
// would load the application's deployment config instead of this local API.
const openWindow=window.open.bind(window)
window.open=(url,...args)=>{
 const target=new URL(url,location.href)
 if(target.origin===location.origin && target.pathname.startsWith('/secure/assessment/'))return null
 return openWindow(url,...args)
}
window.fetch=(input,options)=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href)
 if(/\/config\.(local|dev)\.json$/.test(url.pathname))return Promise.resolve(new Response(JSON.stringify({BACKEND_URL:'http://127.0.0.1:3182'}),{headers:{'Content-Type':'application/json'}}))
 return fetchApi(input,options)
}
createRoot(document.getElementById('root')).render(<Provider store={store}><MemoryRouter initialEntries={[params.get('route')||'/admin/settings']} future={{v7_relativeSplatPath:true,v7_startTransition:true}}><App/></MemoryRouter></Provider>)
