export function validateBulkReset({ group, password, confirmation }) {
  if (!group) return 'Select a group.'
  if (Number(group.member_count) < 1) return 'This group has no users to reset.'
  if (password.length < 6) return 'Use a password with at least 6 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'This password is too long. Use no more than 72 UTF-8 bytes.'
  if (password !== confirmation) return 'Passwords do not match.'
  return ''
}
