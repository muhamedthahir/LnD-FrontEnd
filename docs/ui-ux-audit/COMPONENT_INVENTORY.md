# Component inventory and dependency map

30 October 2026. Source occurrences, not test completion. Paths relative to E:/edtech/LnD-FrontEnd. UI flags are discovery heuristics, not verified absences. Shell/header/sidebar derive from the route wrapper.

## src/App.jsx

Dependencies: `react-router-dom` (Routes, Route, Navigate); `react` (lazy, Suspense); `react-toastify` (ToastContainer); `react-toastify/dist/ReactToastify.css` (); `./contexts/ThemeContext` (ThemeProvider); `./contexts/ApiContext` (ApiProvider); `./components/Layout/Layout` (Layout); `./components/SecureLayout/SecureLayout` (SecureLayout); `./features/Login/Login` (Login); `./features/ResetPassword/ResetPassword` (ResetPassword); `./auth/sessionClient` (hasPersistedSession); `./pages/admin/Institutions/createInstitutionLogic.js` (CREATE_INSTITUTION_ROUTE).

UI elements: Navigate ×3, div ×2, ApiProvider ×1, ThemeProvider ×1, ToastContainer ×1, Suspense ×1, PageLoader ×1, Routes ×1, Route ×63, RootEntry ×1, Login ×1, ResetPassword ×1, CodeEditorLayout ×1, Playground ×2, SecureLayout ×1, AssessmentTake ×2, Layout ×1, Dashboard ×1, PersonalDetails ×1, UserCourses ×1, CourseOverview ×1, CurrentCourse ×1, PracticeExercise ×1, Quiz ×1, CourseAssessment ×1, Assessments ×2, AssessmentStart ×1, AssessmentResults ×1, Institutions ×1, CreateInstitution ×1, InstitutionDetail ×1, MailerTemplateDetail ×2, MailerTemplates ×1, Settings ×1, Users ×1, CreateUser ×1, UserDetail ×1, AssessmentManagement ×1, AssessmentCreate ×1, AssessmentEdit ×1, ConfigurationsList ×1, AssessmentConfigurations ×1, ConfigurationCreate ×1, AssessmentAdministration ×1, AssessmentUserMapping ×1, AssessmentResult ×2, Groups ×1, CreateGroup ×2, CoursesManagement ×1, CourseEdit ×1, PracticeSegmentManager ×1, CourseAdministrations ×1, CreateAdministration ×1, AdministrationDetail ×1, ProgressReport ×1, QuestionBanks ×1, QuestionBankForm ×2, QuestionBankDetail ×1, QuestionList ×1, QuestionForm ×2, QuestionDetail ×1, TestCaseManager ×1.

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: gesture, inlineStyles.

Overlay sites: .

## src/components/Button/Button.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/ConfirmModal/ConfirmModal.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/CourseCard/CourseCard.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/DoubleInputModal/DoubleInputModal.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Dropdown/Dropdown.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Header/Header.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/InputModal/InputModal.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Layout/Layout.jsx

Dependencies: `react-router-dom` (Navigate, Outlet, useLocation); `react` (Suspense, useEffect, useState); `react-router-dom` (useNavigate); `../Sidebar/Sidebar` (Sidebar); `../Header/Header` (Header); `../../contexts/ApiContext` (useApi); `../../constants/constants` (API_ENDPOINTS); `../../design/Primitives` (LoadingState); `../../utils/authToken` (isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken).

UI elements: div ×6, Navigate ×1, a ×1, Sidebar ×1, Header ×1, main ×1, Suspense ×1, Outlet ×1.

Headings: .

Actions: .

Fields: .

Conditional states: user L13, loading L14, isSidebarCollapsed L15, isSidebarOpen L19.

Signals: loading, error.

Overlay sites: .

## src/components/LessonModal/LessonModal.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/MediaPlayer/AudioPlayer.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/MediaPlayer/DocumentViewer.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/MediaPlayer/VideoPlayer.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Pagination/Pagination.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/PasswordSetup/PasswordSetup.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/RichTextEditor/RichTextEditor.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/SecureLayout/SecureLayout.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Sidebar/Sidebar.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Table/Table.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/ThemedSelect/ThemedSelect.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/ThemeToggle/ThemeToggle.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/components/Toggle/Toggle.jsx

Dependencies: .

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/contexts/ApiContext.jsx

Dependencies: `react` (createContext, useContext, useState, useEffect, useCallback, useRef); `../config` (getConfig); `../constants/constants` (API_ENDPOINTS); `../utils/authToken` (isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken).

UI elements: ApiContext.Provider ×1.

Headings: .

Actions: .

Fields: .

Conditional states: apiBaseUrl L25, isLoading L26, accessToken L27, refreshToken L31.

Signals: loading, error.

Overlay sites: .

## src/contexts/ThemeContext.jsx

Dependencies: `react` (createContext, useContext, useState, useEffect).

UI elements: ThemeContext.Provider ×1.

Headings: .

Actions: .

Fields: .

Conditional states: theme L14.

Signals: error.

Overlay sites: .

## src/design/AssessmentDialogs.jsx

Dependencies: `react` (useEffect, useRef, useState); `./Dialog` (Dialog); `./Primitives` (ActionButton).

UI elements: dl ×2, div ×4, dt ×3, dd ×3, ActionButton ×1, p ×14, Dialog ×8, Summary ×2, strong ×1, span ×1.

Headings: .

Actions: text L16.

Fields: .

Conditional states: working L9, failure L9.

Signals: error, validation.

Overlay sites: Dialog L19 open={!!views.entry} title="Ready to enter the assessment?" dismissible={false} busy={locked} footer={action("Enter assessment",onEnterTest)}; Dialog L20 open={!!views.fullscreenRequired} title="Fullscreen required" alert dismissible={false} busy={locked} footer={action('Go to Fullscreen',onEnterFullscreen)}; Dialog L21 open={!!views.fullscreenExit} title="Exit fullscreen?" alert dismissible={false} busy={locked} footer={<>{action('Stay in Fullscreen',onStayFullscreen)}{action('Exit Fullscreen',onExitFullscreen,'secondary')}</>}; Dialog L22 open={!!views.submit} title="Submit assessment?" onClose={onCloseSubmit} busy={locked} footer={<>{action('Continue Assessment',onCloseSubmit,'secondary')}{action(locked?'Submitting…':'Confirm Submit',onSubmit)}</>}; Dialog L23 open={!!views.segmentSubmit} title="Submit segment?" onClose={onCloseSegmentSubmit} busy={locked} footer={<>{action('Continue Segment',onCloseSegmentSubmit,'secondary')}{action('Submit Segment',onSubmitSegment)}</>}; Dialog L24 open={!!views.segmentEnd} title="Segment complete" dismissible={false} busy={locked} footer={action('Continue to Next Segment',onNextSegment)}; Dialog L25 open={!!views.closeWarning} title="Complete your assessment first" alert dismissible={false} busy={locked} footer={action('Continue Assessment',onContinueWindow)}; Dialog L26 open={!!views.tabSwitch} title={limitExceeded?'Tab switch limit exceeded':'Tab switch detected'} alert dismissible={false} busy={locked} footer={limitExceeded ? countdown <= 0 && !busy && action('Retry submission',onRetrySubmit) : action('Continue Assessment',onContinueAfterSwitch)}.

## src/design/CodeSurface.jsx

Dependencies: `@monaco-editor/react` (Editor); `react` (useEffect, useRef); `../contexts/ThemeContext` (useTheme).

UI elements: Editor ×1.

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: error.

Overlay sites: .

## src/design/Combobox.jsx

Dependencies: `react` (useEffect, useId, useLayoutEffect, useRef, useState); `react-dom` (createPortal); `./Icon` (Icon).

UI elements: select ×1, option ×1, div ×4, label ×1, button ×4, span ×2, Icon ×1, small ×1, input ×1, p ×1.

Headings: .

Actions: [icon/nested] L52; × L52; multiple && <span aria-hidden="true">{selected(option) ? '✓ ' : '○ '}</span> renderOption ? renderOption(option) : text(option) L52; Create “ search.trim() ” L52.

Fields: select L5 [id,name,value,onChange,disabled,aria-label,className]; input L52 [aria-label,value,onChange,autoFocus].

Conditional states: open L11, search L12, active L13, position L14.

Signals: empty, error, validation, gesture, inlineStyles.

Overlay sites: .

## src/design/CourseCard.jsx

Dependencies: `react-router-dom` (Link, useOutletContext); `./Icon` (Icon).

UI elements: article ×1, div ×4, img ×1, Icon ×3, span ×5, h3 ×1, progress ×1, Link ×2, button ×1.

Headings: h3: course.name L11.

Actions: Delete L12.

Fields: .

Conditional states: .

Signals: loading.

Overlay sites: .

## src/design/Dialog.jsx

Dependencies: `react` (Children, cloneElement, createContext, forwardRef, isValidElement, useContext, useEffect, useId, useRef); `react-dom` (createPortal); `./Primitives` (ActionButton).

UI elements: DialogContext.Provider ×1, div ×5, section ×1, DialogLayer ×1, DialogSurface ×1, header ×1, h2 ×1, p ×1, ActionButton ×1, footer ×1.

Headings: h2: title L113.

Actions: × L113.

Fields: .

Conditional states: .

Signals: inlineStyles.

Overlay sites: DialogContext.Provider L71 value={id}; DialogLayer L112 onClose={onClose} busy={busy} dismissible={dismissible}; DialogSurface L112 role={alert ? 'alertdialog' : 'dialog'} aria-labelledby={titleId} data-size={size}.

## src/design/FormDialogs.jsx

Dependencies: `react` (useEffect, useState); `./Dialog` (Dialog); `./Primitives` (ActionButton, FieldGroup).

UI elements: Dialog ×3, ActionButton ×6, div ×3, p ×4, form ×2, FieldGroup ×2, label ×2, input ×2.

Headings: .

Actions: cancelText L14; confirmText L14; cancelText L27; confirmText L27; cancelText L40; confirmText L40.

Fields: input L27 [type,value,onChange,placeholder,autoFocus,disabled]; input L40 [type,value,placeholder,autoFocus,disabled,onChange].

Conditional states: busy L6, failure L7, value L17, busy L18, error L19, values L30, busy L31, error L32.

Signals: loading, error, inlineStyles.

