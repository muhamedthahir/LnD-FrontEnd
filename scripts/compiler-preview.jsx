// Isolated UI fixture. Execution is simulated; no assessment or production APIs.
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from '../src/contexts/ThemeContext';
import {ApiProvider} from '../src/contexts/ApiContext';
import CodeEditor from '../src/features/CodeEditor/CodeEditor';
import ThemeSwitch from '../src/design/ThemeSwitch';
import '../src/index.css';
const originalFetch = window.fetch.bind(window);
window.fetch = (input, options) => {
  const url = String(input);
  if (url.includes('/config.')) return Promise.resolve(Response.json({BACKEND_URL:'http://127.0.0.1:5182'}));
  if (url.includes('/api/codeExecute')) return Promise.resolve(Response.json({run:{stdout:'3\n',stderr:'',code:0}}));
  if (url.includes('/history')) return Promise.resolve(Response.json({history:[]}));
  return originalFetch(input, options);
};
createRoot(document.getElementById('root')).render(<ThemeProvider><ApiProvider><div className="cz-page" data-view="AssessmentTake"><div className="cz-context-bar cz-toolbar"><strong>Programming assessment · UI fixture</strong><ThemeSwitch/></div><div className="czv-AssessmentTake-programmingQuestion"><section className="czv-AssessmentTake-problemPanel"><h2>Add two numbers</h2><p>Read two integers and print their sum.</p><h3>Input</h3><pre>1 2</pre><h3>Expected output</h3><pre>3</pre><p>Use Run code for custom input, Test samples to check your solution, and Submit code when ready.</p></section><CodeEditor questionId="compiler-preview" initialCode={'a, b = map(int, input().split())\nprint(a + b)'} initialLanguage="python" assessmentMode allowedLanguages={[{id:2,name:'Python'},{id:1,name:'JavaScript'}]} testCases={[{id:1,input:'1 2',expected_output:'3'}]} onSaveCode={async()=>{}} onSubmit={async()=>({success:true})}/></div></div></ApiProvider></ThemeProvider>);
