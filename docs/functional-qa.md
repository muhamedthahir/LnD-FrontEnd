# Functional QA checkpoint — 15 October 2026

Browser checks used the real local backend and an isolated MySQL database containing synthetic records. Email was captured locally. No production records were changed.

Verified workflows:

- All seven settings catalogs: create, edit, validation, visibility and deletion of disposable entries.
- Institutions: create, rename, deactivate/reactivate and associated administrator.
- Users and groups: create/edit, membership transfer, required validation, degree persistence and approved QA deletion.
- MCQ, multi-select, question banks and programming questions: creation, editing, bank navigation, options, limits, test-case toggles and approved test-case deletion.
- Courses: sections, text lessons, tags, sequential setting, publication, delivery creation, invitations, enrollment and completion.
- Assessments: segments, question assignment, bulk marks, configuration, activation, invitation, start/resume, answer save, submission, released results and feedback.
- Learner and admin assessment results agree at 100%, 5/5. Attempts group under one user in pagination.
- Practice: add/remove questions, edit segment, submit a question reused from an assessment, and complete the course at 100%.
- Profile validation and persistence; college-admin institution scoping; student redirect from admin routes.
- Email templates: create/edit, variable persistence, preview, activation and approved QA deletion.

Automated checks: 86 backend tests and 23 frontend tests; production Vite build. Course delivery time conversion has a regression check across three timezones.

Remaining external coverage: separate secure popup, external mail delivery, S3 media upload, remote programming execution and credential entry. These have not been proven by the local checks. This checkpoint is not a claim that every browser/device combination or every feature permutation has been tested.
