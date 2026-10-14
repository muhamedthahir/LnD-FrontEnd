import AssessmentDialogs from '../src/design/AssessmentDialogs';
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
const styles = {layout:'cz-shell',main:'cz-workspace',sidebarBackdrop:'cz-shell-backdrop'}
import { ActionButton, Panel, FieldGroup, DataTable } from '../src/design/Primitives'
import Combobox from '../src/design/Combobox'
import Switch from '../src/design/Switch'
import CourseCard from '../src/design/CourseCard'
import LessonModal from '../src/components/LessonModal/LessonModal'
import RichTextEditor from '../src/components/RichTextEditor/RichTextEditor'
import { VideoPlayer, AudioPlayer, DocumentViewer } from '../src/components/MediaPlayer'
import PasswordSetup from '../src/components/PasswordSetup/PasswordSetup'
import '../src/index.css'


const previewParams=new URLSearchParams(location.search)
if(previewParams.get('theme'))localStorage.setItem('theme',previewParams.get('theme'))
function Preview() {
  const [assessmentModal,setAssessmentModal]=useState(previewParams.get('assessment'))
  const [collapsed, setCollapsed] = useState(true)
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [choice,setChoice] = useState([])
  const [enabled,setEnabled] = useState(false)
  const [content,setContent] = useState('<p>Learning begins with curiosity.</p>')
  const { pathname } = useLocation()
  const user = { name: 'Sample Administrator With A Very Long Display Name', email: 'preview@example.invalid', role: 'primary_admin' }
  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = String(collapsed)
  }, [collapsed])
  useEffect(() => { setOpen(false) }, [pathname])
  const close = () => setModal(null)
  return <div className={styles.layout}>
    {open && <div className={styles.sidebarBackdrop} onClick={() => setOpen(false)} />}
    <Sidebar user={user} isCollapsed={collapsed} isOpen={open} onClose={() => setOpen(false)} />
    <Header user={user} logout={() => {}} isSidebarCollapsed={collapsed} onToggleSidebar={() => {
      if (innerWidth <= 600) setOpen(value => !value)
      else setCollapsed(value => !value)
    }} />
    <main className="cz-workspace cz-page" id="workspace-content">
      <section style={{ padding: '1rem', overflowWrap: 'anywhere' }}>
        <h1>UI regression preview</h1>
        <p>Synthetic data • saved desktop sidebar starts collapsed.</p>
        <p>Check widths 320, 375, 768 and 1280 pixels in both themes.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBlock: '1rem' }}>
          <ActionButton onClick={() => setModal('confirm')}>Open confirmation</ActionButton>
          <ActionButton onClick={() => setModal('input')}>Open input</ActionButton>
          <ActionButton onClick={() => setModal('double')}>Open two inputs</ActionButton>
        </div>
        <Panel><h2>Shared controls</h2><FieldGroup><Combobox label="Cohort" searchable multiple options={[{id:1,name:'Engineering learners'},{id:2,name:'Placement cohort'}]} value={choice} onChange={setChoice}/></FieldGroup><Switch checked={enabled} onChange={setEnabled} label="Enable practice"/><RichTextEditor value={content} onChange={setContent}/></Panel>
        <Panel><h2>Media and course cards</h2><CourseCard course={{id:1,name:'Programming foundations',category:'Programming',status:'published',progress_percentage:40}} showProgress/><VideoPlayer url=""/><AudioPlayer url=""/><DocumentViewer url=""/></Panel>
        <ActionButton onClick={() => setModal('lesson')}>Open lesson editor</ActionButton><ActionButton onClick={() => setModal('password')}>Open required password setup</ActionButton>
        <DataTable><thead><tr><th>Learner</th><th>Progress</th></tr></thead><tbody><tr><td>Sample learner</td><td>40%</td></tr></tbody></DataTable>
        <div role="status" aria-label="Loading page" className="spinner" />
        <p>The content starts below the header and stays within the viewport. Dialogs must cover both the header and sidebar.</p>
      </section>
      <AssessmentDialogs views={{fullscreenRequired:assessmentModal==='fullscreen-required',fullscreenExit:assessmentModal==='fullscreen-exit',submit:assessmentModal==='submit',segmentSubmit:assessmentModal==='segment-submit',segmentEnd:assessmentModal==='segment-end',closeWarning:assessmentModal==='close-warning',tabSwitch:assessmentModal==='tab-switch'||assessmentModal==='switch-limit'}} total={12} answered={9} time="12:34" segmentName="Core concepts" allowSegmentSwitch={false} switchCount={2} switchLimit={3} limitExceeded={assessmentModal==='switch-limit'} countdown={5} onEnterFullscreen={()=>setAssessmentModal(null)} onStayFullscreen={()=>setAssessmentModal(null)} onExitFullscreen={()=>setAssessmentModal(null)} onCloseSubmit={()=>setAssessmentModal(null)} onSubmit={()=>setAssessmentModal(null)} onCloseSegmentSubmit={()=>setAssessmentModal(null)} onSubmitSegment={()=>setAssessmentModal(null)} onNextSegment={()=>setAssessmentModal(null)} onContinueWindow={()=>setAssessmentModal(null)} onContinueAfterSwitch={()=>setAssessmentModal(null)}/>
      <LessonModal isOpen={modal === 'lesson'} onClose={close} onAdd={close} sectionId={1}/>
      {modal === 'password' && <PasswordSetup userId={1} otp="synthetic" onComplete={close}/>}
      <ConfirmModal isOpen={modal === 'confirm'} onClose={close} onConfirm={close} title="Long confirmation" message={Array.from({ length: 12 }, (_, i) => <p key={i}>Review item {i + 1}: this deliberately long message checks scrolling and button visibility in short viewports.</p>)} />
      <InputModal isOpen={modal === 'input'} onClose={close} onConfirm={close} title="Input preview" label="Name" initialValue="Sample text" />
      <DoubleInputModal isOpen={modal === 'double'} onClose={close} onConfirm={close} title="Two input preview" label1="First value" label2="Second value" />
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(
  <ApiProvider><ThemeProvider><MemoryRouter initialEntries={['/dashboard']}><Preview /></MemoryRouter></ThemeProvider></ApiProvider>
)
