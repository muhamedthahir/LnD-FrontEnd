# UI rebuild coverage

All 53 page modules and 21 shared components were replaced with the new presentation layer. Original routes and business logic remain connected. Browser verification and its limits are recorded in UI_REBUILD_VERIFICATION_2026-10.md; source migration alone is not visual acceptance.

## Pages and nested views

| Source | Rebuild deliverable | Status |
| --- | --- | --- |
| `src/features/admin/assessments/AssessmentAdministration/AssessmentAdministration.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/assessments/AssessmentConfigurations/AssessmentConfigurations.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/assessments/AssessmentCreate/AssessmentCreate.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/assessments/AssessmentEdit/AssessmentEdit.jsx` | Assessment segment builder and question selection | Implemented |
| `src/features/admin/assessments/AssessmentManagement/AssessmentManagement.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/assessments/AssessmentResult/AssessmentResult.jsx` | Metrics, structured report, accessible chart/table detail | Implemented |
| `src/features/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx` | Enrollment table, user picker, extend-time/confirmation flows | Implemented |
| `src/features/admin/assessments/ConfigurationCreate/ConfigurationCreate.jsx` | Configuration wizard with summary, timing/proctoring/scoring/access steps | Implemented |
| `src/features/admin/assessments/ConfigurationsList/ConfigurationsList.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/courses/CourseAdministrations/CourseAdministrations.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx` | Metrics, structured report, accessible chart/table detail | Implemented |
| `src/features/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx` | Curriculum builder and lesson editor | Implemented |
| `src/features/admin/courses/CoursesManagement/CoursesManagement.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/Groups/CreateGroup/CreateGroup.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/Groups/Groups.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/Institutions/CreateInstitution/CreateInstitution.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/Institutions/Institutions.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/MailerTemplates/MailerTemplateDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/MailerTemplates/MailerTemplateForm.jsx` | Template composition form, preview, validation | Implemented |
| `src/features/admin/MailerTemplates/MailerTemplates.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/Questions/QuestionBankDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/Questions/QuestionBankForm.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/Questions/QuestionBanks.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/Questions/QuestionDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/Questions/QuestionForm.jsx` | MCQ/programming authoring, preview, bulk import | Implemented |
| `src/features/admin/Questions/QuestionList.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/admin/Questions/TestCaseManager.jsx` | Test-case table/editor and import wizard | Implemented |
| `src/features/admin/Settings/Settings.jsx` | Settings categories, master-data editor and delete confirmation | Implemented |
| `src/features/admin/Users/BulkResetModal.jsx` | Group impact/password confirmation dialog | Implemented |
| `src/features/admin/Users/CreateUser/CreateUser.jsx` | New sectioned create/edit form and validation/saving states | Implemented |
| `src/features/admin/Users/UserDetail/UserDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/admin/Users/Users.jsx` | User directory and every edit/reset/delete/import state | Implemented |
| `src/features/CodeEditor/CodeEditor.jsx` | Resizable code/problem/files/console workspace | Implemented |
| `src/features/CodeEditor/CodeEditorLayout.jsx` | Resizable code/problem/files/console workspace | Implemented |
| `src/features/Login/Login.jsx` | Authentication/recovery layout and error states | Implemented |
| `src/features/PersonalDetails/PersonalDetails.jsx` | New detail workspace, contextual actions, editing and failure states | Implemented |
| `src/features/Playground/Playground.jsx` | Resizable code/problem/files/console workspace | Implemented |
| `src/features/ResetPassword/ResetPassword.jsx` | Authentication/recovery layout and error states | Implemented |
| `src/features/user/Assessments/AssessmentResults/AssessmentResults.jsx` | Metrics, structured report, accessible chart/table detail | Implemented |
| `src/features/user/Assessments/Assessments.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/user/Assessments/AssessmentStart/AssessmentStart.jsx` | Readiness/instructions/permissions/start flow | Implemented |
| `src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx` | Secure assessment workspace, timer/save/question navigation, all proctoring dialogs | Implemented |
| `src/features/user/Courses/CourseAssessment/CourseAssessment.jsx` | Test instructions, answers, navigation, submission, results | Implemented |
| `src/features/user/Courses/CourseOverview/CourseOverview.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/user/Courses/CurrentCourse/CurrentCourse.jsx` | Curriculum and lesson player with responsive pane controls | Implemented |
| `src/features/user/Courses/PracticeExercise/PracticeExercise.jsx` | Practice question/editor/results workspace | Implemented |
| `src/features/user/Courses/UserCourses/UserCourses.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Implemented |
| `src/features/user/Dashboard/Dashboard.jsx` | Role-specific next-action dashboard | Implemented |
| `src/features/user/Quiz/Quiz.jsx` | Test instructions, answers, navigation, submission, results | Implemented |

## Shared components

| Existing source | Replacement | Status |
| --- | --- | --- |
| `src/components/Button/Button.jsx` | Button/IconButton variants | Implemented |
| `src/components/ConfirmModal/ConfirmModal.jsx` | AlertDialog | Implemented |
| `src/components/CourseCard/CourseCard.jsx` | CourseCard with structured metadata and next action | Implemented |
| `src/components/DoubleInputModal/DoubleInputModal.jsx` | Dialog + composed fields | Implemented |
| `src/components/Dropdown/Dropdown.jsx` | Popover/Menu with keyboard behavior | Implemented |
| `src/components/Header/Header.jsx` | TopBar + breadcrumbs/account menu | Implemented |
| `src/components/InputModal/InputModal.jsx` | Dialog + Field | Implemented |
| `src/components/Layout/Layout.jsx` | Administration/Student AppShell | Implemented |
| `src/components/LessonModal/LessonModal.jsx` | Lesson editor workspace and nested media dialogs | Implemented |
| `src/components/MediaPlayer/AudioPlayer.jsx` | Accessible audio controls | Implemented |
| `src/components/MediaPlayer/DocumentViewer.jsx` | Document toolbar/reader/zoom | Implemented |
| `src/components/MediaPlayer/VideoPlayer.jsx` | Accessible video controls | Implemented |
| `src/components/Pagination/Pagination.jsx` | Pagination + page-size control | Implemented |
| `src/components/PasswordSetup/PasswordSetup.jsx` | AuthPanel + PasswordField | Implemented |
| `src/components/RichTextEditor/RichTextEditor.jsx` | RichContentEditor | Implemented |
| `src/components/SecureLayout/SecureLayout.jsx` | SecureAssessmentShell | Implemented |
| `src/components/Sidebar/Sidebar.jsx` | RoleNavigation + mobile drawer | Implemented |
| `src/components/Table/Table.jsx` | DataTable | Implemented |
| `src/components/ThemedSelect/ThemedSelect.jsx` | Select/Combobox | Implemented |
| `src/components/ThemeToggle/ThemeToggle.jsx` | ThemeSwitch | Implemented |
| `src/components/Toggle/Toggle.jsx` | Switch | Implemented |

## Modal and transient state owners

Include inline `.modal-*` surfaces, dialogs not named Modal, dropdowns, popovers, tooltips, feedback and session-expiry surfaces. This source-based list is a starting checklist; runtime interaction must discover conditional variants.

| Owner | State identifiers / surfaces | Status |
| --- | --- | --- |
| `src/features/admin/assessments/AssessmentEdit/AssessmentEdit.jsx` | showPublishConfirm, showQuestionModal, showSegmentModal, editingSegment | Implemented |
| `src/features/admin/assessments/AssessmentResult/AssessmentResult.jsx` | codeModalData | Implemented |
| `src/features/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx` | showAddSection, confirmLoading, extendLoading, openExtendModal, openConfirmModal | Implemented |
| `src/features/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx` | isEditing, showDeleteConfirm, showForceExpireConfirm, userToExpire | Implemented |
| `src/features/admin/courses/CourseAdministrations/CourseAdministrations.jsx` | showCreateModal, editingAdministration | Implemented |
| `src/features/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx` | codeModalData | Implemented |
| `src/features/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx` | showSectionForm, editingSection, editMode, showLessonModal, editingLesson, showDeleteConfirm, lessonToDelete, sectionIdForDelete, showDeleteSectionConfirm, sectionToDelete | Implemented |
| `src/features/admin/courses/CoursesManagement/CoursesManagement.jsx` | showCreateModal, showNewCategoryInput | Implemented |
| `src/features/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx` | showSegmentForm, editingSegment | Implemented |
| `src/features/admin/Groups/Groups.jsx` | showDeleteModal, groupToDelete | Implemented |
| `src/features/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx` | isEditing | Implemented |
| `src/features/admin/MailerTemplates/MailerTemplates.jsx` | showForm, showPreviewModal, previewTemplate, renderedPreview | Implemented |
| `src/features/admin/Questions/QuestionForm.jsx` | showBulkUploadModal, openBulkUploadModal | Implemented |
| `src/features/admin/Questions/TestCaseManager.jsx` | showForm, editingTestCase, showBulkUploadModal, openBulkUploadModal | Implemented |
| `src/features/admin/Settings/Settings.jsx` | showModal, showDeleteModal, selectedItem, isEditing | Implemented |
| `src/features/admin/Users/BulkResetModal.jsx` | Shared dialog / conditional overlay | Implemented |
| `src/features/admin/Users/UserDetail/UserDetail.jsx` | showEditModal, showResetModal | Implemented |
| `src/features/admin/Users/Users.jsx` | showForm, showBulkUploadModal, showEditModal, showResetModal, showBulkResetModal, showDeleteModal, userToDelete, deleteError | Implemented |
| `src/features/Login/Login.jsx` | showPassword, showForgotPasswordModal | Implemented |
| `src/features/Playground/Playground.jsx` | consoleOpen | Implemented |
| `src/features/user/Assessments/AssessmentResults/AssessmentResults.jsx` | showFeedbackModal, feedbackSubmitted | Implemented |
| `src/features/user/Assessments/AssessmentStart/AssessmentStart.jsx` | showAccessCodeInput | Implemented |
| `src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx` | showQuestionNav, showSubmitModal, showSegmentEndModal, showSegmentSubmitModal, showCloseWarning, showFullscreenExitModal, showFullscreenRequiredModal, showTabSwitchModal | Implemented |
| `src/features/user/Quiz/Quiz.jsx` | showConfirmModal | Implemented |
| `src/components/ConfirmModal/ConfirmModal.jsx` | Shared dialog / conditional overlay | Implemented |
| `src/components/DoubleInputModal/DoubleInputModal.jsx` | Shared dialog / conditional overlay | Implemented |
| `src/components/Dropdown/Dropdown.jsx` | isOpen | Implemented |
| `src/components/Header/Header.jsx` | showUserMenu | Implemented |
| `src/components/InputModal/InputModal.jsx` | Shared dialog / conditional overlay | Implemented |
| `src/components/Layout/Layout.jsx` | isSidebarOpen | Implemented |
| `src/components/LessonModal/LessonModal.jsx` | showTextColorPicker, showBgColorPicker, localMediaPreviewUrl, showLinkModal, showImageModal, showVideoModal | Implemented |
| `src/components/ThemedSelect/ThemedSelect.jsx` | open | Implemented |

## Routes, including aliases and redirects

- `/` — preserve navigation/authorization and map to rebuilt view.
- `/login` — preserve navigation/authorization and map to rebuilt view.
- `/reset-password` — preserve navigation/authorization and map to rebuilt view.
- `/codeeditor` — preserve navigation/authorization and map to rebuilt view.
- `/playground` — preserve navigation/authorization and map to rebuilt view.
- `/playground/share/:shareId` — preserve navigation/authorization and map to rebuilt view.
- `/secure/assessment/:mappingId/take` — preserve navigation/authorization and map to rebuilt view.
- `/dashboard` — preserve navigation/authorization and map to rebuilt view.
- `/personal-details` — preserve navigation/authorization and map to rebuilt view.
- `/courses` — preserve navigation/authorization and map to rebuilt view.
- `/courses/user-courses` — preserve navigation/authorization and map to rebuilt view.
- `/courses/:id` — preserve navigation/authorization and map to rebuilt view.
- `/courses/:id/current` — preserve navigation/authorization and map to rebuilt view.
- `/courses/:courseId/practice/:practiceId` — preserve navigation/authorization and map to rebuilt view.
- `/courses/:courseId/quiz/:practiceId` — preserve navigation/authorization and map to rebuilt view.
- `/courses/:courseId/assessment/:segmentId` — preserve navigation/authorization and map to rebuilt view.
- `/assessments` — preserve navigation/authorization and map to rebuilt view.
- `/user/assessments` — preserve navigation/authorization and map to rebuilt view.
- `/user/assessments/:mappingId/start` — preserve navigation/authorization and map to rebuilt view.
- `/user/assessments/:mappingId/take` — preserve navigation/authorization and map to rebuilt view.
- `/user/assessments/:mappingId/results` — preserve navigation/authorization and map to rebuilt view.
- `/admin/institutions` — preserve navigation/authorization and map to rebuilt view.
- `CREATE_INSTITUTION_ROUTE` — preserve navigation/authorization and map to rebuilt view.
- `/admin/institutions/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/mailer-templates/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/mailer-templates/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/mailer-templates` — preserve navigation/authorization and map to rebuilt view.
- `/admin/settings` — preserve navigation/authorization and map to rebuilt view.
- `/admin/users` — preserve navigation/authorization and map to rebuilt view.
- `/admin/users/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/users/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/management` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/configurations` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/:id/configurations` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/:id/configurations/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/administrations` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/administrators/:adminId/users` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/results/:mappingId` — preserve navigation/authorization and map to rebuilt view.
- `/admin/assessments/progress/:mappingId` — preserve navigation/authorization and map to rebuilt view.
- `/admin/groups` — preserve navigation/authorization and map to rebuilt view.
- `/admin/groups/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/groups/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/management` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/management/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/:courseId/topics/:topicId/practice` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/administrations` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/administrations/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/administrations/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/courses/administrations/:id/users/:userId/progress` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/banks` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/banks/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/banks/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/banks/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/list` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/list/create` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/list/:id` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/list/:id/edit` — preserve navigation/authorization and map to rebuilt view.
- `/admin/questions/list/:id/testcases` — preserve navigation/authorization and map to rebuilt view.
