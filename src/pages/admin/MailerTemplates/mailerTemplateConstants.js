export const TEMPLATE_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'notification', label: 'Notification' },
  { value: 'reminder', label: 'Reminder' }
]

export const TEMPLATE_FORMATS = [
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Plain Text' },
  { value: 'both', label: 'Both' }
]

export const emptyFormState = () => ({
  unique_id: '',
  name: '',
  description: '',
  type: 'transactional',
  category: '',
  subject: '',
  preview_text: '',
  html_template: '',
  text_template: '',
  template_format: 'html',
  has_dynamic_variables: false,
  variables: '',
  default_sender_name: '',
  default_sender_email: '',
  default_reply_to: '',
  is_active: true,
  priority: 0,
  tags: ''
})

export function validateMailerTemplateForm(formData) {
  const newErrors = {}
  if (!formData.unique_id?.trim()) {
    newErrors.unique_id = 'Unique ID is required'
  } else if (!/^[A-Z0-9_]+$/.test(formData.unique_id)) {
    newErrors.unique_id = 'Use uppercase letters, numbers, and underscores only'
  }
  if (!formData.name?.trim()) newErrors.name = 'Name is required'
  if (!formData.type) newErrors.type = 'Type is required'
  if (!formData.subject?.trim()) newErrors.subject = 'Subject is required'
  if (!formData.html_template?.trim() && !formData.text_template?.trim()) {
    newErrors.html_template = 'At least one template (HTML or Text) is required'
  }
  return newErrors
}

export function templateToFormData(template) {
  if (!template) return emptyFormState()
  return {
    unique_id: template.unique_id || '',
    name: template.name || '',
    description: template.description || '',
    type: template.type || 'transactional',
    category: template.category || '',
    subject: template.subject || '',
    preview_text: template.preview_text || '',
    html_template: template.html_template || '',
    text_template: template.text_template || '',
    template_format: template.template_format || 'html',
    has_dynamic_variables: template.has_dynamic_variables || false,
    variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
    default_sender_name: template.default_sender_name || '',
    default_sender_email: template.default_sender_email || '',
    default_reply_to: template.default_reply_to || '',
    is_active: template.is_active ?? true,
    priority: template.priority || 0,
    tags: Array.isArray(template.tags) ? template.tags.join(', ') : ''
  }
}