Overlay sites: Dialog L14 open={isOpen} title={title} onClose={onClose} busy={busy} alert footer={<><ActionButton disabled={busy} onClick={onClose}>{cancelText}</ActionButton><ActionButton variant={/delete|expire|remove/i.test(confirmText) ? 'danger' : 'primary'} disabl; Dialog L27 open={isOpen} title={title} onClose={onClose} busy={busy}; Dialog L40 open={isOpen} title={title} onClose={onClose} busy={busy}.

## src/design/Icon.jsx

Dependencies: .

UI elements: rect ×5, circle ×7, path ×20, svg ×1.

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/design/Navigation.jsx

Dependencies: `react-router-dom` (Link, useLocation); `./Icon` (Icon); `./routeMeta` (navigation).

UI elements: aside ×1, Link ×2, img ×1, span ×6, div ×3, nav ×1, section ×1, h2 ×1, Icon ×1, i ×1, strong ×1, small ×1.

Headings: h2: group L14.

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/design/Pagination.jsx

Dependencies: `./Primitives` (ActionButton); `./Icon` (Icon).

UI elements: nav ×1, div ×2, span ×1, label ×1, select ×1, option ×1, ActionButton ×5.

Headings: .

Actions: « L8; ‹ L8; page L8; › L8; » L8.

Fields: select L8 [aria-label,value,onChange].

Conditional states: .

Signals: .

Overlay sites: .

## src/design/Primitives.jsx

Dependencies: `react` (Children, cloneElement, forwardRef, isValidElement, useId).

UI elements: button ×1, span ×5, Element ×1, div ×8, table ×1, strong ×1.

Headings: .

Actions: loading && <span className="cz-button-spinner" /> children L8.

Fields: .

Conditional states: .

Signals: loading, empty, tables.

Overlay sites: .

## src/design/Switch.jsx

Dependencies: .

UI elements: label ×1, input ×1, span ×2.

Headings: .

Actions: .

Fields: input L3 [type,role,checked,aria-checked,value,onChange,disabled,aria-label].

Conditional states: .

Signals: .

Overlay sites: .

## src/design/ThemeSwitch.jsx

Dependencies: `../contexts/ThemeContext` (useTheme); `./Primitives` (ActionButton); `./Icon` (Icon).

UI elements: ActionButton ×1, Icon ×1.

Headings: .

Actions: [icon/nested] L6.

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/design/TopBar.jsx

Dependencies: `react` (useEffect, useRef, useState); `react-router-dom` (Link, useLocation); `./Icon` (Icon); `./Primitives` (ActionButton); `./routeMeta` (getRouteMeta); `../contexts/ThemeContext` (useTheme).

UI elements: header ×1, div ×5, ActionButton ×3, Icon ×8, nav ×1, span ×5, Link ×3, button ×1, strong ×1, small ×1.

Headings: .

Actions: [icon/nested] L22; [icon/nested] L23; [icon/nested] L23; Sign out L23.

Fields: .

Conditional states: open L12.

Signals: .

Overlay sites: .

## src/design/widgets/LessonModal/LessonModal.jsx

Dependencies: `../../viewStyles` (createViewStyles); `../../Dialog` (DialogLayer, DialogSurface); `../../Primitives` (ActionButton, FieldGroup); `react` (useState, useRef, useEffect); `react-toastify` (toast); `../../../components/Button/Button` (Button); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../components/InputModal/InputModal` (InputModal); `../../../components/DoubleInputModal/DoubleInputModal` (DoubleInputModal); `../../../components/RichTextEditor/RichTextEditor` (RichTextEditor); `../../../components/MediaPlayer` (VideoPlayer, AudioPlayer, DocumentViewer).

UI elements: DialogLayer ×1, DialogSurface ×1, div ×37, h2 ×1, ActionButton ×1, svg ×6, line ×4, FieldGroup ×5, label ×11, span ×25, input ×13, RichTextEditor ×1, polygon ×1, path ×4, h4 ×5, VideoPlayer ×2, AudioPlayer ×2, p ×5, polyline ×4, Button ×4, DocumentViewer ×2, DoubleInputModal ×1, InputModal ×2.

Headings: h2: editingLesson ? 'Edit Lesson' : 'Add Lesson' L539; h4: Current contentType === 'video' ? 'Video' : 'Audio' L591; h4: existingMediaUrl ? 'Replace with New File' : 'Upload File' L606; h4: Current Documents L710; h4: existingDocuments.length > 0 ? 'Replace with New Files' : 'Upload Files' L725; h4: New Documents to Upload: L766.

Actions: [icon/nested] L540; Choose File L646; Choose Files L759; Cancel L788; isSaving ? <>Please wait…</> : editingLesson ? 'Update Lesson' : 'Add Lesson' L791.

Fields: input L551 [type,value,onChange,placeholder]; input L558 [type,name,value,checked,onChange]; input L562 [type,name,value,checked,onChange]; input L566 [type,name,value,checked,onChange]; input L570 [type,name,value,checked,onChange]; input L611 [type,checked,onChange]; input L625 [type,value,onChange,placeholder]; input L637 [ref,type,accept,onChange,style]; input L678 [aria-label,type,min,max,value,onChange,className]; input L688 [aria-label,type,min,max,value,onChange,className]; input L730 [type,checked,onChange]; input L743 [type,value,onChange,placeholder]; input L756 [ref,type,multiple,accept,onChange,style].

Conditional states: lessonName L23, contentType L24, articleContent L25, videoEmbedded L26, videoUrl L27, videoFile L28, audioFile L29, documentFiles L30, documentEmbedded L31, documentUrl L32, isDragging L33, showTextColorPicker L34, showBgColorPicker L35, thresholdValue L36, existingMediaUrl L37, existingMediaKey L38, existingMediaFileName L39, existingDocuments L40, localMediaPreviewUrl L41, showLinkModal L42, showImageModal L43, showVideoModal L44.

Signals: toast, error, validation, inlineStyles.

Overlay sites: DialogLayer L536 className={styles.overlay} busy={isSaving} onClick={handleClose}; DialogSurface L537 className={styles.modal} onClick={e => e.stopPropagation()}; DoubleInputModal L799 isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} onConfirm={handleLinkConfirm} title="Insert Link" label1="URL" label2="Link Text" placeholder1="https://example.com" placeholder2="Click here" type1="url"; InputModal L801 isOpen={showImageModal} onClose={() => setShowImageModal(false)} onConfirm={handleImageConfirm} title="Insert Image" label="Image URL" placeholder="https://example.com/image.jpg" type="url"; InputModal L803 isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} onConfirm={handleVideoConfirm} title="Insert Video" label="Embedded Video URL (YouTube/Vimeo)" placeholder="https://www.youtube.com/embed/..." type="url".

## src/design/widgets/MediaPlayer/AudioPlayer.jsx

Dependencies: `../../viewStyles` (createViewStyles); `../../Primitives` (ActionButton); `react` (useState, useRef, useEffect, useCallback); `../../../hooks/useResolvedMediaUrl` (useResolvedMediaUrl).

UI elements: div ×15, svg ×6, path ×3, circle ×3, span ×5, line ×2, p ×1, audio ×1, ActionButton ×1, rect ×2, polygon ×2, input ×2, polyline ×1.

Headings: .

Actions: loading ? <div className={styles.btnSpinner}></div> : isPlaying ? <svg viewBox="0 0 24 24" L149.

Fields: input L165 [aria-label,type,className,min,max,value,onChange,disabled]; input L188 [aria-label,type,className,min,max,step,value,onChange].

Conditional states: isPlaying L19, duration L20, currentTime L21, volume L22, error L23, loading L24, progressPercent L25, isComplete L26.

Signals: loading, empty, error, inlineStyles.

Overlay sites: .

## src/design/widgets/MediaPlayer/DocumentViewer.jsx

Dependencies: `../../viewStyles` (createViewStyles); `../../Primitives` (ActionButton); `react` (useState, useEffect, useRef, useCallback); `react-pdf` (Document, Page, pdfjs); `react-pdf/dist/esm/Page/AnnotationLayer.css` (); `react-pdf/dist/esm/Page/TextLayer.css` ().

UI elements: svg ×24, path ×10, polyline ×21, text ×1, line ×16, rect ×2, circle ×4, div ×40, a ×5, span ×18, ActionButton ×9, Document ×1, Page ×1, img ×1, TextFileViewer ×1, pre ×1.

Headings: .

Actions: [icon/nested] L229; [icon/nested] L237; [icon/nested] L243; [icon/nested] L251; Mark as Complete L278; Mark as Complete L305; Mark as Complete L324; Mark as Complete L345; getFileIcon(doc.fileName) L371.

Fields: .

Conditional states: error L24, loading L25, activeDocIndex L26, numPages L27, pageNumber L28, scale L29, hasReachedEnd L30, maxPageReached L31, content L426, loading L427.

Signals: loading, empty, error, inlineStyles.

Overlay sites: .

## src/design/widgets/MediaPlayer/VideoPlayer.jsx

Dependencies: `../../viewStyles` (createViewStyles); `react` (useState, useRef, useEffect, useCallback); `../../../hooks/useResolvedMediaUrl` (useResolvedMediaUrl).

UI elements: div ×13, svg ×3, polygon ×1, span ×6, circle ×1, line ×2, p ×1, iframe ×1, video ×1, polyline ×1.

Headings: .

Actions: .

Fields: .

Conditional states: error L25, loading L26, duration L27, currentTime L28, isComplete L29.

Signals: loading, empty, error, inlineStyles.

Overlay sites: .

## src/design/widgets/PasswordSetup/PasswordSetup.jsx

Dependencies: `../../Dialog` (DialogLayer, DialogSurface); `../../viewStyles` (createViewStyles); `../../Primitives` (FieldGroup, ActionButton); `react` (useState); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES).

UI elements: DialogLayer ×1, DialogSurface ×1, h2 ×1, p ×1, form ×1, FieldGroup ×2, label ×2, input ×2, span ×2, div ×1, ActionButton ×1.

Headings: h2: Set Your Password L87.

Actions: loading ? 'Setting Password...' : 'Set Password' L104.

Fields: input L93 [type,name,value,onChange,placeholder,className]; input L99 [type,name,value,onChange,placeholder,className].

Conditional states: formData L17, errors L21, loading L22.

Signals: toast, loading, error, validation.

Overlay sites: DialogLayer L85 className={styles.overlay} dismissible={false} busy={loading}; DialogSurface L86 className={styles.modal}.

## src/design/widgets/RichTextEditor/RichTextEditor.jsx

Dependencies: `../../viewStyles` (createViewStyles); `react` (useEffect, useMemo, useRef); `react-quill` (ReactQuill); `react-quill/dist/quill.snow.css` ().

UI elements: div ×1, ReactQuill ×1.

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: inlineStyles.

Overlay sites: .

## src/design/widgets/SecureLayout/SecureLayout.jsx

Dependencies: `../../viewStyles` (createViewStyles); `react-router-dom` (Outlet); `react` (useEffect, useState, useCallback, useRef); `../../../contexts/ApiContext` (useApi); `../../../constants/constants` (API_ENDPOINTS); `../../../utils/authToken` (isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken).

UI elements: div ×6, p ×2, h2 ×1, main ×1, Outlet ×1.

Headings: h2: Session Expired L113.

Actions: .

Fields: .

Conditional states: user L14, loading L15.

Signals: loading, error.

Overlay sites: .

## src/features/admin/assessments/AssessmentAdministration/AssessmentAdministration.jsx

Dependencies: `react` (useEffect); `react-router-dom` (useNavigate).

UI elements: .

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .

## src/features/admin/assessments/AssessmentConfigurations/AssessmentConfigurations.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Toolbar); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate, useLocation); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../hooks/useConfirmModal` (useConfirmModal); `../../../../utils/apiFetch.js` (formatConfigDateTime, withNoCache).

UI elements: PageContent ×2, div ×15, p ×3, Toolbar ×1, ActionButton ×4, svg ×6, path ×9, span ×9, Button ×2, circle ×2, h3 ×2, polyline ×1, ConfirmDialog ×1.

Headings: h3: No Configurations L115; h3: config.display_name L125.

Actions: [icon/nested] L97; Add Configuration L101; Create Configuration L117; [icon/nested] L149; [icon/nested] L155; [icon/nested] L163.

Fields: .

Conditional states: assessment L25, configurations L26, loading L27.

Signals: toast, loading, empty, error.

Overlay sites: ConfirmDialog L172 .

## src/features/admin/assessments/AssessmentCreate/AssessmentCreate.jsx

Dependencies: `../../../../design/Primitives` (ActionButton, FieldGroup, FieldRow, PageContent, Toolbar); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect); `react-router-dom` (useNavigate); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×1, Toolbar ×1, div ×10, ActionButton ×1, svg ×2, path ×2, h3 ×2, p ×3, FieldGroup ×3, label ×3, span ×3, input ×1, textarea ×1, FieldRow ×1, select ×1, option ×2, circle ×1, h4 ×1, ul ×1, li ×4, Button ×3.

Headings: h3: Basic Information L87; h3: Classification L111; h4: What's Next? L137.

Actions: [icon/nested] L78; Cancel L150; saving === 'draft' ? 'Saving...' : 'Save as Draft' L154; saving === 'continue' ? 'Saving...' : 'Create & Add Segments' L157.

Fields: input L94 [type,id,value,onChange,className,placeholder]; textarea L103 [id,value,onChange,placeholder,rows]; select L117 [id,value,onChange].

Conditional states: formData L16, errors L21, institutions L22, saving L23.

Signals: toast, error, validation.

Overlay sites: .

## src/features/admin/assessments/AssessmentEdit/AssessmentEdit.jsx

Dependencies: `../../../../design/Dialog` (DialogLayer, DialogSurface); `../../../../design/Primitives` (PageContent, ActionButton, FieldGroup, FieldRow, Toolbar); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useCallback, useRef); `react-router-dom` (useParams, useNavigate); `../../../../contexts/ApiContext` (useApi); `react-redux` (useSelector); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../components/Toggle/Toggle` (Toggle); `../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../../components/Dropdown/Dropdown` (Dropdown); `../../../../hooks/useConfirmModal` (useConfirmModal); `../../../../hooks/useMasterData.js` (useAutoLoadMasterData); `../../../../components/Table/Table` (Table).

UI elements: PageContent ×3, div ×60, p ×8, h3 ×2, Button ×16, Toolbar ×1, ActionButton ×11, svg ×13, path ×12, span ×37, strong ×3, button ×2, FieldGroup ×10, label ×15, input ×18, textarea ×2, FieldRow ×1, select ×5, option ×13, h4 ×2, polyline ×4, h5 ×1, Table ×2, thead ×2, tr ×5, th ×15, tbody ×2, td ×23, code ×3, Toggle ×2, circle ×3, DialogSurface ×2, h2 ×2, DialogLayer ×1, Dropdown ×1, small ×2, ConfirmModal ×1, ConfirmDialog ×1.

Headings: h3: Assessment not found L993; h3: Assessment Segments L1082; h4: segment.name L1100; h5: Questions ( (segment.programming_questions?.length || 0) + (segment.mcq_questions?.length || 0) ) L1190; h4: Ready to Publish? L1311; h2: Add Questions to Segment L1334; h2: editingSegment ? 'Edit Segment' : 'Add Segment' L1500.

Actions: Back to List L994; [icon/nested] L999; Configurations L1003; Duplicate L1005; Archive L1007; Publish L1009; Delete L1011; Details L1016; Segments ( segments.length ) L1019; Save Changes L1056; Add Segment L1083; Add First Segment L1093; Apply to All L1127; [icon/nested] L1141; [icon/nested] L1146; [icon/nested] L1151; [icon/nested] L1157; + Add Question L1191; [icon/nested] L1247; [icon/nested] L1253; [icon/nested] L1284; [icon/nested] L1290; publishing ? <> <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="cu L1314; × L1335; Cancel L1480; Add selectedQuestions.length Question selectedQuestions.length !== 1 ? 's' : '' L1486; × L1501; Cancel L1593; editingSegment ? 'Update Segment' : 'Add Segment' L1594.

Fields: input L1028 [type,value,onChange,placeholder]; textarea L1036 [value,onChange,placeholder,rows]; select L1045 [value,onChange]; input L1105 [type,placeholder,value,onChange,className,title]; input L1112 [type,placeholder,value,onChange,className,title]; input L1119 [type,placeholder,value,onChange,className,title]; input L1240 [type,placeholder,value,onChange,onBlur,className]; input L1241 [type,placeholder,value,onChange,onBlur,className]; input L1242 [type,placeholder,value,onChange,onBlur,className]; input L1277 [type,placeholder,value,onChange,onBlur,className]; input L1278 [type,placeholder,value,onChange,onBlur,className]; input L1279 [type,placeholder,value,onChange,onBlur,className]; select L1350 [value,onChange]; select L1370 [value,onChange]; select L1386 [value,onChange]; input L1400 [type,placeholder,value,onChange]; input L1431 [type,checked,onChange,onClick,title]; input L1452 [type,checked,onChange,onClick]; input L1507 [type,value,onChange,placeholder]; textarea L1515 [value,onChange,placeholder,rows]; input L1523 [type,value,onChange,min]; Dropdown L1531 [label,options,value,onChange,placeholder,multiple,searchable]; input L1544 [type,name,value,checked,onChange]; input L1555 [type,name,value,checked,onChange]; select L1569 [value,onChange]; input L1582 [type,checked,onChange].

Conditional states: assessment L35, segments L36, loading L37, activeTab L38, expandedSegment L39, publishing L40, showPublishConfirm L41, showQuestionModal L42, currentSegmentForQuestions L43, formData L45, showSegmentModal L50, editingSegment L51, segmentForm L52, activeQuestionSection L63, availableQuestions L64, selectedQuestions L65, questionBanks L66, selectedQuestionBank L67, loadingQuestions L68, questionFilters L69, levels L73, localMarks L74, localOverrides L75, bulkMarks L76, institutions L77.

Signals: toast, loading, empty, error, validation, tabs, tables, inlineStyles.

Overlay sites: DialogSurface L1332 className={styles.fullPageModalContent}; DialogLayer L1497 className={styles.modalOverlay} onClick={() => setShowSegmentModal(false)}; DialogSurface L1498 className={styles.modalContent} onClick={e => e.stopPropagation()}; ConfirmModal L1602 isOpen={showPublishConfirm} onClose={() => setShowPublishConfirm(false)} onConfirm={handlePublishAssessment} title="Publish Assessment" message="Are you sure you want to publish this assessment? Once published, it will be available to users." confirmText="Publish" cancelText="Cancel" disabled={publishing}; ConfirmDialog L1604 .

## src/features/admin/assessments/AssessmentManagement/AssessmentManagement.jsx

Dependencies: `../../../../design/Primitives` (Toolbar, FieldGroup, ActionButton, PageContent); `react` (useState, useEffect, useCallback); `react-router-dom` (useNavigate); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../components/Pagination/Pagination` (Pagination); `../../../../components/Table/Table` (Table).

UI elements: PageContent ×1, div ×12, svg ×4, path ×5, h3 ×2, p ×2, Button ×2, Toolbar ×1, FieldGroup ×2, label ×2, input ×1, select ×1, option ×4, ActionButton ×3, Table ×1, thead ×1, tr ×2, th ×7, tbody ×1, td ×7, circle ×1, Pagination ×1.

Headings: h3: No Assessments Found L88; h3: No Assessments Match Your Filters L124.

Actions: Create Assessment L90; Create Assessment L96; [icon/nested] L115; assessment.title L142; [icon/nested] L154.

Fields: input L104 [type,className,placeholder,value,onChange]; select L108 [className,value,onChange].

Conditional states: assessments L15, loading L16, search L17, selectedStatus L18, currentPage L19, pageSize L20, totalCount L21.

Signals: toast, loading, empty, error, tables.

Overlay sites: .

## src/features/admin/assessments/AssessmentResult/AssessmentResult.jsx

Dependencies: `../../../../design/Dialog` (DialogLayer, DialogSurface); `../../../../design/Primitives` (PageContent, ActionButton, Toolbar); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect); `react-router-dom` (useParams, useNavigate, Link); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../../components/Table/Table` (Table); `../../../../hooks/useConfirmModal` (useConfirmModal).

UI elements: PageContent ×3, div ×64, p ×6, ActionButton ×7, Toolbar ×1, svg ×10, polyline ×4, path ×10, circle ×1, h3 ×4, label ×18, span ×38, h2 ×3, h4 ×1, Table ×1, thead ×1, tr ×2, th ×5, tbody ×1, td ×5, pre ×2, DialogLayer ×1, DialogSurface ×1, line ×2, code ×1, rect ×1, ConfirmDialog ×1.

Headings: h3: Student Information L157; h3: Assessment & Configuration Details L189; h2: Assessment Performance Overview L217; h2: Segment-wise Performance L257; h4: segment.segment_name L267; h3: Proctoring Summary L367; h2: Proctoring Logs L397; h3: codeModalData.questionName L439.

Actions: Go Back L93; Back L133; Refresh Violation L138; View Code L328; [icon/nested] L450; Copy Code L463; Close L473.

Fields: .

Conditional states: loading L25, reportData L26, expandedSegments L27, codeModalData L28.

Signals: toast, loading, empty, error, tables, inlineStyles.

Overlay sites: DialogLayer L435 className={styles.codeModalOverlay} onClick={() => setCodeModalData(null)}; DialogSurface L436 className={styles.codeModal} onClick={e => e.stopPropagation()}; ConfirmDialog L479 .

## src/features/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow, Toolbar); `react` (useState, useEffect, useCallback, useMemo); `react-router-dom` (useParams, useNavigate); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../components/Table/Table` (Table); `../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../../components/Pagination/Pagination` (Pagination).

