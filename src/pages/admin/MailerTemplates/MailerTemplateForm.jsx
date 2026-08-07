import { useMemo } from 'react'
import ThemedSelect from '../../../components/ThemedSelect/ThemedSelect'
import { TEMPLATE_TYPES, TEMPLATE_FORMATS } from './mailerTemplateConstants'

function MailerTemplateForm({
  formData,
  errors,
  handleChange,
  onSubmit,
  onCancel,
  submitLabel,
  disableUniqueId,
  isSubmitting = false
}) {
  const typeOptions = useMemo(
    () => TEMPLATE_TYPES.map((t) => ({ value: t.value, label: t.label })),
    []
  )
  const formatOptions = useMemo(
    () => TEMPLATE_FORMATS.map((f) => ({ value: f.value, label: f.label })),
    []
  )

  return (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Unique ID *</label>
          <input
            type="text"
            name="unique_id"
            value={formData.unique_id}
            onChange={handleChange}
            className={errors.unique_id ? 'error' : ''}
            placeholder="e.g., COURSE_INVITE"
            disabled={disableUniqueId}
          />
          <small className="form-hint">Use UPPERCASE_WITH_UNDERSCORES</small>
          {errors.unique_id && <span className="error-text">{errors.unique_id}</span>}
        </div>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Course Invitation Email"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Type *</label>
          <ThemedSelect
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`mailer-form-select${errors.type ? ' error' : ''}`}
            options={typeOptions}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., course_invite, welcome"
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <input
            type="number"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief description of when this template is used"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={errors.subject ? 'error' : ''}
            placeholder="You're invited to {{courseName}}!"
          />
          {errors.subject && <span className="error-text">{errors.subject}</span>}
        </div>
        <div className="form-group">
          <label>Preview Text</label>
          <input
            type="text"
            name="preview_text"
            value={formData.preview_text}
            onChange={handleChange}
            placeholder="Shows in inbox preview"
          />
        </div>
      </div>

      <div className="form-group">
        <label>HTML Template {formData.template_format !== 'text' && '*'}</label>
        <textarea
          name="html_template"
          value={formData.html_template}
          onChange={handleChange}
          rows={8}
          className={`code-textarea ${errors.html_template ? 'error' : ''}`}
          placeholder="<html><body>Hello {{userName}}, ...</body></html>"
        />
        {errors.html_template && <span className="error-text">{errors.html_template}</span>}
      </div>

      <div className="form-group">
        <label>Plain Text Template</label>
        <textarea
          name="text_template"
          value={formData.text_template}
          onChange={handleChange}
          rows={4}
          className="code-textarea"
          placeholder="Hello {{userName}}, ..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Template Format</label>
          <ThemedSelect
            name="template_format"
            value={formData.template_format}
            onChange={handleChange}
            className="mailer-form-select"
            options={formatOptions}
          />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="has_dynamic_variables"
              checked={formData.has_dynamic_variables}
              onChange={handleChange}
            />
            Has Dynamic Variables
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
            Active
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Variables (comma-separated)</label>
        <input
          type="text"
          name="variables"
          value={formData.variables}
          onChange={handleChange}
          placeholder="userName, courseName, courseLink, expiryDate"
        />
        <small className="form-hint">Use these in templates as {'{{variableName}}'}</small>
      </div>

      <div className="form-group">
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="welcome, onboarding, course"
        />
      </div>

      <div className="form-section-title">Sender Defaults (Optional)</div>
      <div className="form-row">
        <div className="form-group">
          <label>Sender Name</label>
          <input
            type="text"
            name="default_sender_name"
            value={formData.default_sender_name}
            onChange={handleChange}
            placeholder="CampusZen"
          />
        </div>
        <div className="form-group">
          <label>Sender Email</label>
          <input
            type="email"
            name="default_sender_email"
            value={formData.default_sender_email}
            onChange={handleChange}
            placeholder="noreply@example.com"
          />
        </div>
        <div className="form-group">
          <label>Reply-To</label>
          <input
            type="email"
            name="default_reply_to"
            value={formData.default_reply_to}
            onChange={handleChange}
            placeholder="support@example.com"
          />
        </div>
      </div>

      <div className="form-actions mailer-form-actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {submitLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default MailerTemplateForm
