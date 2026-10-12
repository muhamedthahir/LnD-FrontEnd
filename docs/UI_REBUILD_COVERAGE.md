# UI rebuild coverage

Source inventory completed October 12, 2026. Every row below must get a new view and recorded browser verification; the current status is planned. Automated source inspection is not visual acceptance.

## Pages and nested views

| Source | Rebuild deliverable | Status |
| --- | --- | --- |
| `src/pages/admin/assessments/AssessmentAdministration/AssessmentAdministration.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/assessments/AssessmentConfigurations/AssessmentConfigurations.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/assessments/AssessmentCreate/AssessmentCreate.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/assessments/AssessmentEdit/AssessmentEdit.jsx` | Assessment segment builder and question selection | Planned |
| `src/pages/admin/assessments/AssessmentManagement/AssessmentManagement.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/assessments/AssessmentResult/AssessmentResult.jsx` | Metrics, structured report, accessible chart/table detail | Planned |
| `src/pages/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx` | Enrollment table, user picker, extend-time/confirmation flows | Planned |
| `src/pages/admin/assessments/ConfigurationCreate/ConfigurationCreate.jsx` | Configuration wizard with summary, timing/proctoring/scoring/access steps | Planned |
| `src/pages/admin/assessments/ConfigurationsList/ConfigurationsList.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/courses/CourseAdministrations/CourseAdministrations.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx` | Metrics, structured report, accessible chart/table detail | Planned |
| `src/pages/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx` | Curriculum builder and lesson editor | Planned |
| `src/pages/admin/courses/CoursesManagement/CoursesManagement.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/Groups/CreateGroup/CreateGroup.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/Groups/Groups.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/Institutions/CreateInstitution/CreateInstitution.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/Institutions/Institutions.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/MailerTemplates/MailerTemplateDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/MailerTemplates/MailerTemplateForm.jsx` | Template composition form, preview, validation | Planned |
| `src/pages/admin/MailerTemplates/MailerTemplates.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/Questions/QuestionBankDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/Questions/QuestionBankForm.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/Questions/QuestionBanks.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/Questions/QuestionDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/Questions/QuestionForm.jsx` | MCQ/programming authoring, preview, bulk import | Planned |
| `src/pages/admin/Questions/QuestionList.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/admin/Questions/TestCaseManager.jsx` | Test-case table/editor and import wizard | Planned |
| `src/pages/admin/Settings/Settings.jsx` | Settings categories, master-data editor and delete confirmation | Planned |
| `src/pages/admin/Users/BulkResetModal.jsx` | Group impact/password confirmation dialog | Planned |
| `src/pages/admin/Users/CreateUser/CreateUser.jsx` | New sectioned create/edit form and validation/saving states | Planned |
| `src/pages/admin/Users/UserDetail/UserDetail.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/admin/Users/Users.jsx` | User directory and every edit/reset/delete/import state | Planned |
| `src/pages/CodeEditor/CodeEditor.jsx` | Resizable code/problem/files/console workspace | Planned |
| `src/pages/CodeEditor/CodeEditorLayout.jsx` | Resizable code/problem/files/console workspace | Planned |
| `src/pages/Login/Login.jsx` | Authentication/recovery layout and error states | Planned |
| `src/pages/PersonalDetails/PersonalDetails.jsx` | New detail workspace, contextual actions, editing and failure states | Planned |
| `src/pages/Playground/Playground.jsx` | Resizable code/problem/files/console workspace | Planned |
| `src/pages/ResetPassword/ResetPassword.jsx` | Authentication/recovery layout and error states | Planned |
| `src/pages/user/Assessments/AssessmentResults/AssessmentResults.jsx` | Metrics, structured report, accessible chart/table detail | Planned |
| `src/pages/user/Assessments/Assessments.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/user/Assessments/AssessmentStart/AssessmentStart.jsx` | Readiness/instructions/permissions/start flow | Planned |
| `src/pages/user/Assessments/AssessmentTake/AssessmentTake.jsx` | Secure assessment workspace, timer/save/question navigation, all proctoring dialogs | Planned |
| `src/pages/user/Courses/CourseAssessment/CourseAssessment.jsx` | Test instructions, answers, navigation, submission, results | Planned |
| `src/pages/user/Courses/CourseOverview/CourseOverview.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/user/Courses/CurrentCourse/CurrentCourse.jsx` | Curriculum and lesson player with responsive pane controls | Planned |
| `src/pages/user/Courses/PracticeExercise/PracticeExercise.jsx` | Practice question/editor/results workspace | Planned |
| `src/pages/user/Courses/UserCourses/UserCourses.jsx` | New feature list/detail presentation, filters, empty/loading/error states | Planned |
| `src/pages/user/Dashboard/Dashboard.jsx` | Role-specific next-action dashboard | Planned |
| `src/pages/user/Quiz/Quiz.jsx` | Test instructions, answers, navigation, submission, results | Planned |

## Shared components