UI elements: div ×45, span ×24, svg ×15, path ×17, line ×8, p ×6, PageContent ×2, Toolbar ×1, ActionButton ×10, h2 ×1, Panel ×1, FieldGroup ×7, label ×10, button ×2, circle ×5, select ×3, option ×9, FieldRow ×1, input ×7, polyline ×6, Button ×10, h3 ×2, Table ×1, thead ×1, tr ×2, th ×8, tbody ×1, td ×8, Pagination ×1, ConfirmModal ×1.

Headings: h2: Add Users to Assessment L753; h3: No users found L962; h3: getExtendTimeLabel() L1102.

Actions: [icon/nested] L744; [icon/nested] L760; [icon/nested] L773; × L869; × L892; Cancel L901; addingUsers ? 'Adding...' : 'Add Users' L911; showAddSection ? 'Cancel' : 'Add Users' L937; Download Report L939; Regrade Saved Code L941; Refresh Attempt for All L943; Send All Invitations L945; Add Users L964; mapping.status === 'DISQUALIFIED' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentCo L1023; [icon/nested] L1047; [icon/nested] L1052; [icon/nested] L1058; [icon/nested] L1066; [icon/nested] L1072; [icon/nested] L1080; Cancel L1115; extendLoading ? 'Saving...' : 'Extend Time' L1118.

Fields: select L789 [value,onChange]; input L803 [type,value,onChange,placeholder]; input L811 [type,value,onChange,placeholder]; input L819 [type,value,onChange,placeholder]; input L828 [type,value,onChange,placeholder,className]; input L879 [type,value,onChange,placeholder,className]; input L948 [type,aria-label,className,placeholder,value,onChange]; select L949 [aria-label,value,onChange]; select L1004 [className,value,onChange]; input L1110 [id,type,min,max,value,onChange,className].

Conditional states: configData L20, userMappings L21, loading L22, candidateType L23, colleges L24, selectedCollege L25, availableGroups L26, groupSearch L27, selectedGroups L28, groupDegree L29, groupDepartment L30, groupYear L31, availableUsers L32, userSearch L33, selectedUsers L34, statusFilter L35, mappedUserSearch L36, debouncedMappedUserSearch L37, mappingsPage L38, mappingsPageSize L39, mappingsTotal L40, showAddSection L41, addingUsers L42, confirmModal L43, confirmLoading L48, selectedAttemptByUser L49, extendModal L50, extendLoading L55.

Signals: toast, loading, empty, error, validation, tables, cards.

Overlay sites: ConfirmModal L1098 isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={handleConfirmAction} title={confirmConfig.title} message={confirmConfig.message} confirmText={confirmConfig.confirmText} cancelText="Cancel" disabled={confirmLoading}.

## src/features/admin/assessments/ConfigurationCreate/ConfigurationCreate.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow, Toolbar); `react` (useState, useEffect, useRef); `react-router-dom` (useParams, useNavigate, useSearchParams); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../utils/apiFetch.js` (formatConfigDateTimeForInput, normalizeDateTimeForPayload, withNoCache).

UI elements: svg ×8, path ×10, circle ×4, rect ×4, line ×1, PageContent ×2, div ×24, p ×9, Toolbar ×1, ActionButton ×1, span ×64, nav ×1, button ×1, polyline ×1, Panel ×6, h2 ×6, FieldGroup ×31, label ×55, input ×45, FieldRow ×8, select ×5, option ×11, textarea ×1, h4 ×1, strong ×2, Button ×4.

Headings: h2: Basic Information L674; h2: Timing Configuration L744; h2: Proctoring Settings L836; h2: Scoring Configuration L1000; h2: Question Settings L1158; h4: segment.name L1210; h2: Access Control L1479.

Actions: [icon/nested] L650; activeStep > index && <span className="step-check"> <svg viewBox="0 0 24 24" fill="none" s L659; ← Previous L1547; Next → L1551; saving ? 'Saving...' : editConfigId ? 'Update Configuration' : 'Save Configuration' L1557; saving ? 'Activating...' : 'Activate and Continue' L1560.

Fields: input L679 [type,value,onChange,placeholder]; input L688 [type,value,onChange,placeholder]; select L695 [value,onChange]; textarea L707 [value,onChange,placeholder,rows]; input L716 [type,value,onChange,placeholder]; input L723 [type,value,onChange,min]; select L732 [value,onChange]; select L749 [value,onChange]; input L765 [type,value,onChange]; input L775 [type,value,onChange]; input L787 [type,value,onChange,min]; input L799 [type,checked,onChange]; input L810 [type,checked,onChange]; input L821 [type,checked,onChange]; input L841 [type,checked,onChange]; input L859 [type,checked,onChange]; input L870 [type,checked,onChange]; input L881 [type,checked,onChange]; input L892 [type,checked,onChange]; input L903 [type,checked,onChange]; input L917 [type,value,onChange,min]; input L932 [type,checked,onChange]; input L943 [type,checked,onChange]; input L954 [type,checked,onChange]; input L971 [type,value,onChange,min,step]; input L986 [type,value,onChange,min,step]; input L1006 [type,value,onChange,min]; select L1016 [value,onChange]; input L1034 [type,name,value,checked,onChange]; input L1046 [type,name,value,checked,onChange]; input L1058 [type,name,value,checked,onChange]; input L1074 [type,value,onChange,min]; input L1090 [type,name,value,checked,onChange]; input L1102 [type,name,value,checked,onChange]; input L1114 [type,name,value,checked,onChange]; input L1130 [type,value,onChange,min]; input L1143 [type,checked,onChange]; input L1163 [type,checked,onChange]; select L1245 [value,onChange]; input L1263 [type,value,onChange,min,max,style]; input L1316 [type,value,onChange,min,max,style]; input L1354 [type,value,onChange,min,max,style]; input L1392 [type,value,onChange,min,max,style]; input L1442 [type,checked,onChange]; input L1453 [type,checked,onChange]; input L1464 [type,checked,onChange]; input L1485 [type,value,onChange,placeholder]; input L1496 [type,value,onChange,min]; input L1508 [type,checked,onChange]; input L1522 [type,value,onChange,min]; input L1534 [type,value,onChange,placeholder].

Conditional states: assessment L19, loading L20, saving L21, activeStep L22, categories L23, mailerTemplates L24, questionBanks L25, segments L32, segmentQuestionCounts L33, formData L34.

Signals: toast, loading, empty, error, validation, cards, inlineStyles.

Overlay sites: .

## src/features/admin/assessments/ConfigurationsList/ConfigurationsList.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useCallback); `react-router-dom` (useNavigate); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../../hooks/useConfirmModal` (useConfirmModal); `../../../../utils/apiFetch.js` (formatConfigDateTime, withNoCache).

UI elements: PageContent ×2, div ×13, p ×4, svg ×5, circle ×3, path ×8, h3 ×2, Button ×1, span ×8, ActionButton ×4, polyline ×1, ConfirmDialog ×1.

Headings: h3: No Configurations L125; h3: config.display_name L135.

Actions: Go to Assessments L127; [icon/nested] L160; [icon/nested] L166; [icon/nested] L174; [icon/nested] L180.

Fields: .

Conditional states: configurations L21, loading L22, assessments L23.

Signals: toast, loading, empty, error.

Overlay sites: ConfirmDialog L189 .

## src/features/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx

Dependencies: `../../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow); `../../../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useMemo); `react-router-dom` (useParams, useNavigate, Link); `react-toastify` (toast); `xlsx` (XLSX); `../../../../../contexts/ApiContext` (useApi); `../../../../../constants/constants.js` (API_ENDPOINTS); `../../../../../utils/localDateTime` (toDateTimeInput); `../../../../../components/Button/Button` (Button); `../../../../../components/Table/Table` (Table).

UI elements: span ×33, svg ×26, polyline ×12, circle ×10, line ×19, PageContent ×2, div ×72, ActionButton ×13, Button ×12, path ×21, nav ×1, button ×7, Panel ×6, h2 ×4, label ×24, FieldGroup ×12, input ×11, FieldRow ×1, p ×10, Table ×1, thead ×1, tr ×2, th ×7, tbody ×1, td ×7, Link ×1, select ×1, option ×3, DialogLayer ×2, DialogSurface ×2, h3 ×2, strong ×2.

Headings: h2: Administration Details L769; h2: Invite Candidates L841; h2: Enrolled Users L991; h2: Add Users L1150; h3: Delete Administration L1260; h3: Force Expire Course L1294.

Actions: Back to Administrations L694; Edit Administration L702; Delete L709; Cancel L719; saving ? 'Saving...' : 'Save Changes' L725; Administration Details L734; Enrolled Users enrolledUsers.length > 0 && <span className="tab-count">{enrolledUsers.length}</span> L745; Add Users L755; [icon/nested] L848; [icon/nested] L860; × L944; × L967; saving ? 'Publishing...' : 'Publish Administration' L977; downloadingReport ? <> <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="cu L995; updatingProgress ? <> <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="cur L1010; × L1041; [icon/nested] L1088; reactivatingUserId === user.user_id ? <span className="btn-reactivate-text">...</span> : < L1097; [icon/nested] L1102; Previous L1131; Next L1137; [icon/nested] L1158; [icon/nested] L1167; × L1217; × L1239; addingUsers ? 'Adding...' : 'Add Users' L1248; [icon/nested] L1261; Cancel L1275; deleting ? 'Deleting...' : 'Delete Administration' L1278; [icon/nested] L1295; Cancel L1327; forceExpiring ? 'Expiring...' : 'Force Expire' L1333.

Fields: input L782 [type,value,onChange,className,placeholder]; input L813 [type,value,onChange,className]; input L824 [type,value,onChange,className]; input L877 [type,value,onChange,placeholder]; input L886 [type,value,onChange,placeholder]; input L895 [type,value,onChange,placeholder]; input L905 [type,value,onChange,placeholder,className]; input L954 [type,value,onChange,placeholder,className]; select L1121 [value,onChange,className]; input L1180 [type,value,onChange,placeholder,className]; input L1227 [type,value,onChange,placeholder,className]; input L1323 [type,id,placeholder,autoComplete].

Conditional states: administration L21, courses L22, colleges L23, loading L24, isEditing L25, formData L26, errors L42, availableGroups L43, groupSearch L44, userSearch L45, availableUsers L46, saving L47, deleting L48, showDeleteConfirm L49, enrolledUsers L50, loadingEnrolledUsers L51, updatingProgress L52, progressUpdateResult L53, showForceExpireConfirm L54, userToExpire L55, forceExpiring L56, reactivatingUserId L57, addUsersCandidateType L58, addGroupsToAdd L59, addUsersToAdd L60, addUsersGroupSearch L61, addUsersUserSearch L62, addUsersAvailableGroups L63, addUsersAvailableUsers L64, addingUsers L65, activeTab L66, enrolledPage L67, enrolledPageSize L68, downloadingReport L69.

Signals: toast, loading, empty, error, validation, tabs, tables, cards, inlineStyles.

Overlay sites: DialogLayer L1257 className="modal-overlay" busy={deleting} onClose={() => setShowDeleteConfirm(false)}; DialogSurface L1258 className="modal-content delete-modal"; DialogLayer L1286 className="modal-overlay" onClick={() => { if (!forceExpiring) { setShowForceExpireConfirm(false); setUserToExpire(null); } }}; DialogSurface L1292 className="modal-content force-expire-modal" onClick={e => e.stopPropagation()}.

## src/features/admin/courses/CourseAdministrations/CourseAdministrations.jsx

Dependencies: `../../../../design/Primitives` (ActionButton, Toolbar, FieldGroup, Panel, FieldRow, PageContent); `../../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useMemo); `react-router-dom` (useOutletContext, useNavigate, Link); `../../../../components/Button/Button` (Button); `../../../../components/Pagination/Pagination` (Pagination); `../../../../components/Table/Table` (Table); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../../utils/localDateTime` (toDateTimeInput).

UI elements: PageContent ×1, div ×29, Toolbar ×1, ActionButton ×8, FieldGroup ×16, label ×18, input ×9, select ×6, option ×18, svg ×8, path ×6, h3 ×4, p ×1, Table ×1, thead ×1, tr ×2, th ×8, tbody ×1, td ×8, Link ×1, polyline ×2, circle ×4, line ×4, Pagination ×1, DialogLayer ×1, DialogSurface ×1, h2 ×1, Panel ×3, span ×11, Button ×5, button ×2, FieldRow ×1, ConfirmModal ×1.

Headings: h3: No Administrations Match Your Filters L587; h2: editingAdministration ? 'Edit Administration - Page 1 of 2' : formPage === 1 ? 'Create Adm L658; h3: Administration Details L668; h3: Course Details L722; h3: Invite and Share L764.

Actions: + Create Administration L554; [icon/nested] L578; [icon/nested] L628; Delete L634; [icon/nested] L653; [icon/nested] L659; Update L756; Continue L758; [icon/nested] L769; [icon/nested] L781; × L841; × L864; Save as Draft L874; Publish L877; Send Invite L879.

Fields: input L559 [type,placeholder,value,onChange,className]; select L563 [value,onChange,className]; select L571 [value,onChange,className]; input L672 [type,value,onChange,className,placeholder]; select L681 [value,onChange,className,disabled]; select L693 [value,onChange,className,disabled]; select L706 [value,onChange,className,disabled]; select L726 [value,onChange,className,disabled]; input L738 [type,value,onChange,className]; input L747 [type,value,onChange,className]; input L798 [type,value,onChange,placeholder]; input L807 [type,value,onChange,placeholder]; input L816 [type,value,onChange,placeholder]; input L826 [type,value,onChange,placeholder,className]; input L851 [type,value,onChange,placeholder,className].

Conditional states: courses L22, colleges L23, loading L24, filters L25, administrations L30, allAdministrations L31, showCreateModal L32, editingAdministration L33, formPage L34, currentPage L35, pageSize L36, totalCount L37, formData L38, errors L54, groups L55, availableGroups L56, groupSearch L57, userSearch L58, availableUsers L59, administrationToDelete L60.

Signals: toast, loading, empty, error, validation, tables, cards.

