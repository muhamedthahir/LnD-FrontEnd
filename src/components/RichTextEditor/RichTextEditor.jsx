import { useMemo } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import styles from './RichTextEditor.module.css'

function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  disabled = false,
  simple = false
}) {
  const modules = useMemo(() => {
    if (simple) {
      return {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link']
        ]
      }
    }
    return {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  }, [simple])

  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'align',
      'link',
      'image'
    ],
    []
  )

  return (
    <div className={`${styles.editor} ${disabled ? styles.disabled : ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(content) => onChange?.(content)}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        formats={formats}
        style={{ minHeight }}
      />
    </div>
  )
}

export default RichTextEditor