| Existing source | Replacement | Status |
| --- | --- | --- |
| `src/components/Button/Button.jsx` | Button/IconButton variants | Planned |
| `src/components/ConfirmModal/ConfirmModal.jsx` | AlertDialog | Planned |
| `src/components/CourseCard/CourseCard.jsx` | CourseCard with structured metadata and next action | Planned |
| `src/components/DoubleInputModal/DoubleInputModal.jsx` | Dialog + composed fields | Planned |
| `src/components/Dropdown/Dropdown.jsx` | Popover/Menu with keyboard behavior | Planned |
| `src/components/Header/Header.jsx` | TopBar + breadcrumbs/account menu | Planned |
| `src/components/InputModal/InputModal.jsx` | Dialog + Field | Planned |
| `src/components/Layout/Layout.jsx` | Administration/Student AppShell | Planned |
| `src/components/LessonModal/LessonModal.jsx` | Lesson editor workspace and nested media dialogs | Planned |
| `src/components/MediaPlayer/AudioPlayer.jsx` | Accessible audio controls | Planned |
| `src/components/MediaPlayer/DocumentViewer.jsx` | Document toolbar/reader/zoom | Planned |
| `src/components/MediaPlayer/VideoPlayer.jsx` | Accessible video controls | Planned |
| `src/components/Pagination/Pagination.jsx` | Pagination + page-size control | Planned |
| `src/components/PasswordSetup/PasswordSetup.jsx` | AuthPanel + PasswordField | Planned |
| `src/components/RichTextEditor/RichTextEditor.jsx` | RichContentEditor | Planned |
| `src/components/SecureLayout/SecureLayout.jsx` | SecureAssessmentShell | Planned |
| `src/components/Sidebar/Sidebar.jsx` | RoleNavigation + mobile drawer | Planned |
| `src/components/Table/Table.jsx` | DataTable | Planned |
| `src/components/ThemedSelect/ThemedSelect.jsx` | Select/Combobox | Planned |
| `src/components/ThemeToggle/ThemeToggle.jsx` | ThemeSwitch | Planned |
| `src/components/Toggle/Toggle.jsx` | Switch | Planned |

## Modal and transient state owners

Include inline `.modal-*` surfaces, dialogs not named Modal, dropdowns, popovers, tooltips, feedback and session-expiry surfaces. This source-based list is a starting checklist; runtime interaction must discover conditional variants.

| Owner | State identifiers / surfaces | Status |
| --- | --- | --- |
| `src/pages/admin/assessments/AssessmentEdit/AssessmentEdit.jsx` | showPublishConfirm, showQuestionModal, showSegmentModal, editingSegment | Planned |
| `src/pages/admin/assessments/AssessmentResult/AssessmentResult.jsx` | codeModalData | Planned |
| `src/pages/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx` | showAddSection, confirmLoading, extendLoading, openExtendModal, openConfirmModal | Planned |
| `src/pages/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx` | isEditing, showDeleteConfirm, showForceExpireConfirm, userToExpire | Planned |
| `src/pages/admin/courses/CourseAdministrations/CourseAdministrations.jsx` | showCreateModal, editingAdministration | Planned |
| `src/pages/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx` | codeModalData | Planned |
| `src/pages/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx` | showSectionForm, editingSection, editMode, showLessonModal, editingLesson, showDeleteConfirm, lessonToDelete, sectionIdForDelete, showDeleteSectionConfirm, sectionToDelete | Planned |
| `src/pages/admin/courses/CoursesManagement/CoursesManagement.jsx` | showCreateModal, showNewCategoryInput | Planned |
| `src/pages/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx` | showSegmentForm, editingSegment | Planned |
| `src/pages/admin/Groups/Groups.jsx` | showDeleteModal, groupToDelete | Planned |
| `src/pages/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx` | isEditing | Planned |
| `src/pages/admin/MailerTemplates/MailerTemplates.jsx` | showForm, showPreviewModal, previewTemplate, renderedPreview | Planned |
| `src/pages/admin/Questions/QuestionForm.jsx` | showBulkUploadModal, openBulkUploadModal | Planned |
| `src/pages/admin/Questions/TestCaseManager.jsx` | showForm, editingTestCase, showBulkUploadModal, openBulkUploadModal | Planned |
| `src/pages/admin/Settings/Settings.jsx` | showModal, showDeleteModal, selectedItem, isEditing | Planned |
| `src/pages/admin/Users/BulkResetModal.jsx` | Shared dialog / conditional overlay | Planned |
| `src/pages/admin/Users/UserDetail/UserDetail.jsx` | showEditModal, showResetModal | Planned |
| `src/pages/admin/Users/Users.jsx` | showForm, showBulkUploadModal, showEditModal, showResetModal, showBulkResetModal, showDeleteModal, userToDelete, deleteError | Planned |
| `src/pages/Login/Login.jsx` | showPassword, showForgotPasswordModal | Planned |
| `src/pages/Playground/Playground.jsx` | consoleOpen | Planned |
| `src/pages/user/Assessments/AssessmentResults/AssessmentResults.jsx` | showFeedbackModal, feedbackSubmitted | Planned |
| `src/pages/user/Assessments/AssessmentStart/AssessmentStart.jsx` | showAccessCodeInput | Planned |
| `src/pages/user/Assessments/AssessmentTake/AssessmentTake.jsx` | showQuestionNav, showSubmitModal, showSegmentEndModal, showSegmentSubmitModal, showCloseWarning, showFullscreenExitModal, showFullscreenRequiredModal, showTabSwitchModal | Planned |
| `src/pages/user/Quiz/Quiz.jsx` | showConfirmModal | Planned |
| `src/components/ConfirmModal/ConfirmModal.jsx` | Shared dialog / conditional overlay | Planned |
| `src/components/DoubleInputModal/DoubleInputModal.jsx` | Shared dialog / conditional overlay | Planned |
| `src/components/Dropdown/Dropdown.jsx` | isOpen | Planned |
| `src/components/Header/Header.jsx` | showUserMenu | Planned |
| `src/components/InputModal/InputModal.jsx` | Shared dialog / conditional overlay | Planned |
| `src/components/Layout/Layout.jsx` | isSidebarOpen | Planned |
| `src/components/LessonModal/LessonModal.jsx` | showTextColorPicker, showBgColorPicker, localMediaPreviewUrl, showLinkModal, showImageModal, showVideoModal | Planned |
| `src/components/ThemedSelect/ThemedSelect.jsx` | open | Planned |

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