Overlay sites: DialogLayer L650 className="modal-overlay" onClick={handleCancel}; DialogSurface L651 className="modal-content create-administration-modal" onClick={e => e.stopPropagation()}; ConfirmModal L886 isOpen={!!administrationToDelete} onClose={() => setAdministrationToDelete(null)} onConfirm={async () => { if (!administrationToDelete?.id) return; try { const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.DELETE(administrationToDelete.id) title="Delete Course Delivery" message={administrationToDelete ? `Are you sure you want to delete "${administrationToDelete.administrationName}"? This action cannot be undone.` : 'Are you sure you want to delete confirmText="Delete" cancelText="Cancel".

## src/features/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration.jsx

Dependencies: `../../../../../design/Primitives` (ActionButton, Panel, FieldGroup, FieldRow, PageContent, Toolbar); `react` (useState, useEffect); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../../../contexts/ApiContext` (useApi); `../../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES).

UI elements: PageContent ×1, Toolbar ×1, ActionButton ×7, svg ×4, polyline ×2, span ×15, div ×23, form ×2, Panel ×3, h2 ×3, FieldGroup ×13, label ×15, input ×8, select ×4, option ×13, button ×2, path ×4, circle ×2, FieldRow ×1.

Headings: h2: Administration Details L280; h2: Course Details L334; h2: Invite and Share L377.

Actions: Back L270; Cancel L368; Continue L371; [icon/nested] L382; [icon/nested] L394; × L479; × L502; Back L512; loading ? 'Creating...' : 'Send Invite' L515.

Fields: input L284 [type,value,onChange,className,placeholder]; select L293 [value,onChange,className]; select L305 [value,onChange,className]; select L318 [value,onChange,className]; select L338 [value,onChange,className]; input L350 [type,value,onChange,className]; input L359 [type,value,onChange,className]; input L411 [type,value,onChange,placeholder]; input L420 [type,value,onChange,placeholder]; input L429 [type,value,onChange,placeholder]; input L439 [type,value,onChange,placeholder,className]; input L489 [type,value,onChange,placeholder,className].

Conditional states: courses L13, colleges L14, formPage L15, formData L16, errors L32, availableGroups L33, groupSearch L34, userSearch L35, availableUsers L36, loading L37.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx

Dependencies: `../../../../../design/Dialog` (DialogLayer, DialogSurface); `../../../../../design/Primitives` (PageContent, ActionButton, Toolbar); `../../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect); `react-router-dom` (useParams, useNavigate, Link); `react-toastify` (toast); `../../../../../contexts/ApiContext` (useApi); `../../../../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×3, div ×63, p ×6, ActionButton ×6, Toolbar ×1, svg ×9, polyline ×5, path ×6, circle ×1, h3 ×3, label ×17, span ×43, Link ×1, h2 ×2, h4 ×1, h5 ×1, DialogLayer ×1, DialogSurface ×1, line ×2, pre ×1, code ×1, rect ×1.

Headings: h3: Student Information L143; h3: Course & Administration Details L182; h2: Course Progress Overview L214; h2: Topic-wise Progress L258; h4: topic.name || topic.title L268; h5: segment.title || segment.name L318; h3: codeModalData.questionName L411.

Actions: Go Back L114; Back to Administration L127; View Code L375; [icon/nested] L422; Copy Code L435; Close L445.

Fields: .

Conditional states: loading L20, reportData L21, expandedTopics L22, expandedSegments L23, codeModalData L24.

Signals: toast, loading, empty, error, inlineStyles.

Overlay sites: DialogLayer L407 className={styles.codeModalOverlay} onClick={() => setCodeModalData(null)}; DialogSurface L408 className={styles.codeModal} onClick={e => e.stopPropagation()}.

## src/features/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx

Dependencies: `../../../../../design/Primitives` (PageContent, ActionButton, FieldGroup, Toolbar); `react` (useState, useEffect); `react-router-dom` (useParams, useNavigate, useOutletContext); `react-toastify` (toast); `../../../../../components/Button/Button` (Button); `../../../../../components/LessonModal/LessonModal` (LessonModal); `../../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../../../contexts/ApiContext` (useApi); `../../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES); `../../../../../utils/uploadUtils.js` (uploadLessonMediaFiles).

UI elements: PageContent ×2, Toolbar ×1, ActionButton ×9, svg ×21, path ×25, div ×60, strong ×1, Button ×18, button ×6, line ×10, h3 ×6, p ×13, FieldGroup ×7, label ×14, span ×16, input ×6, textarea ×3, h4 ×1, rect ×2, h5 ×2, circle ×2, polyline ×4, small ×1, select ×1, option ×6, img ×1, ConfirmModal ×2, LessonModal ×1.

Headings: h3: No Sections Added L472; h3: editingSection ? 'Edit Section' : 'Add Section' L479; h4: section.name L512; h5: lesson.name L588; h5: segment.name L684; h3: Edit Course Details L783; h3: Thumbnail L842; h3: Course Progression L866; h3: Tags L885.

Actions: [icon/nested] L427; Edit Course L431; Edit Course L433; Cancel L436; Save Changes L439; Save as Draft L443; Save and Publish L446; Section Details L452; Course Details L455; Settings L458; Add Section L474; Cancel L495; editingSection ? 'Update Section' : 'Add Section' L498; Add Section L504; [icon/nested] L517; [icon/nested] L526; Lessons L543; Practice L551; Assessment L560; Add Lesson L573; [icon/nested] L592; [icon/nested] L618; [icon/nested] L643; Manage Practice Problems L671; [icon/nested] L706; Add Assessment L728; Edit Course L755; Edit Course L757; Cancel L827; Update Course L830; Remove L846; Add Tag L889; × L894.

Fields: input L482 [type,value,onChange,placeholder]; textarea L489 [value,onChange,placeholder,rows]; input L786 [type,value,onChange,placeholder,disabled,readOnly]; input L793 [type,value,onChange,placeholder,disabled,readOnly]; textarea L800 [value,onChange,placeholder,rows,disabled,readOnly]; select L807 [value,onChange,disabled]; textarea L821 [value,onChange,placeholder,rows,disabled,readOnly]; input L853 [type,accept,onChange]; input L875 [type,aria-label,checked,onChange,disabled]; input L888 [type,value,onChange,onKeyPress,placeholder].

Conditional states: activeTab L23, course L24, sections L25, sectionLessons L26, loading L27, saving L28, showSectionForm L29, sectionForm L30, editingSection L34, editMode L35, courseForm L36, thumbnail L44, tags L45, newTag L46, expandedSections L47, sectionContentTabs L48, sectionPracticeSegments L49, showLessonModal L50, selectedSectionId L51, editingLesson L52, savingLesson L53, lessonSaveProgress L54, lessonSaveStatus L55, showDeleteConfirm L56, lessonToDelete L57, sectionIdForDelete L58, showDeleteSectionConfirm L59, sectionToDelete L60.

Signals: toast, loading, empty, error, validation, tabs.

Overlay sites: ConfirmModal L906 isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setLessonToDelete(null); setSectionIdForDelete(null); }} onConfirm={async () => { try { const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.SEGMENTS.DELETE(lessonToDelete.id)}`, { method: 'DELETE', headers: { 'Content-Type': 'appl title="Delete Lesson" message={`Are you sure you want to delete "${lessonToDelete?.name}"?\n This action cannot be undone.`} confirmText="Delete" cancelText="Cancel"; LessonModal L933 isOpen={showLessonModal} editingLesson={editingLesson} isSaving={savingLesson} saveProgress={lessonSaveProgress} saveStatus={lessonSaveStatus} onClose={() => { if (!savingLesson) { setShowLessonModal(false); setSelectedSectionId(null); setEditingLesson(null); } }} onAdd={async lessonData => { if (!selectedSectionId) { toast.error('Missing required field: Please select a topic/section'); return; } const selectedSection = sections.find(s => s. sectionId={selectedSectionId}; ConfirmModal L1089 isOpen={showDeleteSectionConfirm} onClose={() => { setShowDeleteSectionConfirm(false); setSectionToDelete(null); }} onConfirm={confirmDeleteSection} title="Delete Section" message={`Are you sure you want to delete this section? All lessons in this section will also be deleted. This action cannot be undone.`} confirmText="Delete" cancelText="Cancel".

## src/features/admin/courses/CoursesManagement/CoursesManagement.jsx

Dependencies: `../../../../design/Primitives` (FieldGroup, PageContent, Toolbar); `../../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useOutletContext, useNavigate); `../../../../components/Pagination/Pagination` (Pagination); `../../../../components/Button/Button` (Button); `../../../../components/CourseCard/CourseCard` (CourseCard); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: PageContent ×1, div ×16, Button ×5, FieldGroup ×8, label ×8, input ×3, select ×4, option ×14, svg ×2, path ×3, line ×3, h3 ×1, p ×1, CourseCard ×1, Pagination ×1, DialogLayer ×1, DialogSurface ×1, h2 ×1, span ×5, textarea ×2, ConfirmModal ×1.

Headings: h3: No Courses Found L343; h2: Create New Course L360.

Actions: Create Course L296; [icon/nested] L321; Cancel L421; Save as Draft L424; Continue L427.

Fields: input L302 [type,className,placeholder,value,onChange]; select L308 [className,value,onChange]; select L315 [className,value,onChange]; input L364 [type,value,onChange,className,placeholder]; select L373 [value,onChange,className]; input L381 [type,value,onChange,placeholder,className]; select L388 [value,onChange,className]; textarea L404 [value,onChange,className,placeholder,rows]; textarea L413 [value,onChange,className,placeholder,rows].

Conditional states: courses L21, loading L22, search L23, selectedCategory L24, selectedStatus L25, currentPage L26, pageSize L27, totalCount L28, showCreateModal L30, courseToDelete L31, categories L32, newCategory L33, showNewCategoryInput L34, formData L35, errors L43.

Signals: toast, loading, empty, error, validation, cards, inlineStyles.

Overlay sites: DialogLayer L358 className="modal-overlay" onClick={handleCancel}; DialogSurface L359 className="modal-content create-course-modal" onClick={e => e.stopPropagation()}; ConfirmModal L433 isOpen={!!courseToDelete} onClose={() => setCourseToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Course" message={courseToDelete ? `Are you sure you want to delete "${courseToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this course?'} confirmText="Delete" cancelText="Cancel".

## src/features/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, Toolbar); `react` (useState, useEffect); `react-router-dom` (useNavigate, useParams, useSearchParams, useOutletContext); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES); `../../../../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: PageContent ×2, div ×39, Toolbar ×1, ActionButton ×9, svg ×9, polyline ×2, line ×9, Panel ×1, h2 ×2, FieldGroup ×2, label ×2, span ×20, input ×2, textarea ×1, h3 ×4, p ×6, path ×6, rect ×1, button ×2, circle ×1, small ×1, ConfirmModal ×2.

Headings: h2: editingSegment ? 'Edit Practice Segment' : 'Create Practice Segment' L350; h3: Practice Segments L389; h3: Select a Practice Segment L432; h2: practiceSegment.name L437; h3: Current Questions L458; h3: Add Questions L515.

Actions: Back to Course L327; New Practice Segment L332; Cancel L369; saving ? 'Saving...' : editingSegment ? 'Update' : 'Create' L379; [icon/nested] L402; [icon/nested] L408; Programming Questions L445; MCQ Questions L449; [icon/nested] L472; [icon/nested] L496; Add L535.

Fields: input L355 [type,value,onChange,placeholder,className]; textarea L362 [value,onChange,placeholder,className,rows]; input L521 [type,placeholder,value,onChange].

Conditional states: loading L23, saving L24, topic L25, practiceSegment L26, practiceSegments L27, activeTab L28, showSegmentForm L29, segmentFormData L30, editingSegment L34, availableQuestions L35, loadingQuestions L36, searchQuery L37, selectedQuestions L38, deleteModal L39.

Signals: toast, loading, empty, error, validation, tabs, cards.

Overlay sites: ConfirmModal L555 isOpen={deleteModal.show && deleteModal.type === 'segment'} onClose={() => setDeleteModal({ show: false, type: '', item: null })} onConfirm={handleDeleteSegment} title="Delete Practice Segment" message={`Are you sure you want to delete "${deleteModal.item?.name}"? All associated question links will be removed. This action cannot be undone.`} confirmText="Delete" confirmStyle="danger"; ConfirmModal L561 isOpen={deleteModal.show && (deleteModal.type === 'programming' || deleteModal.type === 'mcq')} onClose={() => setDeleteModal({ show: false, type: '', item: null })} onConfirm={handleRemoveQuestion} title="Remove Question" message={`Are you sure you want to remove "${deleteModal.item?.name}" from this practice segment?`} confirmText="Remove" confirmStyle="danger".

## src/features/admin/Groups/CreateGroup/CreateGroup.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, Toolbar); `react` (useState, useEffect); `react-router-dom` (useNavigate, useParams); `react-toastify` (toast); `../../../../components/Pagination/Pagination` (Pagination); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES); `../../../../components/ThemedSelect/ThemedSelect` (ThemedSelect).

UI elements: PageContent ×2, Toolbar ×2, div ×24, ActionButton ×7, svg ×1, polyline ×1, form ×1, Panel ×2, h2 ×2, FieldGroup ×5, label ×7, span ×7, input ×8, select ×1, option ×2, small ×1, ThemedSelect ×2, p ×1, strong ×2, h3 ×2, Pagination ×2.

Headings: h2: Group Details L338; h2: Select Students for Group L407; h3: Available Students ( filteredLeftStudents.length ) L416; h3: Selected Students ( filteredRightStudents.length ) L451.

Actions: Back L327; Cancel L398; Next L401; → L441; ← L444; Back L477; loading ? isEditing ? 'Updating...' : 'Creating...' : isEditing ? 'Update Group' : 'Create L480.

Fields: input L344 [type,name,value,onChange,className,placeholder]; select L352 [name,value,onChange,className,disabled]; ThemedSelect L365 [name,value,onChange,className,options]; ThemedSelect L379 [name,value,onChange,className,options]; input L393 [type,name,value,onChange,placeholder,min,max]; input L418 [type,checked,ref,onChange]; input L424 [type,placeholder,value,onChange,className]; input L427 [type,aria-label,checked,onClick,onChange]; input L453 [type,checked,ref,onChange]; input L459 [type,placeholder,value,onChange,className]; input L462 [type,aria-label,checked,onClick,onChange].

Conditional states: institutions L19, formPage L20, formData L21, errors L28, selectedStudentIds L29, availableStudents L30, groupStudents L31, initialMemberIds L32, searchLeft L33, searchRight L34, leftPage L35, rightPage L36, leftPageSize L37, rightPageSize L38, loading L39, pageLoading L40, catalogDepartments L41, catalogDegrees L42.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/admin/Groups/Groups.jsx

Dependencies: `../../../design/Primitives` (ActionButton, Toolbar, FieldGroup, PageContent); `react` (useState, useEffect); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../components/Pagination/Pagination` (Pagination); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../components/Table/Table` (Table); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES).

UI elements: PageContent ×1, div ×10, Toolbar ×1, ActionButton ×4, FieldGroup ×2, label ×2, select ×1, option ×2, input ×1, svg ×2, path ×4, circle ×1, h3 ×1, p ×1, Table ×1, thead ×1, tr ×2, th ×8, tbody ×1, td ×8, Pagination ×1, ConfirmModal ×1.

Headings: h3: No Groups Found L169.

Actions: + Create Group L135; [icon/nested] L151; Edit L195; Delete L198.

Fields: select L140 [value,onChange,className]; input L149 [type,placeholder,value,onChange,className].

Conditional states: groups L16, allGroups L17, colleges L18, loading L19, filters L20, currentPage L24, pageSize L25, showDeleteModal L26, groupToDelete L27.

Signals: toast, loading, empty, error, tables.

Overlay sites: ConfirmModal L213 isOpen={showDeleteModal} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} title="Delete Group" message={groupToDelete ? `Are you sure you want to delete "${groupToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this group? This action cannot  confirmText="Delete" cancelText="Cancel".

## src/features/admin/Institutions/CreateInstitution/CreateInstitution.jsx

Dependencies: `../../../../design/Primitives` (ActionButton, Panel, FieldGroup, FieldRow, PageContent, Toolbar); `react` (useState); `react-router-dom` (useNavigate); `react-redux` (useDispatch); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (SUCCESS_MESSAGES, ERROR_MESSAGES); `../../../../store/masterDataSlice.js` (invalidateInstitutions); `../../../../pages/admin/Institutions/createInstitutionLogic.js` (INSTITUTIONS_LIST_ROUTE, emptyCreateInstitutionForm, validateCreateInstitutionForm, getCreateInstitutionRequest).

UI elements: PageContent ×1, Toolbar ×1, ActionButton ×3, svg ×1, polyline ×1, div ×3, form ×1, Panel ×2, h2 ×2, FieldGroup ×8, label ×8, span ×7, input ×6, select ×1, option ×2, textarea ×1, FieldRow ×1, p ×1.

Headings: h2: Institution Details L90; h2: College Admin Details L130.

Actions: Back L80; loading ? 'Creating...' : 'Create Institution' L152; Cancel L155.

Fields: input L94 [type,name,value,onChange,className,placeholder]; select L100 [name,value,onChange]; textarea L108 [name,value,onChange,rows,placeholder]; input L114 [type,name,value,onChange,placeholder]; input L118 [type,name,value,onChange,placeholder]; input L124 [type,name,value,onChange,className,placeholder]; input L134 [type,name,value,onChange,className,placeholder]; input L140 [type,name,value,onChange,className,placeholder].

Conditional states: formData L17, errors L18, loading L19.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow, Toolbar); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate); `react-redux` (useDispatch); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES); `../../../../store/masterDataSlice.js` (invalidateInstitutions).

UI elements: PageContent ×2, div ×8, Toolbar ×1, ActionButton ×4, svg ×1, polyline ×1, strong ×1, form ×1, Panel ×4, h2 ×4, FieldGroup ×8, label ×8, span ×10, input ×6, select ×1, option ×2, textarea ×1, FieldRow ×1, p ×3, dl ×1, dt ×5, dd ×5, ul ×1, li ×1.

Headings: h2: Institution L189; h2: College admin L227; h2: Institution L260; h2: College admins L290.

Actions: Back L177; Edit L182; saving ? 'Saving…' : 'Save changes' L251; Cancel L254.

Fields: input L194 [type,name,value,onChange,className]; select L199 [name,value,onChange]; textarea L207 [name,value,onChange,rows,placeholder]; input L212 [type,name,value,onChange,placeholder]; input L216 [type,name,value,onChange,placeholder]; input L221 [type,name,value,onChange,className,placeholder]; input L232 [type,name,value,onChange,className]; input L239 [type,name,value,onChange,className].

Conditional states: loading L29, saving L30, institution L31, admins L32, isEditing L33, formData L34, errors L35.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/admin/Institutions/Institutions.jsx

Dependencies: `../../../design/Primitives` (ActionButton, Toolbar, FieldGroup, PageContent); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Table/Table` (Table); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS, ERROR_MESSAGES); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../pages/admin/Institutions/createInstitutionLogic.js` (CREATE_INSTITUTION_ROUTE).

UI elements: PageContent ×1, div ×10, Toolbar ×1, ActionButton ×4, FieldGroup ×1, label ×1, input ×1, svg ×2, path ×2, polyline ×2, h3 ×1, p ×1, Table ×1, thead ×1, tr ×2, th ×4, tbody ×1, td ×4, span ×1, Pagination ×1, ConfirmModal ×1.

Headings: h3: No Institutions Found L130.

Actions: + Create Institution L106; [icon/nested] L113; View L152; Delete L155.

Fields: input L111 [type,placeholder,value,onChange,className].

Conditional states: institutions L17, loading L18, search L19, currentPage L20, pageSize L21, totalCount L22, institutionToDelete L23.

Signals: toast, loading, empty, error, tables.

Overlay sites: ConfirmModal L169 isOpen={!!institutionToDelete} onClose={() => setInstitutionToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Institution" message={institutionToDelete ? `Are you sure you want to delete "${institutionToDelete.name}"? Its institution admin account will also be deleted. This action cannot be undone.` :  confirmText="Delete" cancelText="Cancel".

## src/features/admin/MailerTemplates/MailerTemplateDetail.jsx

Dependencies: `../../../design/Primitives` (PageContent, ActionButton, Panel, Toolbar); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate, useLocation); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `./MailerTemplateForm` (MailerTemplateForm); `../../../pages/admin/MailerTemplates/mailerTemplateConstants.js` (templateToFormData, validateMailerTemplateForm).

UI elements: PageContent ×3, div ×14, Toolbar ×2, ActionButton ×4, Panel ×2, MailerTemplateForm ×1, strong ×1, span ×10, label ×7, code ×1, pre ×1.

Headings: .

Actions: ← Back to template L136; ← All templates L145; Edit L195; Close L198.

Fields: .

Conditional states: template L33, loading L34, formData L35, errors L36, saving L37.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/admin/MailerTemplates/MailerTemplateForm.jsx

Dependencies: `../../../design/Primitives` (FieldRow, FieldGroup, Panel, ActionButton); `react` (useMemo); `../../../components/ThemedSelect/ThemedSelect` (ThemedSelect); `../../../pages/admin/MailerTemplates/mailerTemplateConstants.js` (TEMPLATE_TYPES, TEMPLATE_FORMATS).

UI elements: form ×1, FieldRow ×5, FieldGroup ×18, label ×18, input ×13, small ×2, span ×4, ThemedSelect ×2, textarea ×3, Panel ×1, div ×1, ActionButton ×2.

Headings: .

Actions: submitLabel L128; Cancel L131.

Fields: input L27 [type,name,value,onChange,className,placeholder,disabled]; input L33 [type,name,value,onChange,className,placeholder]; ThemedSelect L41 [name,value,onChange,className,options]; input L45 [type,name,value,onChange,placeholder]; input L49 [type,name,value,onChange,placeholder]; textarea L55 [name,value,onChange,rows,placeholder]; input L61 [type,name,value,onChange,className,placeholder]; input L66 [type,name,value,onChange,placeholder]; textarea L72 [name,value,onChange,rows,className,placeholder]; textarea L78 [name,value,onChange,rows,className,placeholder]; ThemedSelect L84 [name,value,onChange,className,options]; input L88 [type,name,checked,onChange]; input L94 [type,name,checked,onChange]; input L102 [type,name,value,onChange,placeholder]; input L108 [type,name,value,onChange,placeholder]; input L115 [type,name,value,onChange,placeholder]; input L119 [type,name,value,onChange,placeholder]; input L123 [type,name,value,onChange,placeholder].

Conditional states: .

Signals: error, cards.

Overlay sites: .

## src/features/admin/MailerTemplates/MailerTemplates.jsx

Dependencies: `../../../design/Primitives` (ActionButton, Panel, FieldGroup, PageContent, Toolbar); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Table/Table` (Table); `../../../contexts/ApiContext` (useApi); `./MailerTemplateForm` (MailerTemplateForm); `../../../pages/admin/MailerTemplates/mailerTemplateConstants.js` (emptyFormState, validateMailerTemplateForm); `../../../components/ThemedSelect/ThemedSelect` (ThemedSelect); `../../../hooks/useConfirmModal` (useConfirmModal).

UI elements: PageContent ×1, Panel ×1, h2 ×2, MailerTemplateForm ×1, div ×19, ActionButton ×9, FieldGroup ×4, label ×4, input ×2, ThemedSelect ×2, svg ×7, path ×6, polyline ×3, h3 ×1, p ×2, Table ×1, thead ×1, tr ×2, th ×7, tbody ×1, td ×7, span ×4, code ×1, circle ×2, polygon ×1, line ×1, Pagination ×1, DialogLayer ×1, DialogSurface ×1, h4 ×3, ConfirmDialog ×1.

Headings: h2: Create New Template L309; h3: No Templates Found L355; h2: Preview Template L445; h4: Set Variable Values: L448; h4: Subject: L463; h4: HTML Preview: L467.

Actions: showForm ? 'Cancel' : '+ Create Template' L319; Clear filters L337; [icon/nested] L394; [icon/nested] L400; [icon/nested] L405; template.is_active ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidt L411; [icon/nested] L420; Render Preview L459; Close L475.

Fields: input L327 [id,type,placeholder,value,onChange,className]; ThemedSelect L331 [id,name,value,onChange,size,className,options]; ThemedSelect L335 [id,name,value,onChange,size,className,options]; input L452 [type,value,onChange,placeholder].

Conditional states: templates L53, loading L54, search L55, typeFilter L56, activeFilter L57, currentPage L58, pageSize L59, totalCount L60, showForm L64, showPreviewModal L65, previewTemplate L66, previewData L67, renderedPreview L68, formData L69, errors L70.

Signals: toast, loading, empty, error, validation, tables, cards.

Overlay sites: DialogLayer L440 className="modal-overlay" onClick={() => { setShowPreviewModal(false); setPreviewTemplate(null); }}; DialogSurface L444 className="modal-content preview-modal" onClick={e => e.stopPropagation()}; ConfirmDialog L482 .

## src/features/admin/Questions/QuestionBankDetail.jsx

Dependencies: `../../../design/Primitives` (PageContent, ActionButton, Panel, Toolbar); `react` (useState, useEffect, useLayoutEffect, useCallback, useRef); `react-router-dom` (useNavigate, useParams); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Table/Table` (Table).

UI elements: PageContent ×3, div ×11, Toolbar ×1, ActionButton ×5, svg ×8, polyline ×1, strong ×1, span ×7, path ×9, circle ×3, line ×4, Panel ×3, h2 ×3, p ×1, Table ×1, thead ×1, tr ×2, th ×7, tbody ×1, td ×7, Pagination ×1.

Headings: h2: Description L189; h2: Tags L196; h2: Questions ( questionsTotal ) L210.

Actions: Back L168; Edit L180; Add Question L211; [icon/nested] L263; [icon/nested] L272.

Fields: .

Conditional states: pageLoading L18, questionsLoading L19, questionBank L20, questions L21, questionsTotal L22, questionsPage L23, pageSize L24.

Signals: toast, loading, empty, error, tables, cards, inlineStyles.

Overlay sites: .

## src/features/admin/Questions/QuestionBankForm.jsx

Dependencies: `../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow, Toolbar); `react` (useState, useEffect); `react-redux` (useDispatch); `../../../store/masterDataSlice` (invalidateQuestionBanks); `react-router-dom` (useNavigate, useParams); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS); `../../../components/Dropdown/Dropdown` (Dropdown); `../../../components/Toggle/Toggle` (Toggle); `../../../components/RichTextEditor/RichTextEditor` (RichTextEditor).

UI elements: PageContent ×2, div ×3, Toolbar ×1, ActionButton ×3, svg ×1, polyline ×1, form ×1, Panel ×2, h2 ×2, FieldGroup ×8, label ×2, span ×3, input ×1, RichTextEditor ×1, FieldRow ×2, Dropdown ×5, Toggle ×1.

Headings: h2: Basic Information L187; h2: Settings L201.

Actions: Back L178; Cancel L238; saving ? 'Saving...' : isEditing ? 'Update Question Bank' : 'Create Question Bank' L241.

Fields: input L191 [type,value,onChange,placeholder,className]; Dropdown L205 [label,options,value,onChange,placeholder,searchable]; Dropdown L209 [label,options,value,onChange,placeholder,required]; Dropdown L215 [label,options,value,onChange,placeholder]; Dropdown L219 [label,options,value,onChange,placeholder,searchable]; Dropdown L224 [label,options,value,onChange,placeholder,multiple,searchable,renderOption].

Conditional states: loading L23, saving L24, institutions L25, statuses L26, levels L27, categories L28, tags L29, formData L30.

Signals: toast, loading, error, validation, cards, inlineStyles.

Overlay sites: .

## src/features/admin/Questions/QuestionBanks.jsx

Dependencies: `../../../design/Primitives` (ActionButton, FieldGroup, PageContent, Toolbar); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Table/Table` (Table); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../pages/admin/Questions/questionUtils.js` (stripHtml).

UI elements: PageContent ×1, div ×7, ActionButton ×4, svg ×4, line ×2, FieldGroup ×1, label ×1, input ×1, path ×4, polyline ×1, h3 ×1, p ×1, Table ×1, thead ×1, tr ×2, th ×7, tbody ×1, td ×7, span ×1, circle ×1, Pagination ×1, ConfirmModal ×1.

Headings: h3: No Question Banks Found L133.

Actions: Create Question Bank L114; [icon/nested] L164; [icon/nested] L173; Delete L182.

Fields: input L123 [type,placeholder,value,onChange,className].

Conditional states: questionBanks L17, loading L18, search L19, currentPage L20, pageSize L21, totalCount L22, bankToDelete L23.

Signals: toast, loading, empty, error, tables.

Overlay sites: ConfirmModal L198 isOpen={!!bankToDelete} onClose={() => setBankToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Question Bank" message={bankToDelete ? `Are you sure you want to delete "${bankToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this question bank?'} confirmText="Delete" cancelText="Cancel".

## src/features/admin/Questions/QuestionDetail.jsx

Dependencies: `../../../design/Primitives` (PageContent, ActionButton, Panel, Toolbar); `react` (useState, useEffect); `react-router-dom` (useNavigate, useParams); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×3, div ×38, Toolbar ×1, ActionButton ×3, svg ×6, polyline ×4, strong ×1, span ×31, path ×4, Panel ×9, h2 ×8, h3 ×6, p ×2, pre ×4, line ×2.

Headings: h2: Problem Description L105; h2: Scoring & Time L113; h2: Tags L132; h2: Help & Explanation L146; h3: Hint L148; h3: Explanation L152; h2: Answer Options ( options.length ) L161; h2: Programming Configuration L180; h3: Allowed Languages L201; h2: Sample Input/Output L212; h3: Sample Input L215; h3: Sample Output L219; h3: Constraints L224; h2: Test Cases ( testCases.length ) L232.

Actions: Back L88; Edit L95; Manage Test Cases L233.

Fields: .

Conditional states: loading L16, question L17, programmingQuestion L18, testCases L19, options L20.

Signals: toast, loading, empty, error, cards, inlineStyles.

Overlay sites: .

## src/features/admin/Questions/QuestionForm.jsx

Dependencies: `../../../utils/spreadsheetImport` (uploadSpreadsheet); `../../../design/Primitives` (PageContent, ActionButton, Panel, FieldGroup, FieldRow, Toolbar); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useRef); `react-router-dom` (useNavigate, useParams, useSearchParams); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../hooks/useMasterData.js` (useAutoLoadMasterData); `../../../constants/constants.js` (API_ENDPOINTS, DEFAULT_CODE_TEMPLATES, LANGUAGE_KEY_MAP); `../../../components/Dropdown/Dropdown` (Dropdown); `../../../components/Toggle/Toggle` (Toggle); `../../../components/RichTextEditor/RichTextEditor` (RichTextEditor).

UI elements: PageContent ×2, div ×35, Toolbar ×1, ActionButton ×16, svg ×18, polyline ×15, Panel ×14, h2 ×10, p ×13, circle ×1, path ×12, rect ×4, span ×10, form ×2, button ×4, h3 ×2, line ×11, FieldGroup ×25, label ×18, input ×12, RichTextEditor ×1, FieldRow ×6, Dropdown ×6, textarea ×7, Toggle ×2, DialogLayer ×1, DialogSurface ×1, strong ×2, ul ×1, li ×2.

Headings: h2: Select Question Type L534; h3: Bulk Upload MCQ Questions L592; h3: Bulk Upload Programming Questions L623; h2: Basic Information L651; h2: Classification L665; h2: Scoring & Time L698; h2: Additional Information L719; h2: Programming Configuration L740; h2: Sample I/O & Constraints L777; h2: Code Templates (Starter Code) L799; h2: Answer Options L868; h2: bulkUploadType === 'programming' ? 'Bulk Upload Programming Questions' : 'Bulk Upload MCQ  L942.

Actions: returnTo ? 'Back to Assessment' : 'Back to Questions' L525; [icon/nested] L537; Basic Details L566; Programming Details L572; Options ( options.length ) L578; Download Template L596; Bulk Upload L604; Download Template L627; Bulk Upload L635; [icon/nested] L831; Add Option L869; [icon/nested] L889; Previous L909; Cancel L919; Next: isProgramming() ? 'Programming Details' : 'Options' L923; saving ? 'Saving...' : isEditing ? 'Update Question' : 'Create Question' L932; bulkUploadFile ? bulkUploadFile.name : 'Choose File' L971; [icon/nested] L984; bulkUploadResult?.created > 0 ? 'Done' : 'Cancel' L1005; bulkUploadLoading ? 'Uploading...' : 'Upload Questions' L1008.

Fields: input L655 [type,value,onChange,placeholder,className]; Dropdown L669 [label,options,value,onChange,placeholder]; Dropdown L673 [label,options,value,onChange,placeholder,searchable]; Dropdown L677 [label,options,value,onChange,placeholder,required]; Dropdown L683 [label,options,value,onChange,placeholder,searchable]; Dropdown L687 [label,options,value,onChange,placeholder,multiple,searchable,onCreateNew,renderOption]; input L703 [type,value,onChange,className,min]; input L708 [type,value,onChange,className,min]; input L713 [type,value,onChange,placeholder,className,min]; textarea L723 [value,onChange,placeholder,className,rows]; input L728 [type,value,onChange,placeholder,className]; Dropdown L743 [label,options,value,onChange,placeholder,multiple,searchable,required]; input L749 [type,value,onChange,placeholder,className,min]; input L754 [type,value,onChange,placeholder,className,min]; input L759 [type,value,onChange,placeholder,className,min,max]; input L766 [type,value,onChange,placeholder,className,min]; input L771 [type,value,onChange,placeholder,className,min]; textarea L781 [value,onChange,placeholder,className,rows]; textarea L787 [value,onChange,placeholder,className,rows]; textarea L792 [value,onChange,placeholder,className,rows]; textarea L851 [value,onChange,placeholder,className,rows]; textarea L855 [value,onChange,placeholder,className,rows]; textarea L897 [value,onChange,placeholder,className,rows]; input L900 [type,value,onChange,placeholder,className]; input L970 [ref,type,accept,onChange,hidden,tabIndex].

Conditional states: step L29, loading L30, saving L31, formData L52, expandedTemplates L80, options L81, showBulkUploadModal L92, bulkUploadFile L93, bulkUploadLoading L94, bulkUploadResult L95, bulkUploadType L96.

Signals: toast, loading, empty, error, validation, cards, inlineStyles.

Overlay sites: DialogLayer L940 className="modal-overlay" onClick={closeBulkUploadModal}; DialogSurface L941 className="modal-content bulk-upload-modal" onClick={e => e.stopPropagation()}.

## src/features/admin/Questions/QuestionList.jsx

Dependencies: `../../../design/Primitives` (ActionButton, FieldGroup, PageContent, Toolbar); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../hooks/useMasterData.js` (useAutoLoadMasterData); `../../../constants/constants.js` (API_ENDPOINTS); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Dropdown/Dropdown` (Dropdown); `../../../components/Table/Table` (Table); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: PageContent ×1, div ×7, ActionButton ×4, svg ×4, line ×5, FieldGroup ×4, label ×1, input ×1, Dropdown ×3, circle ×1, path ×3, h3 ×1, p ×1, Table ×1, thead ×1, tr ×2, th ×8, tbody ×1, td ×8, span ×3, Pagination ×1, ConfirmModal ×1.

Headings: h3: No Questions Found L198.

Actions: Create Question L162; Clear L182; [icon/nested] L237; Delete L246.

Fields: input L171 [type,placeholder,value,onChange,className]; Dropdown L174 [label,options,value,onChange,placeholder]; Dropdown L177 [label,options,value,onChange,placeholder]; Dropdown L180 [label,options,value,onChange,placeholder].

Conditional states: questions L18, loading L19, search L20, currentPage L21, pageSize L22, totalCount L23, selectedType L29, selectedLevel L30, selectedStatus L31, questionToDelete L32.

Signals: toast, loading, empty, error, tables.

Overlay sites: ConfirmModal L262 isOpen={!!questionToDelete} onClose={() => setQuestionToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Question" message={questionToDelete ? `Are you sure you want to delete "${questionToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this question?'} confirmText="Delete" cancelText="Cancel".

## src/features/admin/Questions/TestCaseManager.jsx

Dependencies: `../../../utils/spreadsheetImport` (uploadSpreadsheet); `../../../design/Primitives` (PageContent, ActionButton, Panel, FieldRow, FieldGroup, Toolbar); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useRef); `react-router-dom` (useNavigate, useParams); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS); `../../../components/Toggle/Toggle` (Toggle); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: PageContent ×2, div ×25, Toolbar ×1, ActionButton ×15, svg ×13, polyline ×5, span ×13, path ×14, line ×11, Panel ×2, h2 ×3, form ×2, FieldRow ×3, FieldGroup ×10, label ×7, input ×5, textarea ×2, Toggle ×3, rect ×1, h3 ×1, p ×7, pre ×2, circle ×2, DialogLayer ×1, DialogSurface ×1, strong ×1, ul ×1, li ×2, ConfirmModal ×1.

