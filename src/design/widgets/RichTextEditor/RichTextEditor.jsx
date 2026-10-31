import { createViewStyles } from "../../viewStyles";
const styles = createViewStyles("RichTextEditor");
import { useContext, useEffect, useMemo, useRef } from 'react';
import { FieldContext } from '../../FieldContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  disabled = false,
  simple = false
}) {
  const editorRoot = useRef(null);
  const field = useContext(FieldContext);
  const controlId = field?.controlId, labelId = field?.labelId, describedBy = field?.describedBy, invalid = field?.invalid, required = field?.required;
  useEffect(() => {
    const labels = { bold:'Bold', italic:'Italic', underline:'Underline', strike:'Strikethrough', list:'List', align:'Alignment', link:'Insert link', image:'Insert image', clean:'Clear formatting' };
    for (const button of editorRoot.current?.querySelectorAll('.ql-toolbar button') || []) {
      const tool = [...button.classList].find(name => name.startsWith('ql-'))?.slice(3);
      button.setAttribute('aria-label', `${labels[tool] || tool || 'Format'}${button.value ? ' ' + button.value : ''}`);
    }
    const editor = editorRoot.current?.querySelector('.ql-editor');
    if (editor) {
      if (controlId) editor.id = controlId;
      editor.setAttribute('role', 'textbox');
      editor.setAttribute('aria-multiline', 'true');
      editor.setAttribute('aria-invalid', String(Boolean(invalid)));
      editor.setAttribute('aria-required', String(Boolean(required)));
      if (labelId) { editor.setAttribute('aria-labelledby', labelId); editor.removeAttribute('aria-label'); }
      else editor.setAttribute('aria-label', 'Rich text content');
      if (describedBy) editor.setAttribute('aria-describedby', describedBy); else editor.removeAttribute('aria-describedby');
    }
    for (const picker of editorRoot.current?.querySelectorAll('.ql-picker-label') || []) {
      picker.setAttribute('aria-label', picker.parentElement.classList.contains('ql-header') ? 'Text style' : 'Text alignment');
    }
  }, [simple, controlId, labelId, describedBy, invalid, required]);
  const modules = useMemo(() => {
    if (simple) {
      return {
        toolbar: [['bold', 'italic', 'underline'], [{
          list: 'ordered'
        }, {
          list: 'bullet'
        }], ['link']]
      };
    }
    return {
      toolbar: [[{
        header: [1, 2, 3, false]
      }], ['bold', 'italic', 'underline', 'strike'], [{
        list: 'ordered'
      }, {
        list: 'bullet'
      }], [{
        align: []
      }], ['link', 'image'], ['clean']]
    };
  }, [simple]);
  const formats = useMemo(() => ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'align', 'link', 'image'], []);
  return <div ref={editorRoot} className={`${styles.editor} ${disabled ? styles.disabled : ''}`}>
      <ReactQuill theme="snow" value={value} onChange={content => onChange?.(content)} placeholder={placeholder} readOnly={disabled} modules={modules} formats={formats} style={{
      minHeight
    }} />
    </div>;
}
export default RichTextEditor;
