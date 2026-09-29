import { API_ENDPOINTS, VALIDATION_MESSAGES } from '../../../constants/constants.js'

export const CREATE_INSTITUTION_ROUTE = '/admin/institutions/create'
export const INSTITUTIONS_LIST_ROUTE = '/admin/institutions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyCreateInstitutionForm() {
  return {
    name: '',
    admin_name: '',
    admin_email: '',
    address: '',
    spoc_contact_number: '',
    alternate_contact: '',
    alternate_email: '',
    status: 'active'
  }
}

export function validateCreateInstitutionForm(formData = {}) {
  const errors = {}

  if (!formData.name || !formData.name.trim()) {
    errors.name = VALIDATION_MESSAGES.INSTITUTION_NAME_REQUIRED
  }
  if (!formData.admin_name || !formData.admin_name.trim()) {
    errors.admin_name = VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED
  }
  if (!formData.admin_email || !formData.admin_email.trim()) {
    errors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_REQUIRED
  } else if (!EMAIL_RE.test(formData.admin_email)) {
    errors.admin_email = VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_INVALID
  }
  if (formData.alternate_email?.trim() && !EMAIL_RE.test(formData.alternate_email.trim())) {
    errors.alternate_email = VALIDATION_MESSAGES.INSTITUTION_ALTERNATE_EMAIL_INVALID
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  }
}

export function buildCreateInstitutionPayload(formData = {}) {
  const trimOrNull = (value) => {
    if (value == null) return null
    const text = String(value).trim()
    return text ? text : null
  }

  return {
    name: String(formData.name || '').trim(),
    admin_name: String(formData.admin_name || '').trim(),
    admin_email: String(formData.admin_email || '').trim(),
    address: trimOrNull(formData.address),
    spoc_contact_number: trimOrNull(formData.spoc_contact_number),
    alternate_contact: trimOrNull(formData.alternate_contact),
    alternate_email: trimOrNull(formData.alternate_email),
    status: formData.status === 'inactive' ? 'inactive' : 'active'
  }
}

export function getCreateInstitutionRequest(apiBaseUrl, formData) {
  return {
    url: `${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.CREATE}`,
    method: 'POST',
    body: buildCreateInstitutionPayload(formData)
  }
}