Headings: h2: editingTestCase ? 'Edit Test Case' : 'Add New Test Case' L374; h2: Test Cases ( testCases.length ) L437; h3: No Test Cases Yet L446; h2: Bulk Upload Test Cases L536.

Actions: Back to Question L340; Download Template L346; Bulk Upload L354; Add Test Case L362; Cancel L424; saving ? 'Saving...' : editingTestCase ? 'Update Test Case' : 'Create Test Case' L427; Add First Test Case L448; [icon/nested] L495; [icon/nested] L500; [icon/nested] L511; [icon/nested] L517; bulkUploadFile ? bulkUploadFile.name : 'Choose File' L554; [icon/nested] L567; bulkUploadResult?.created > 0 ? 'Done' : 'Cancel' L588; bulkUploadLoading ? 'Uploading...' : 'Upload Test Cases' L591.

Fields: input L382 [type,value,onChange,placeholder,className]; input L386 [type,value,onChange,className,min,step]; input L392 [type,value,onChange,placeholder,className]; textarea L398 [value,onChange,placeholder,className,rows]; textarea L402 [value,onChange,placeholder,className,rows]; input L418 [type,value,onChange,className,min,max]; input L553 [ref,type,accept,onChange,hidden,tabIndex].

Conditional states: loading L20, saving L21, question L22, programmingQuestion L23, testCases L24, showForm L25, editingTestCase L26, formData L27, deleteModal L39, showBulkUploadModal L43, bulkUploadFile L44, bulkUploadLoading L45, bulkUploadResult L46.

