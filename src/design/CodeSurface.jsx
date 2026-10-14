import Editor from '@monaco-editor/react';
import {useEffect,useRef} from 'react';
import {useTheme} from '../contexts/ThemeContext';
function applyTheme(monaco, theme) {
  const styles=getComputedStyle(document.documentElement);
  const color=token=>styles.getPropertyValue(token).trim();
  const text=color('--text-primary'),muted=color('--text-secondary'),accent=color('--accent-primary');
  monaco.editor.defineTheme('campuszen',{
    base:theme==='dark'?'vs-dark':'vs',inherit:false,
    rules:[{token:'',foreground:text.slice(1)},{token:'comment',foreground:muted.slice(1)},{token:'keyword',foreground:accent.slice(1)},{token:'string',foreground:color('--success').slice(1)},{token:'number',foreground:color('--brand-orange').slice(1)},{token:'delimiter',foreground:text.slice(1)}],
    colors:{'editor.background':color('--bg-input'),'editor.foreground':text,'editorLineNumber.foreground':muted,'editorLineNumber.activeForeground':accent,'editorCursor.foreground':accent,'editor.selectionBackground':accent+'35','editor.lineHighlightBackground':color('--bg-secondary'),'editorWidget.background':color('--bg-card'),'editorWidget.foreground':text,'editorWidget.border':color('--border-color'),'input.background':color('--bg-input'),'input.foreground':text,'input.border':color('--border-color'),'editorError.foreground':color('--error')}
  });
  monaco.editor.setTheme('campuszen');
}
export default function CodeSurface({onMount,beforeMount,...props}) {
  const {theme}=useTheme();const instance=useRef(null);
  useEffect(()=>{queueMicrotask(()=>{if(instance.current)applyTheme(instance.current,theme);});},[theme]);
  return <Editor {...props} theme="campuszen" beforeMount={monaco=>{applyTheme(monaco,theme);beforeMount?.(monaco);}} onMount={(editor,monaco)=>{instance.current=monaco;applyTheme(monaco,theme);onMount?.(editor,monaco);}}/>;
}
