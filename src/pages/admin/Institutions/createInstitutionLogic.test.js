import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { VALIDATION_MESSAGES } from '../../../constants/constants.js'
import {
  CREATE_INSTITUTION_ROUTE,
  INSTITUTIONS_LIST_ROUTE,
  emptyCreateInstitutionForm,
  validateCreateInstitutionForm,
  buildCreateInstitutionPayload,
  getCreateInstitutionRequest
} from './createInstitutionLogic.js'

describe('institution create UI logic', () => {
  test('uses a dedicated create screen instead of the list page', () => {
    assert.equal(CREATE_INSTITUTION_ROUTE, '/admin/institutions/create')
    assert.notEqual(CREATE_INSTITUTION_ROUTE, INSTITUTIONS_LIST_ROUTE)
  })

  test('blocks submit when required fields are empty', () => {
    const { ok, errors } = validateCreateInstitutionForm(emptyCreateInstitutionForm())
    assert.equal(ok, false)
    assert.equal(errors.name, VALIDATION_MESSAGES.INSTITUTION_NAME_REQUIRED)
    assert.equal(errors.admin_name, VALIDATION_MESSAGES.INSTITUTION_ADMIN_NAME_REQUIRED)
    assert.equal(errors.admin_email, VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_REQUIRED)
  })

  test('blocks submit when admin email is invalid', () => {
    const { ok, errors } = validateCreateInstitutionForm({
      ...emptyCreateInstitutionForm(),
      name: 'CampusZen-Learning',
      admin_name: 'Janarthanan P',
      admin_email: 'not-valid'
    })
    assert.equal(ok, false)
    assert.equal(errors.admin_email, VALIDATION_MESSAGES.INSTITUTION_ADMIN_EMAIL_INVALID)
  })

  test('builds the same payload the UI posts to the backend, including address', () => {
    const formData = {
      name: 'CampusZen-Learning',
      admin_name: 'Janarthanan P',
      admin_email: 'janarthanan12102005@gmail.com',
      address: 'Namakkal',
      spoc_contact_number: '+917092423672',
      alternate_contact: '',
      alternate_email: 'janarthanan12102005@gmail.com',
      status: 'active'
    }

    const payload = buildCreateInstitutionPayload(formData)
    assert.equal(payload.address, 'Namakkal')
    assert.equal(payload.alternate_contact, null)
    assert.equal(payload.status, 'active')

    const request = getCreateInstitutionRequest('https://api.campuszen.in', formData)
    assert.equal(request.method, 'POST')
    assert.equal(request.url, 'https://api.campuszen.in/api/institutions')
    assert.deepEqual(request.body, payload)
  })

  test('UI payload matches backend create contract', () => {
    const payload = buildCreateInstitutionPayload({
      name: 'SPR',
      admin_name: 'College Admin',
      admin_email: 'admin@spr.edu',
      address: 'Chennai',
      spoc_contact_number: '9999999999',
      alternate_contact: '',
      alternate_email: '',
      status: 'inactive'
    })

    assert.deepEqual(Object.keys(payload).sort(), [
      'address',
      'admin_email',
      'admin_name',
      'alternate_contact',
      'alternate_email',
      'name',
      'spoc_contact_number',
      'status'
    ].sort())
    assert.equal(payload.status, 'inactive')
    assert.equal(payload.address, 'Chennai')
  })
})