Signals: toast, loading, empty, error, validation, cards, inlineStyles.

Overlay sites: DialogLayer L534 className="modal-overlay" onClick={closeBulkUploadModal}; DialogSurface L535 className="modal-content bulk-upload-modal" onClick={e => e.stopPropagation()}; ConfirmModal L600 isOpen={deleteModal.show} onClose={() => setDeleteModal({ show: false, testCase: null })} onConfirm={handleDelete} title="Delete Test Case" message={`Are you sure you want to delete "${deleteModal.testCase?.name}"? This action cannot be undone.`} confirmText="Delete" confirmStyle="danger".

## src/features/admin/Settings/Settings.jsx

Dependencies: `../../../design/Primitives` (ActionButton, DataTable, FieldGroup, PageContent); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect); `react-redux` (useDispatch); `../../../store/masterDataSlice` (invalidateMasterData); `react-router-dom` (useOutletContext, useNavigate); `react-toastify` (toast); `../../../contexts/ApiContext` (useApi); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: svg ×10, path ×12, polyline ×4, circle ×2, line ×4, tr ×2, th ×3, td ×3, span ×3, div ×9, ActionButton ×7, PageContent ×1, aside ×1, nav ×1, section ×1, h2 ×2, p ×2, h3 ×1, DataTable ×1, thead ×1, tbody ×1, DialogLayer ×1, DialogSurface ×1, form ×1, FieldGroup ×2, label ×2, textarea ×1, input ×4, ConfirmModal ×1.

Headings: h2: config.name L387; h3: No config.name Found L403; h2: isEditing ? 'Edit' : 'Add' singularName L423.

Actions: [icon/nested] L352; [icon/nested] L358; value.icon L377; Add singularName L388; Add singularName L405; actionLoading ? 'Saving...' : isEditing ? 'Update' : 'Create' L441; Cancel L444.

Fields: textarea L429 [name,value,onChange,rows]; input L430 [type,name,checked,onChange]; input L433 [type,aria-label,name,value,onChange]; input L434 [type,aria-label,pattern,title,value,onChange,placeholder]; input L438 [type,name,value,onChange,required].

Conditional states: activeTab L177, data L179, loading L180, showModal L181, showDeleteModal L182, selectedItem L183, formData L184, isEditing L185, actionLoading L186.

Signals: toast, loading, empty, error, validation, tabs, inlineStyles.

Overlay sites: DialogLayer L421 className="modal-overlay" onClick={() => setShowModal(false)} busy={actionLoading}; DialogSurface L422 className="modal-content" onClick={e => e.stopPropagation()}; ConfirmModal L453 isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedItem(null); }} onConfirm={handleDeleteConfirm} title={`Delete ${singularName}`} message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel".

## src/features/admin/Users/BulkResetModal.jsx

Dependencies: `../../../design/Primitives` (ActionButton); `../../../design/viewStyles` (createViewStyles); `react` (useEffect, useRef, useState); `../../../design/Dialog` (DialogLayer, DialogSurface); `../../../utils/api.js` (authenticatedFetch); `../../../pages/admin/Users/bulkResetValidation.js` (validateBulkReset).

UI elements: DialogLayer ×1, DialogSurface ×1, header ×1, h2 ×1, ActionButton ×6, form ×1, p ×4, label ×4, input ×3, select ×1, option ×2, div ×2, span ×1, strong ×1, small ×1, footer ×1.

Headings: h2: Bulk reset passwords L104.

Actions: × L105; Retry L122; Previous groups L124; Next groups L126; Cancel L136; busy ? 'Resetting…' : `Reset ${group ? `${group.member_count} users’ ` : ''}passwords` L137.

Fields: input L110 [id,type,value,disabled,placeholder,onChange]; select L115 [id,required,value,disabled,onChange]; input L130 [id,type,autoComplete,required,minLength,value,disabled,onChange,aria-describedby]; input L133 [id,type,autoComplete,required,value,disabled,onChange].

Conditional states: search L16, filter L17, offset L18, groups L19, total L20, group L21, password L22, confirmation L23, loading L24, busy L25, loadError L26, error L27, retry L28.

Signals: loading, empty, error, validation.

Overlay sites: DialogLayer L99 busy={busy} onClose={onClose} className={styles.overlay} onClick={() => { if (!busyRef.current) onClose(); }}; DialogSurface L102 ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="bulk-reset-title" tabIndex={-1} onClick={event => event.stopPropagation()}.

## src/features/admin/Users/CreateUser/CreateUser.jsx

Dependencies: `../../../../design/Primitives` (ActionButton, Panel, FieldGroup, PageContent, Toolbar); `react` (useState, useEffect, useMemo); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES); `../../../../components/ThemedSelect/ThemedSelect` (ThemedSelect).

UI elements: PageContent ×1, Toolbar ×1, ActionButton ×3, svg ×1, polyline ×1, div ×2, form ×1, Panel ×2, h2 ×2, FieldGroup ×8, label ×8, span ×11, input ×4, ThemedSelect ×4.

Headings: h2: User Details L167; h2: Student Details L200.

Actions: Back L157; loading ? 'Creating...' : 'Create User' L238; Cancel L241.

Fields: input L171 [type,name,value,onChange,className,placeholder]; input L177 [type,name,value,onChange,className,placeholder]; ThemedSelect L183 [name,value,onChange,className,options]; ThemedSelect L194 [name,value,onChange,className,options]; input L204 [type,name,value,onChange,className,placeholder]; ThemedSelect L210 [name,value,onChange,className,options]; input L222 [type,name,value,onChange,placeholder]; ThemedSelect L227 [name,value,onChange,className,options].

Conditional states: institutions L14, catalogDepartments L15, catalogDegrees L16, formData L17, errors L27, loading L28.

Signals: toast, loading, error, validation, cards.

Overlay sites: .

## src/features/admin/Users/UserDetail/UserDetail.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, FieldRow, FieldGroup, Toolbar); `../../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect); `react-router-dom` (useParams, useNavigate, useOutletContext); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES); `../../../../components/ThemedSelect/ThemedSelect` (ThemedSelect).

UI elements: div ×46, label ×9, textarea ×1, input ×6, PageContent ×3, p ×4, ActionButton ×9, span ×51, svg ×17, path ×22, Toolbar ×1, strong ×1, rect ×1, section ×13, h2 ×14, circle ×3, a ×3, polyline ×2, line ×4, ReadonlyPlaceholderField ×16, DialogLayer ×2, DialogSurface ×2, form ×2, FieldRow ×3, FieldGroup ×8, ThemedSelect ×3.

Headings: h2: Account Information L316; h2: Academic Information L347; h2: Contact Information L383; h2: Address L410; h2: Social Links L446; h2: Bio L476; h2: Emergency Contact L489; h2: Contact Information L510; h2: Address L525; h2: Social Links L543; h2: Bio L558; h2: Emergency Contact L571; h2: Edit User Details L589; h2: Reset Password L670.

Actions: [icon/nested] L273; [icon/nested] L285; Edit L292; Reset Password L298; resendingOtp ? 'Sending...' : 'Regenerate OTP' L304; saving ? 'Updating...' : 'Update' L656; Cancel L659; resettingPassword ? 'Resetting...' : 'Reset Password' L678; Cancel L681.

Fields: textarea L28 [id,className,readOnly,rows,placeholder,defaultValue,tabIndex]; input L28 [id,type,className,readOnly,placeholder,defaultValue,tabIndex]; input L594 [type,name,value,onChange,required]; input L598 [type,name,value,onChange,required]; input L606 [type,name,value,onChange]; ThemedSelect L610 [name,value,onChange,className,options]; input L626 [type,name,value,onChange]; ThemedSelect L630 [name,value,onChange,className,options]; ThemedSelect L646 [className,name,value,onChange,disabled,aria-label,options]; input L675 [type,value,onChange,placeholder,required,minLength].

Conditional states: user L43, userDetails L44, loading L45, catalogDepartments L46, catalogDegrees L47, showEditModal L48, showResetModal L49, editData L50, resetPassword L51, saving L52, resettingPassword L53, resendingOtp L54.

Signals: toast, loading, empty, error, validation.

Overlay sites: DialogLayer L587 className="modal-overlay" onClick={() => setShowEditModal(false)} busy={saving}; DialogSurface L588 className="modal-content" onClick={e => e.stopPropagation()}; DialogLayer L668 className="modal-overlay" onClick={() => setShowResetModal(false)} busy={resettingPassword}; DialogSurface L669 className="modal-content" onClick={e => e.stopPropagation()}.

## src/features/admin/Users/Users.jsx

Dependencies: `../../../design/Primitives` (ActionButton, Panel, FieldRow, FieldGroup, Toolbar, PageContent); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useRef, useCallback, useMemo); `react-router-dom` (useOutletContext, Link); `react-toastify` (toast); `../../../components/Pagination/Pagination` (Pagination); `../../../components/Table/Table` (Table); `../../../components/ConfirmModal/ConfirmModal` (ConfirmModal); `../../../contexts/ApiContext` (useApi); `../../../hooks/useMasterData.js` (useAutoLoadMasterData); `../../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES); `../../../components/ThemedSelect/ThemedSelect` (ThemedSelect); `./BulkResetModal` (BulkResetModal); `../../../pages/admin/Users/useBulkUploadJob.js` (useBulkUploadJob); `../../../pages/admin/Users/bulkUploadResponse.js` (readUploadResponse); `../../../pages/admin/Users/bulkUploadBatches.js` (buildStudentBatches).

UI elements: PageContent ×1, BulkResetModal ×1, Panel ×1, div ×25, h2 ×4, ActionButton ×18, form ×4, FieldRow ×8, FieldGroup ×21, label ×21, input ×11, span ×7, ThemedSelect ×9, p ×13, small ×3, Toolbar ×1, svg ×5, path ×4, circle ×1, line ×5, h3 ×1, Table ×1, thead ×1, tr ×2, th ×6, tbody ×1, td ×6, Link ×1, polyline ×2, Pagination ×1, DialogLayer ×3, DialogSurface ×3, ul ×1, li ×2, ConfirmModal ×1.

Headings: h2: Create New User L559; h3: No Users Found L715; h2: Edit User Details L767; h2: Reset Password L848; h2: Add Users in Bulk L881.

Actions: Cancel L559; Create User L666; Cancel L667; Bulk reset passwords L683; + Add Users in Bulk L683; showForm ? 'Cancel' : '+ Create User' L685; [icon/nested] L696; [icon/nested] L748; Update L837; Cancel L838; Reset Password L856; Cancel L857; Download Excel Template L891; bulkUploadData.file ? bulkUploadData.file.name : 'Choose File' L919; Check progress L936; [icon/nested] L939; Cancel L959; uploadJob.jobId ? 'Import in progress…' : bulkUploadLoading ? 'Uploading...' : 'Upload Use L972.

Fields: input L564 [type,name,value,onChange,className]; input L570 [type,name,value,onChange,className]; ThemedSelect L578 [name,value,onChange,className,options]; ThemedSelect L607 [name,value,onChange,className,options]; input L629 [type,name,value,onChange,className]; ThemedSelect L635 [name,value,onChange,className,options]; input L647 [type,name,value,onChange,placeholder]; ThemedSelect L654 [name,value,onChange,className,options]; input L690 [type,placeholder,value,onChange,className]; ThemedSelect L694 [name,value,onChange,size,className,options]; input L772 [type,name,value,onChange,required]; input L777 [type,name,value,onChange,required]; input L785 [type,name,value,onChange]; ThemedSelect L790 [name,value,onChange,className,options]; input L806 [type,name,value,onChange]; ThemedSelect L811 [name,value,onChange,className,options]; ThemedSelect L827 [className,name,value,onChange,disabled,aria-label,options]; input L853 [type,value,onChange,placeholder,required,minLength]; ThemedSelect L899 [name,value,onChange,className,options]; input L915 [ref,type,accept,onChange,hidden,tabIndex].

Conditional states: users L29, loading L43, search L44, selectedCollege L45, currentPage L46, pageSize L47, totalCount L48, showForm L49, showBulkUploadModal L50, showEditModal L51, showResetModal L52, showBulkResetModal L53, showDeleteModal L54, selectedUser L55, userToDelete L56, deleteError L57, formData L58, editData L68, resetPassword L69, errors L70, bulkUploadData L71, bulkUploadLoading L75, bulkUploadResult L76, catalogDepartments L79, catalogDegrees L80, debouncedSearch L114.

Signals: toast, loading, empty, error, validation, tables, cards, inlineStyles.

Overlay sites: BulkResetModal L552 apiBaseUrl={apiBaseUrl} accessToken={accessToken} onClose={() => setShowBulkResetModal(false)} onSuccess={result => { setShowBulkResetModal(false); toast.success(`Passwords reset for ${result.updatedCount} users in ${result.groupName}.`); fetchUsers(); }}; DialogLayer L765 className="modal-overlay" onClick={() => setShowEditModal(false)}; DialogSurface L766 className="modal-content" onClick={e => e.stopPropagation()}; DialogLayer L846 className="modal-overlay" onClick={() => setShowResetModal(false)}; DialogSurface L847 className="modal-content" onClick={e => e.stopPropagation()}; DialogLayer L868 className="modal-overlay" onClick={() => { setShowBulkUploadModal(false); setBulkUploadData({ college_name: '', file: null }); setBulkUploadResult(null); if (fileInputRef.current) { fileInputRef.current.val; DialogSurface L879 className="modal-content bulk-upload-modal" onClick={e => e.stopPropagation()}; ConfirmModal L981 isOpen={showDeleteModal} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} title="Delete User" message={selectedUser && isOnlyCollegeAdmin(selectedUser) ? `At least one college admin is required for "${selectedUser.college_name}".\n\nCannot delete ${selectedUser.name} as thi confirmText="Delete" cancelText="Cancel" errorMessage={deleteError} disabled={selectedUser && isOnlyCollegeAdmin(selectedUser)}.

## src/features/CodeEditor/CodeEditor.jsx

Dependencies: `../../design/Primitives` (ActionButton, PageContent); `../../design/viewStyles` (createViewStyles); `react` (useState, useRef, useCallback, useEffect); `../../design/CodeSurface` (Editor); `../../contexts/ApiContext` (useApi); `../../constants/constants.js` (CODE_SNIPPETS, LANGUAGE_KEY_MAP); `../../utils/assessmentDraftStorage.js` (loadAssessmentDraft, saveAssessmentDraft); `../../utils/outputCompare.js` (outputsMatch); `../../utils/executionResult.js` (executionSucceeded); `../../hooks/useAssessmentClipboardGuard.js` (configureMonacoClipboardBlock).

UI elements: PageContent ×1, div ×44, select ×2, option ×2, label ×6, button ×7, Editor ×1, span ×21, svg ×12, path ×4, ActionButton ×5, textarea ×1, pre ×4, form ×1, input ×1, line ×7, polygon ×1, rect ×2, p ×2, polyline ×3, circle ×2.

Headings: .

Actions: Wrap lines L641; Test cases userInput.trim() && <span className={styles.inputIndicator}></span> L689; Sample results ( visibleTestCases.length ) L696; assessmentMode ? 'Submissions' : 'History' submissionHistory.length > 0 && ` (${submissionHistory.length})` L699; isSaving ? 'Saving…' : isRunning ? 'Running…' : 'Save & Run' L705; isSubmitting ? 'Submitting…' : 'Submit Code' L706; Case index + 1 L713; Custom index + 1 L714; + Custom case L715; [icon/nested] L747; Stop L753; Use This Code L892.

Fields: select L633 [aria-label,value,onChange,disabled]; select L640 [aria-label,value,onChange]; textarea L726 [aria-label,className,value,readOnly,onChange,placeholder,spellCheck,disabled]; input L746 [type,value,onChange,placeholder,className,autoFocus].

Conditional states: editorHeight L54, fontSize L55, wordWrap L56, code L57, savedCodeSnapshot L58, lastTestedCode L59, visibleTestsPassed L60, output L61, userInput L62, customCases L63, selectedCustomCase L64, selectedSample L65, interactiveInput L66, language L67, isRunning L68, isSaving L69, isSubmitting L70, isInteractive L71, testResults L72, activeTab L73, submissionHistory L74, loadingHistory L75.

Signals: loading, error, tabs, gesture, inlineStyles.

Overlay sites: .

## src/features/CodeEditor/CodeEditorLayout.jsx

Dependencies: `../../design/ThemeSwitch` (ThemeSwitch); `../../design/Primitives` (PageContent, Toolbar); `../../design/viewStyles` (createViewStyles); `react` (useState, useRef, useCallback); `./CodeEditor` (CodeEditor).

UI elements: PageContent ×1, div ×6, Toolbar ×1, ThemeSwitch ×1, strong ×1, span ×4, CodeEditor ×1.

Headings: .

Actions: .

Fields: .

Conditional states: leftPanelWidth L8, questionData L11.

Signals: gesture, inlineStyles.

Overlay sites: .

## src/features/Login/Login.jsx

Dependencies: `../../design/ThemeSwitch` (ThemeSwitch); `../../design/Primitives` (FieldGroup, ActionButton, PageContent); `../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useCallback); `react-router-dom` (useNavigate); `react-toastify` (toast); `../../components/PasswordSetup/PasswordSetup` (PasswordSetup); `../../components/InputModal/InputModal` (InputModal); `../../contexts/ApiContext` (useApi, AUTH_REMEMBER_ME_KEY); `../../auth/sessionClient.js` (hasPersistedSession, AUTH_SYNC_CHANNEL, broadcastAuthSync); `../../hooks/useMasterData.js` (useMasterData); `../../constants/constants.js` (API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES).

UI elements: PasswordSetup ×1, div ×6, section ×1, ThemeSwitch ×1, a ×1, img ×1, span ×4, form ×1, FieldGroup ×2, label ×3, svg ×5, path ×4, polyline ×2, input ×3, rect ×1, ActionButton ×3, line ×2, circle ×1, p ×1, InputModal ×1.

Headings: .

Actions: showPassword ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> L220; Forgot password? L249; Sign In L254.

Fields: input L206 [type,id,name,value,onChange,placeholder,autoComplete]; input L219 [type,id,name,value,onChange,placeholder,autoComplete]; input L242 [type,name,checked,onChange].

Conditional states: formData L25, errors L30, isLoading L31, showPassword L32, requiresPasswordSetup L33, passwordSetupData L34, showForgotPasswordModal L35.

Signals: toast, loading, error, validation, inlineStyles.

Overlay sites: InputModal L261 isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} onConfirm={handleForgotPassword} title="Reset your password" label="Email address" placeholder="you@university.edu" initialValue={formData.email} confirmText="Send reset link" type="email".

## src/features/PersonalDetails/PersonalDetails.jsx

Dependencies: `../../design/Primitives` (PageContent, ActionButton, FieldGroup, Toolbar); `../../design/viewStyles` (createViewStyles); `react` (useState, useEffect); `react-router-dom` (useOutletContext, useNavigate); `../../contexts/ApiContext` (useApi).

UI elements: PageContent ×2, div ×7, p ×1, Toolbar ×1, ActionButton ×3, svg ×9, path ×9, polyline ×4, circle ×3, line ×4, span ×2, form ×1, section ×5, h2 ×5, FieldGroup ×16, label ×16, input ×14, select ×1, option ×5, textarea ×1.

Headings: h2: Basic Information L154; h2: Address Information L189; h2: Social & Professional Links L226; h2: About You L251; h2: Emergency Contact L268.

Actions: Back L132; Cancel L288; saving ? <> <span className={styles.btnSpinner}></span> Saving... </> : <> <svg viewBox="0 L291.

Fields: input L164 [type,id,name,required,value,onChange,placeholder]; input L168 [type,id,name,value,onChange,placeholder]; select L172 [id,name,required,value,onChange]; input L182 [type,id,name,value,onChange]; input L199 [type,id,name,value,onChange,placeholder]; input L203 [type,id,name,value,onChange,placeholder]; input L207 [type,id,name,required,value,onChange,placeholder]; input L211 [type,id,name,required,value,onChange,placeholder]; input L215 [type,id,name,required,value,onChange,placeholder]; input L219 [type,id,name,value,onChange,placeholder]; input L236 [type,id,name,value,onChange,placeholder]; input L240 [type,id,name,value,onChange,placeholder]; input L244 [type,id,name,value,onChange,placeholder]; textarea L262 [id,name,value,onChange,placeholder,rows]; input L277 [type,id,name,value,onChange,placeholder]; input L281 [type,id,name,value,onChange,placeholder].

Conditional states: loading L16, saving L17, message L18, formData L22.

Signals: loading, error, validation.

Overlay sites: .

## src/features/Playground/Playground.jsx

Dependencies: `../../design/ThemeSwitch` (ThemeSwitch); `../../design/Primitives` (ActionButton, PageContent); `../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useParams, useNavigate); `react-toastify` (toast); `../../design/CodeSurface` (Editor); `../../contexts/ApiContext` (useApi); `../../constants/constants.js` (API_ENDPOINTS); `../../hooks/useConfirmModal` (useConfirmModal).

UI elements: PageContent ×1, div ×27, span ×4, ActionButton ×8, input ×2, ThemeSwitch ×1, button ×1, Editor ×1, iframe ×1, ConfirmDialog ×1.

Headings: .

Actions: « L366; + New Exercise L370; ✕ L380; » L385; saving ? 'Saving…' : shareMode ? 'Save a copy' : 'Save' L396; Share L399; tab.label L410; Console logs.length > 0 && <span className={styles.logBadge}>{logs.length}</span> L429; Clear L434.

Fields: input L373 [className,type,placeholder,value,onChange]; input L394 [className,type,value,onChange,placeholder].

Conditional states: html L92, css L93, js L94, activeTab L95, srcDoc L96, title L97, projectId L98, currentShareId L99, projects L100, search L101, sidebarOpen L102, saving L103, leftWidth L104, isDragging L105, previewWidthPx L106, logs L109, consoleOpen L110.

Signals: toast, empty, error, tabs, gesture, inlineStyles.

Overlay sites: ConfirmDialog L458 .

## src/features/ResetPassword/ResetPassword.jsx

Dependencies: `../../design/ThemeSwitch` (ThemeSwitch); `../../design/Primitives` (ActionButton, PageContent); `../../design/viewStyles` (createViewStyles); `react` (useMemo, useState); `react-router-dom` (useNavigate, useSearchParams); `react-toastify` (toast); `../../contexts/ApiContext` (useApi); `../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×1, div ×2, ThemeSwitch ×1, h2 ×1, p ×1, form ×1, label ×3, input ×3, ActionButton ×1.

Headings: h2: Reset Password L86.

Actions: isSubmitting ? 'Updating...' : 'Reset Password' L101.

Fields: input L91 [type,name,value,onChange,placeholder,autoComplete]; input L95 [type,name,value,onChange,placeholder,autoComplete]; input L99 [type,name,value,onChange,placeholder,autoComplete].

Conditional states: formData L18, isSubmitting L23.

Signals: toast, error, validation.

Overlay sites: .

## src/features/user/Assessments/AssessmentResults/AssessmentResults.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, LoadingState, EmptyState); `../../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate, useLocation); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button).

UI elements: PageContent ×3, LoadingState ×1, p ×4, EmptyState ×1, h3 ×3, ActionButton ×3, div ×36, svg ×11, path ×5, header ×1, span ×24, h1 ×1, circle ×4, h2 ×2, polyline ×4, line ×4, Panel ×4, Button ×4, DialogLayer ×1, DialogSurface ×1, polygon ×1, label ×1, textarea ×1.

Headings: h3: Results not available L90; h1: results.display_name || results.assessment_title L107; h2: results.passed ? <> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth L123; h3: Segment-wise Performance L200; h3: Answer Review L226; h2: How was your experience? L270.

Actions: Back to Assessments L91; Back to Assessments L98; Try Again ( results.attempts_remaining attempts left) L257; Back to Assessments L260; [icon/nested] L277; Skip L300; Submit Feedback L303.

Fields: textarea L293 [aria-label,value,onChange,placeholder,rows].

Conditional states: results L18, loading L19, showFeedbackModal L20, feedback L21, feedbackSubmitted L25.

Signals: toast, loading, empty, error, cards, inlineStyles.

Overlay sites: DialogLayer L267 className="modal-overlay" onClose={() => setShowFeedbackModal(false)}; DialogSurface L268 className="modal-content feedback-modal".

## src/features/user/Assessments/Assessments.jsx

Dependencies: `../../../design/Primitives` (PageContent); `react` (useState, useEffect, useCallback); `react-router-dom` (useNavigate); `../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../components/Button/Button` (Button).

UI elements: PageContent ×2, div ×16, p ×4, button ×1, span ×9, svg ×6, path ×7, h3 ×2, circle ×1, polyline ×2, rect ×1, line ×5, Button ×3.

Headings: h3: getEmptyStateMessage().title L281; h3: assessment.display_name || assessment.administrator_name || assessment.assessment_title L297.

Actions: tab.label L270; assessment.status === 'IN_PROGRESS' ? 'Continue' : assessment.status === 'PAUSED' ? 'Resum L352; View Results L355; Retake L358.

Fields: .

Conditional states: assessments L19, loading L20, activeTab L21.

Signals: toast, loading, empty, error, tabs.

Overlay sites: .

## src/features/user/Assessments/AssessmentStart/AssessmentStart.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel, LoadingState, EmptyState); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../utils/apiFetch.js` (formatConfigDateTime).

UI elements: PageContent ×3, LoadingState ×1, p ×4, EmptyState ×1, h3 ×1, ActionButton ×4, path ×16, rect ×5, circle ×5, line ×12, polyline ×7, svg ×3, header ×1, span ×10, h1 ×1, ul ×2, li ×3, strong ×2, div ×5, Panel ×4, h2 ×4, aside ×1, ol ×1, label ×2, input ×2.

Headings: h3: Assessment not found L118; h1: assessmentData.display_name || assessmentData.assessment_title L221; h2: Instructions L240; h2: Important rules L247; h2: Assessment structure L261; h2: Ready to begin? L274.

Actions: Back to Assessments L119; Back to Assessments L212; starting ? 'Starting...' : 'Start Assessment' L290; Cancel L293.

Fields: input L279 [type,id,value,onChange,placeholder,autoComplete]; input L283 [type,checked,onChange].

Conditional states: assessmentData L16, loading L17, starting L18, accessCode L19, showAccessCodeInput L20, agreed L21.

Signals: toast, loading, empty, error, validation, cards.

Overlay sites: .

## src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx

Dependencies: `../../../../design/AssessmentDialogs` (AssessmentDialogs); `../../../../design/Primitives` (PageContent, ActionButton, Toolbar); `../../../../design/viewStyles` (createViewStyles); `react` (useState, useEffect, useCallback, useRef); `react-router-dom` (useParams, useNavigate, useLocation); `../../../../contexts/ApiContext` (useApi); `react-toastify` (toast); `../../../../components/Button/Button` (Button); `../../../CodeEditor/CodeEditor` (CodeEditor); `../../../../hooks/useAssessmentClipboardGuard.js` (useAssessmentClipboardGuard); `../../../../utils/assessmentDraftStorage.js` (saveAssessmentDraft); `../../../../constants/constants.js` (LANGUAGE_KEY_MAP).

UI elements: PageContent ×4, div ×51, p ×6, h3 ×4, Button ×4, svg ×4, path ×1, line ×4, span ×31, ActionButton ×6, Toolbar ×1, strong ×1, circle ×2, polyline ×2, section ×1, label ×1, input ×1, h4 ×6, pre ×4, CodeEditor ×1, aside ×1, AssessmentDialogs ×1.

Headings: h3: Could not load assessment L827; h3: No questions available for this segment L833; h4: Description L922; h4: Input Format L931; h4: Output Format L937; h4: Constraints L946; h4: Examples L954; h4: Sample Test Cases L979; h3: Segments L1125; h3: Questions L1147.

Actions: Back to Assessments L828; Back to Assessments L835; Return to Fullscreen L850; × L860; [icon/nested] L870; Previous L1112; isLastQuestion ? isLastSegment ? 'Submit Test' : 'Submit Segment' : 'Next' L1115; isCurrentSegment && <span className={styles.segmentBadgeCurrent}>Current</span> isPastSegment && <svg className={styles.checkIcon} viewBox=" L1134; index + 1 L1156; isLastSegment ? 'Submit Test' : 'Submit Segment' L1167.

Fields: input L899 [type,name,value,checked,onChange].

Conditional states: assessmentData L80, testEntered L81, currentSegmentIndex L83, currentQuestionIndex L84, questions L85, answers L86, loading L87, submitting L88, timeRemaining L89, segmentTimeRemaining L90, totalTimeWorked L91, showQuestionNav L103, problemWidth L104, showSubmitModal L106, showSegmentEndModal L107, showSegmentSubmitModal L108, isFullScreen L109, showCloseWarning L110, tabSwitchCount L111, proctoringWarning L112, showFullscreenExitModal L113, pendingFullscreenExit L114, showFullscreenRequiredModal L115, showTabSwitchModal L116, tabSwitchCountdown L117, isTabLimitExceeded L118.

Signals: toast, loading, empty, error, gesture, inlineStyles.

Overlay sites: AssessmentDialogs L1190 views={{ entry: !testEntered, fullscreenRequired: testEntered && showFullscreenRequiredModal && !showTabSwitchModal && assessmentData?.proctoring?.full_screen_mandatory, fullscreen total={questions.length} answered={getAnsweredCount()} time={formatTime(timeRemaining)} segmentName={currentSegment?.name} allowSegmentSwitch={isConfigFlagEnabled(assessmentData?.allow_segment_switch, true)} switchCount={tabSwitchCount} switchLimit={assessmentData?.proctoring?.max_tab_switch_allowed ?? -1} limitExceeded={isTabLimitExceeded} countdown={tabSwitchCountdown} busy={submitting} onEnterTest={async () => { if (isConfigFlagEnabled(assessmentData?.proctoring?.full_screen_mandatory, false)) { await document.documentElement.requestFullscreen(); setIsFullScreen( onEnterFullscreen={enterFullScreen} onStayFullscreen={handleCancelExitFullscreen} onExitFullscreen={handleConfirmExitFullscreen} onCloseSubmit={() => setShowSubmitModal(false)} onSubmit={() => submitAssessment(false)} onCloseSegmentSubmit={() => setShowSegmentSubmitModal(false)} onSubmitSegment={async () => { setShowSegmentSubmitModal(false); await saveCurrentProgress(); await handleMoveToNextSegment(); }} onNextSegment={handleMoveToNextSegment} onContinueWindow={() => setShowCloseWarning(false)} onRetrySubmit={() => submitAssessment(true)} onContinueAfterSwitch={() => setShowTabSwitchModal(false)}.

## src/features/user/Courses/CourseAssessment/CourseAssessment.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useParams, useNavigate, useOutletContext); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../CodeEditor/CodeEditor` (CodeEditor).

UI elements: PageContent ×4, div ×34, ActionButton ×8, svg ×13, path ×4, Panel ×2, polyline ×7, line ×7, h1 ×2, p ×2, circle ×3, span ×16, h3 ×3, ul ×1, li ×5, polygon ×1, h2 ×1, button ×2, h4 ×1, aside ×1.

Headings: h1: segment?.name || segment?.title || 'Assessment' L219; h3: Instructions L241; h1: Assessment Complete L279; h3: Question Summary L285; h2: segment?.name || segment?.title || 'Assessment' L315; h4: Explanation L374; h3: Questions L400.

Actions: Back to Course L202; Start Assessment L251; Back to Course L264; Review Answers L300; Continue Course L303; Submit Assessment L330; isCorrect && <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentC isWrong && <svg className="option-icon" viewBox=" L359; Previous L382; Next L388; index + 1 L411.

Fields: .

Conditional states: segment L20, loading L21, started L22, leftPanelWidth L23, sidebarCollapsed L24, assessmentQuestions L27, currentQuestionIndex L28, selectedAnswers L29, submittedAssessment L30, assessmentResults L31, timeRemaining L32, timerActive L33.

Signals: loading, error, cards.

Overlay sites: .

## src/features/user/Courses/CourseOverview/CourseOverview.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Panel); `react` (useState, useEffect); `react-router-dom` (useParams, useNavigate, useOutletContext); `react-toastify` (toast); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×3, div ×35, h3 ×2, ActionButton ×7, svg ×20, path ×11, Panel ×1, img ×1, span ×34, h1 ×1, polygon ×3, polyline ×13, p ×3, line ×4, h2 ×2, circle ×2.

Headings: h3: Course not found L302; h1: course.name L329; h2: Course Outcomes L406; h2: Course Content L418; h3: section.title || section.name L445.

Actions: Back to Courses L303; Back to Courses L310; hasStarted ? <> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" L330; [icon/nested] L437; [icon/nested] L486; [icon/nested] L522; [icon/nested] L544.

Fields: .

Conditional states: course L19, sections L20, sectionLessons L21, sectionPracticeSegments L22, loading L23, expandedSections L24, stats L25, courseProgress L30, hasStarted L31, lastAccessedSegment L32.

Signals: toast, loading, empty, error, cards, inlineStyles.

Overlay sites: .

## src/features/user/Courses/CurrentCourse/CurrentCourse.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton); `react` (useState, useEffect, useCallback, useRef); `react-router-dom` (useParams, useNavigate, useOutletContext); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../../components/MediaPlayer` (VideoPlayer, AudioPlayer, DocumentViewer).

UI elements: PageContent ×3, div ×33, h3 ×3, ActionButton ×14, svg ×15, path ×7, aside ×1, h2 ×2, span ×14, polyline ×11, polygon ×1, circle ×3, line ×3, section ×1, p ×5, DocumentViewer ×7, iframe ×1, VideoPlayer ×1, AudioPlayer ×1.

Headings: h3: Course not found L450; h2: Course Content L486; h2: selectedSegment.name || selectedSegment.title || 'Untitled Lesson' L638; h3: Practice Exercise L645; h3: Assessment L653.

Actions: Back to Courses L451; Back to Overview L470; sidebarCollapsed ? 'Show course content' : 'Hide course content' L476; [icon/nested] L505; [icon/nested] L528; [icon/nested] L559; [icon/nested] L576; [icon/nested] L594; [icon/nested] L613; Start Exercise L648; Start Assessment L656; Mark as Complete L702; Mark as Complete L743; Mark as Complete L751.

Fields: .

Conditional states: course L19, sections L20, sectionLessons L21, sectionPracticeSegments L22, selectedSegment L23, loading L24, progress L25, expandedSections L26, sidebarCollapsed L27, currentSegmentTopicId L28.

Signals: loading, empty, error.

Overlay sites: .

## src/features/user/Courses/PracticeExercise/PracticeExercise.jsx

Dependencies: `../../../../design/Primitives` (PageContent, ActionButton, Toolbar); `react` (useState, useEffect, useRef, useCallback); `react-router-dom` (useParams, useNavigate, useOutletContext); `../../../../contexts/ApiContext` (useApi); `../../../../constants/constants.js` (API_ENDPOINTS); `../../../CodeEditor/CodeEditor` (CodeEditor).

UI elements: PageContent ×2, div ×31, Toolbar ×1, ActionButton ×5, svg ×8, path ×1, strong ×1, polyline ×5, span ×9, h3 ×1, p ×1, h2 ×1, h4 ×6, pre ×2, CodeEditor ×1, button ×1, line ×4.

Headings: h3: No questions available L254; h2: currentQuestion.title L265; h4: Constraints L276; h4: Input Format L283; h4: Output Format L290; h4: Sample Input L297; h4: Sample Output L302; h4: Explanation L443.

Actions: Back to Course L229; Previous L235; Next L244; [icon/nested] L310; isCorrect && <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentC isWrong && <svg className="option-icon" viewBox=" L409; Submit Answer L423.

Fields: .

Conditional states: practiceSegment L20, programmingQuestions L21, mcqQuestions L22, currentQuestionIndex L23, currentQuestionType L24, loading L25, leftPanelWidth L26, sidebarCollapsed L27, selectedAnswers L30, submittedAnswers L31.

Signals: loading, empty, error, gesture, inlineStyles.

Overlay sites: .

## src/features/user/Courses/UserCourses/UserCourses.jsx

Dependencies: `../../../../design/Primitives` (Toolbar, FieldGroup, ActionButton, PageContent, LoadingState); `react` (useState, useEffect); `react-router-dom` (useOutletContext); `../../../../components/CourseCard/CourseCard` (CourseCard); `../../../../contexts/ApiContext` (useApi).

UI elements: PageContent ×1, div ×5, button ×1, span ×1, Toolbar ×1, FieldGroup ×2, label ×2, select ×1, option ×2, input ×1, ActionButton ×1, svg ×2, line ×2, LoadingState ×1, p ×2, path ×2, h3 ×1, CourseCard ×1.

Headings: h3: No Courses Found L194.

Actions: tab.label L157; [icon/nested] L178.

Fields: select L167 [value,onChange,className]; input L175 [type,placeholder,value,onChange,className].

Conditional states: allCourses L14, filteredCourses L15, loading L16, activeTab L17, search L18, selectedCategory L19, categories L20.

Signals: loading, empty, error, tabs, cards.

Overlay sites: .

## src/features/user/Dashboard/Dashboard.jsx

Dependencies: `react` (useEffect, useState); `react-router-dom` (Link, useOutletContext); `react-redux` (useDispatch, useSelector); `../../../contexts/ApiContext` (useApi); `../../../utils/api` (authenticatedFetch); `../../../store/dashboardSlice` (fetchAdminDashboardStats, selectCoursesLoading, selectCourseStats, selectAdministrations, selectAdministrationsLoading, selectAdminStats); `../../../design/Primitives` (ActionButton, EmptyState, LoadingState, Metric, PageContent, Panel, Toolbar); `../../../design/CourseCard` (CourseCard); `../../../design/Icon` (Icon); `./Overview.css` ().

UI elements: div ×19, span ×7, i ×1, strong ×5, LoadingState ×3, PageContent ×1, Toolbar ×1, ActionButton ×3, Icon ×10, p ×5, Link ×7, Metric ×8, Panel ×7, h2 ×6, small ×3, EmptyState ×2, h3 ×2, Composition ×2, CourseCard ×1.

Headings: h2: Recent course deliveries L115; h3: Your next delivery starts here L115; h2: Make something happen L115; h2: Course library L130; h2: Course administrations L130; h2: Your next step L130; h3: Your learning journey starts here L130; h2: Assessments to explore L130.

Actions: Refresh overview L109; [icon/nested] L114; Try again L130.

Fields: .

Conditional states: profile L48, dismissed L49, learning L50, assessments L51, loading L52, error L53, retry L54.

Signals: loading, empty, error, cards, inlineStyles.

Overlay sites: .

## src/features/user/Quiz/Quiz.jsx

Dependencies: `../../../design/Primitives` (PageContent, ActionButton, Panel); `../../../design/Dialog` (DialogLayer, DialogSurface); `react` (useState, useEffect, useCallback); `react-router-dom` (useParams, useNavigate, useOutletContext); `../../../contexts/ApiContext` (useApi); `../../../constants/constants.js` (API_ENDPOINTS).

UI elements: PageContent ×4, div ×46, span ×16, ActionButton ×13, svg ×23, path ×14, Panel ×2, circle ×9, line ×10, h1 ×2, p ×3, h3 ×4, ul ×1, li ×6, strong ×6, polygon ×1, polyline ×5, DialogLayer ×1, DialogSurface ×1, h2 ×1, button ×1, h4 ×1.

Headings: h1: practiceSegment?.name || 'Quiz' L408; h3: Instructions L431; h1: Quiz Completed! L477; h3: Question Summary L509; h3: Quiz Not Complete L562; h2: practiceSegment?.name || 'Quiz' L587; h3:  L622; h4: Explanation L702.

Actions: Back to Course L392; questions.length > 0 ? 'Start Quiz' : 'No Questions Available' L442; Back to Course L455; Review Answers L529; Continue Course L536; Continue Quiz L568; Complete Anyway L571; [icon/nested] L581; [icon/nested] L592; [icon/nested] L600; [icon/nested] L608; isSubmitted && <div className="option-status"> {isCorrect && <svg className="status-icon c L646; Submit Answer L680; Try Again L685.

Fields: .

Conditional states: practiceSegment L21, questions L22, currentQuestionIndex L23, loading L24, started L25, selectedAnswers L26, submittedAnswers L27, quizCompleted L28, quizResults L29, showConfirmModal L30, questionStartTime L31, timeSpent L32.

Signals: loading, empty, error, cards, inlineStyles.

Overlay sites: DialogLayer L553 className="confirm-modal-overlay" onClose={() => setShowConfirmModal(false)}; DialogSurface L554 className="confirm-modal".

## src/hooks/useConfirmModal.jsx

Dependencies: `react` (useState, useCallback, useRef); `../components/ConfirmModal/ConfirmModal` (ConfirmModal).

UI elements: ConfirmModal ×1.

Headings: .

Actions: .

Fields: .

Conditional states: config L14.

Signals: .

Overlay sites: ConfirmModal L43 isOpen={!!config} onClose={handleClose} onConfirm={handleConfirm} title={config?.title || ''} message={config?.message ?? ''} confirmText={config?.confirmText} cancelText={config?.cancelText} disabled={config?.disabled}.

## src/main.jsx

Dependencies: `react` (StrictMode); `react-dom/client` (createRoot); `react-router-dom` (BrowserRouter); `react-redux` (Provider); `./store` (store); `./App.jsx` (App); `./index.css` ().

UI elements: Provider ×1, BrowserRouter ×1, App ×1.

Headings: .

Actions: .

Fields: .

Conditional states: .

Signals: .

Overlay sites: .
