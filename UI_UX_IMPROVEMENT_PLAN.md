# UI/UX improvement plan

Date: 30 October 2026. Stage A: source audit and initial browser reconnaissance complete. Stage B approved by user; implementation underway. Baseline frontend: `eab7cc6`. Repository root: `E:/edtech/LnD-FrontEnd`.

## 1. Application overview and evidence

CampusZen supports learners taking courses, quizzes and coding assessments, and administrators managing people, content, deliveries and results. The design thesis is **a calm learning workspace with precise administrative tools**. Preserve the recognizable blue accent and learning-progress context; improve clarity before adding motion.

- React 18.3, React Router 6.28, Vite 5.4; JavaScript/JSX, no TypeScript migration proposed. Redux Toolkit/React Redux are installed; API/session and theme use React Context, page state uses hooks. Preserve these ownership boundaries.
- Backend: separate CommonJS Express 5.2 service, mysql2 promise pool and model/controller/routes architecture; JWT authentication/role/institution authorization, AWS S3/SES, bulk-import worker and WebSocket/Docker execution services. No API/database/business-rule changes in this roadmap.
- UI: custom `src/design` primitives, compatibility wrappers under `src/components`, React Toastify, Monaco, React Quill, Recharts, document/PDF/media viewers. No installed dedicated motion library.
- Styling: `src/index.css` imports palette, system, shell, widgets, features, layouts, compact, learner, admin and assessment overrides in order. Proxy-generated `czv-*` classes bridge feature markup to global CSS. Repeated selectors and broad descendant rules make import order significant.
- 61 explicit route declarations inspected in `src/App.jsx`, including redirects/aliases; 49 distinct rendered route components after excluding entry/redirect-only components. 53 feature JSX files include nested features such as CodeEditor, BulkResetModal and MailerTemplateForm.
- 41 shared JSX files identified under `src/design` and `src/components`, including forwarding wrappers, not 41 independent implementations. Inventory includes 132 JS/JSX source files. See [inventory](docs/ui-ux-audit/inventory.json).
- Overlay inventory: 86 overlay-named JSX occurrences, including 22 DialogLayer and 23 DialogSurface occurrences. Excluding surfaces and provider leaves 62 entry occurrences; these include reusable definitions/callers, so **not 62 distinct dialogs**. The overlay catalogue below lists each owner and conditional controls.
- Browser reconnaissance visited 60 nonsecure route patterns using synthetic API responses, with follow-up observations for initial loading states. These are initial render observations, not completed end-to-end flows. Secure popup route is source-reviewed only. [Route observations](docs/ui-ux-audit/browser-route-observations.json).
- Desktop 1280×720, tablet 768×1024 and mobile 390×844 samples captured for Users. Tablet expanded preference confirmed labels hidden with no explicit name/title. Mobile closed sidebar links remain focusable offscreen. No page-level horizontal overflow in those Users samples; table scroll is intentional.
- Baseline executed: `npm test`: 24 passed; `npm run test:assessment`: 5 test entries passed, including four draft assertions. No new build, lint, axe, screen-reader, performance trace or real-device test claimed in Stage A. Existing previous build evidence is not a fresh verification.
- Testing: Node tests for logic/contracts/source architecture; mock and ui-live browser entries. ui-live needs isolated API :3182 and fixture service :3183, not provisioned here. No configured Playwright/Vitest test runner or typecheck script. ESLint config exists without a package lint command.
- Frontend GitHub workflow deploys `develop` to S3/CloudFront and regenerates the lockfile during install; backend workflow deploys `develop` to Elastic Beanstalk. Stage B must push only `codex/ui-ux-upgrade`, never merge/deploy without explicit approval. CI reproducibility changes are a separately reviewed tooling item, not silent deployment edits.

### Reference methodology

Read actual repository SKILL.md files and relevant supporting files, pinned for reproducibility:

- [Apple Design Skill](https://github.com/dickwu/apple-design-skill/blob/ff4ebddf0488598723a82bfdce1afb04de0b1c44/SKILL.md): accessibility, layout, typography, color, desktop foundations, buttons, data entry, lists/tables, modality, motion, dark appearance, cross-platform translation. Apple native conventions are not web requirements; keep browser semantics, theme choice and keyboard conventions.
- [Emil skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills): emil-design-eng, improve-animations and its AUDIT/PLAN-TEMPLATE, review-animations, animate, apple-design, animation-performance, find-animation-opportunities, animation-vocabulary, mobile-native, break-ui and CATALOG. Apply construction/gesture recommendations only after approval. User's single comprehensive approval gate supersedes intermediate skill-specific selection steps.
- Two read-only specialist audits supported motion and controls analysis, as improve-animations explicitly requests. Findings were checked against source. No application source changed.

## 2. Current UI assessment

Overall: **needs work**, with accessibility blockers in shared interactions. Existing semantic controls, palette, focus outline, route splitting, dialog stack and sparse motion provide a useful foundation.

| Priority / evidence | Before | After | Why |
|---|---|---|---|
| P0; `src/design/Navigation.jsx:15`, `shell.css:49`; browser tablet sample | Tablet CSS hides label spans independently of collapse state; absent label/title in expanded preference | Permanent accessible link name, visually hidden label where needed | Navigation must remain identifiable at every width |
| P0; `Navigation.jsx:11`, `shell.css:50`, `components/Layout/Layout.jsx:26` | Closed mobile sidebar only translated offscreen; links still tab stops; open drawer lacks modal focus lifecycle | Closed drawer inert; open focus containment, background inertness, Escape/backdrop and trigger restoration | Prevent invisible focus and accidental background actions |
| P0; `AssessmentEdit.jsx:1331` | Question picker uses DialogSurface inside plain div | Use central DialogLayer lifecycle | Existing trap, scroll lock and restoration are bypassed |
| P1; `Combobox.jsx:46–52` | Focused search input differs from active-descendant owner; active option may be offscreen/nonexistent | Coherent combobox pattern, Home/End, scroll active item, no invalid ID | Predictable keyboard/screen-reader selection |
| P1; `Primitives.jsx:22`, `CreateUser.jsx:170`, `CreateInstitution.jsx:93` | Visual errors/asterisks not consistently associated with controls | Field IDs, described-by help/errors, invalid/required state and first-error focus | Preserve validation rules while making feedback perceivable |
| P1; `system.css:87–113` | Reduced-motion duration .01ms leaves infinite spinner loops | Static labelled loading and no rotation under reduced motion | Respect user preference without removing status |
| P1; CodeEditorLayout/Playground splitters | Mouse-only precision controls | Shared pointer/keyboard separator with cancellation | Touch and keyboard parity |
| P1; `tokens/colors.css`, Users computed style | 11px status text uses light success/warning colors | Separate accessible status foregrounds from decorative fills | Small status labels require text contrast |
| P2; `system.css:12,64`, shared primitives | Spring token is ordinary ease; no consistent pressed state; variant inferred from class name | Explicit variants, real motion presets, immediate press/busy feedback | Stable hierarchy and interaction intent |
| P2; `system.css:73–83` | All final table columns sticky/nowrap; repeated generic table labels | Opt-in action-column stickiness, named tables, content-aware cells | Data columns should not inherit action-specific behavior |
| P2; course/assessment list tabs | ARIA tabs act as ordinary buttons | Button groups for filters; complete tabs pattern for panels | Avoid misleading semantics |
| P2; `compact.css`, `layouts.css`, `assessment-workspace.css` | Page geometry repeated across cascading overrides | One owner per primitive/layout rule, incremental removal of obsolete rules | Reduce unintended cross-page changes |
| P2; ThemeContext and shell | Theme defaults light, no system preference choice; several native mobile considerations absent | Persist explicit choice, optional system mode, native chrome color and safe-area support | Keep user control and improve device fit |

Measured foreground/background contrast (WCAG relative luminance, actual token values): blue `#2457e6` on white 5.86:1; secondary text `#3f4c6b` on white 8.55:1. Preserve. Success `#12996b` on white 3.62:1 and warning `#cf7d0a` on white 3.19:1 fail ordinary small-text 4.5:1; tinted same-hue badges need their own composited checks. Muted `#8590ab` on white 3.19:1 and dark muted `#67739a` on `#0f1628` 3.86:1 must not carry essential small text. These are token-pair measurements, not a claim every usage fails. White on dark-theme accent `#6b9bff` is 2.71:1; existing `--text-on-accent:#06122e` is 6.84:1 and must remain the button foreground.

Typography: Users labels/table headings measured 11px, small but not inherently a WCAG size violation. Raise utility labels and preserve density through layout rather than tiny type. Many pages lack a visible main heading; sidebar group headings are not page titles. Numeric alignment should extend beyond Metric. Long forms need consistent section hierarchy and persistent error context.

Motion verdict: no application CSS transition:all, scale(0), or ease-in found. Preserve restraint. No profiling evidence supports calling resize work measured jank; per-event layout reads/React updates are a risk requiring traces. Native touch hover/input autozoom need hardware verification.

## 3. Proposed design system

Retain React/CSS architecture and compatibility wrappers. Extend existing semantic variables rather than creating a competing theme. Use a calm blue **learning path rail** as the distinctive visual element: a thin progress/section connector in course outlines and assessment steps, tied to actual sequence/completion. No decorative numbered cards or page entrance choreography.

| Role | Light | Dark | Rule |
|---|---|---|---|
| Canvas / card / input | #f2f5fb / #ffffff / #f7f9fd | #070b17 / #0f1628 / #0a101f | Preserve core surfaces |
| Primary / secondary text | #0d1630 / #3f4c6b | #eef2fc / #b3bfdc | Essential text never uses disabled/muted token |
| Accent / on-accent | #2457e6 / #ffffff | #6b9bff / #06122e | Primary action and current location |
| Success foreground | #087f5b (5.00:1 on white) | #4fd1a1 | Existing green remains available for decorative charts |
| Warning foreground | #9a5b00 (5.43:1 on white) | #f0b24a | Pair with text/icon, validate tinted backgrounds |
| Error foreground | #b42336 (6.49:1 on white) | #ff7a86 | Error text plus field association |
| Border / focus | Existing border tokens / accent | Existing border tokens / accent | Required control boundaries >=3:1, use stronger boundary token when needed |

Changes to semantic palette require updating the existing exact-palette baseline test intentionally; do not defeat it. Existing brand values remain named tokens. Final composited pairs must pass, including hover/selected states.

- Fonts: system UI stack (retain Inter if already available; no external font dependency), current monospace for code. Headings 32/38, 24/30, 20/28; body 16/24; compact data 14/20; labels 14/20; metadata minimum proposed 12/18. Weights 400/500/600/650; tracking body 0, heading -0.02em; tabular numerals for scores/timers/counts. CSS rem, zoom preserved.
- Spacing: 4/8/12/16/24/32/48/64px expressed in rem. Panel gaps 16 or 24; section gaps 32; labels 6–8 from control. Use current token aliases during migration.
- Controls: default 44px high, compact desktop 36px where justified; coarse-pointer targets 44×44 with sufficient spacing. Inputs 44px and at least 16px text on touch. Icon visual 18–20px in target. Dense tables retain full functionality via scroll/detail, not hidden columns without an equivalent.
- Radius: controls 8px, cards 12px, dialogs 16px, pills only for genuine compact status/selection. Elevation: border for cards, small shadow for anchored overlay, existing larger shadow only for modal layer. No glass on reading surfaces.
- Containers: ordinary content max 1440px, long forms 864px, reading 65–75ch; 16px mobile and 24–32px desktop margins. Content-driven breakpoints ~600/900/1200; reconcile actual shell breakpoints before changing behavior.
- State contract: default, pointer hover, immediate pressed, focus-visible 2px+outline offset, disabled with native semantics, selected with icon/text+color, loading label and reserved width, error with persistent explanation. Make variants explicit rather than class-name inference.

Desktop: `[navigation] [page title + contextual actions]`, then filters and main content. Mobile: `[menu + location]`, page heading, wrapping actions, filters, content; navigation is an accessible drawer. Coding: `[problem | adjustable divider | editor]`, then test-case toolbar containing **Save & Run / Submit Code**. Preserve the user's removal of the redundant status/instruction row.

## 4. Proposed motion system

Do not install an animation library for hover/fades. CSS transitions/WAAPI cover predetermined state changes; one narrowly scoped spring utility or Motion module is justified only if the approved drawer gesture cannot be implemented reliably using existing facilities. No broader UI library replacement proposed. Evaluate exact bundle cost and choose one implementation, not both. This is a gated Phase 4 decision before dependency installation.

| Pattern / component | Specification | Reversal / reduced motion |
|---|---|---|
| Shared press state | Immediate color/border; optional pointer-only .97 scale, 120ms, cubic-bezier(.23,1,.32,1) | Keyboard stays immediate; reduced motion drops scale |
| Dropdown / account disclosure | 150ms opacity and .98→1 scale, origin at actual trigger edge | Retarget current presentation; keyboard opening instant |
| Dialog | 200ms opacity and centered .97→1; exit 150ms | Retain lifecycle until safe exit; rapid reversal never disables controls; reduced mode instant/short opacity |
| Mobile drawer button open/close | 240ms transform using cubic-bezier(.32,.72,0,1) | Symmetric path, immediate Escape; static equivalent |
| Drawer gesture release | Critically damped default, response .3–.4s; if Motion chosen spring bounce:0,duration:.4 | Direct tracking during drag, release velocity carried; optional momentum bounce .2 only after flick; reduced mode no spring |
| Switch / filter / tabs | Current transforms retained, color ~120ms; tab content changes immediate | No typing, question, timer or keyboard-navigation animation |
| Progress / loading | Determinate progress where known; static labelled busy indicator under reduce | No near-zero-duration infinite loop |
| Splitters | Pointer 1:1, no spring or momentum, rAF-coalesced updates | Cancel/lost capture/unmount cleanup; arrows/Home/End; precision takes precedence |

Tokens: duration 120/150/200/240ms; ease-out cubic-bezier(.23,1,.32,1), move cubic-bezier(.77,0,.175,1), drawer cubic-bezier(.32,.72,0,1). Springs are behavior presets, not --transition-spring aliases. No >300ms UI delay; spring response is not a guaranteed fixed settle duration. No animations that gate accepting the next action.

Gesture rules: start on explicit handle or intent threshold ~10px, one pointer, pointer capture, preserve grab offset, allow vertical content scrolling; cancellation returns safely. Drawer dismissal only when content is not scrolling and no unsaved/task-critical state is at risk. Project velocity only for an actual drawer, never a form slider or assessment divider. Button, Escape and keyboard alternatives remain. No swipe-to-submit/delete; no dragging assessment warnings. No sounds/haptics added.

## 5. Page-by-page redesign plan

Every route is listed in the generated table below. Common page contract: meaningful main heading, labelled controls, explicit action hierarchy, loading/empty/error/retry states, responsive access to all features, keyboard focus, both themes. Per-route entries identify additional work. Source paths are exact within the frontend root; redirects preserve their destinations.

| Page / route | Component / source | Current issue or audit concern | Proposed improvement | Priority |
|---|---|---|---|---|
| `/` | RootEntry; `src/App.jsx:95` | Entry/redirect behavior | Preserve session-aware redirect | P2 |
| `/login` | Login; `src/features/Login/Login.jsx` | 3 field sites; 1 overlay JSX sites; inline geometry; shared contract consistency | Associated errors, pending/retry and reveal/forgot-password dialog | P1 |
| `/reset-password` | ResetPassword; `src/features/ResetPassword/ResetPassword.jsx` | 3 field sites; 0 overlay JSX sites; shared contract consistency | Token-expiry recovery and labelled fields | P1 |
| `/codeeditor` | CodeEditorLayout; `src/features/CodeEditor/CodeEditorLayout.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Accessible pointer/touch/keyboard split panes | P2 |
| `/playground` | Playground; `src/features/Playground/Playground.jsx` | 2 field sites; 1 overlay JSX sites; tab/filter states; inline geometry; shared contract consistency | Named editor/title fields; accessible panes; clear console and share state | P1 |
| `/playground/share/:shareId` | Playground; `src/features/Playground/Playground.jsx` | 2 field sites; 1 overlay JSX sites; tab/filter states; inline geometry; shared contract consistency | Named editor/title fields; accessible panes; clear console and share state | P1 |
| `/secure/assessment/:mappingId/take` | AssessmentTake; `src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx` | 1 field sites; 1 overlay JSX sites; inline geometry; shared contract consistency | Preserve two coding actions in test bar; accessible panes/warnings; no instruction row | P0 |
| `/dashboard` | Dashboard; `src/features/user/Dashboard/Dashboard.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Role-specific next step and coherent metrics/cards | P2 |
| `/personal-details` | PersonalDetails; `src/features/PersonalDetails/PersonalDetails.jsx` | 16 field sites; 0 overlay JSX sites; shared contract consistency | Group long profile form and associate validation | P1 |
| `/courses` | Navigate; `src/App.jsx:110` | Entry/redirect behavior | Preserve alias destination and browser back | P2 |
| `/courses/user-courses` | UserCourses; `src/features/user/Courses/UserCourses/UserCourses.jsx` | 2 field sites; 0 overlay JSX sites; tab/filter states; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/courses/:id` | CourseOverview; `src/features/user/Courses/CourseOverview/CourseOverview.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/courses/:id/current` | CurrentCourse; `src/features/user/Courses/CurrentCourse/CurrentCourse.jsx` | 0 field sites; 0 overlay JSX sites; shared contract consistency | Accessible outline and media/document loading/error/retry | P2 |
| `/courses/:courseId/practice/:practiceId` | PracticeExercise; `src/features/user/Courses/PracticeExercise/PracticeExercise.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/courses/:courseId/quiz/:practiceId` | Quiz; `src/features/user/Quiz/Quiz.jsx` | 0 field sites; 2 overlay JSX sites; inline geometry; shared contract consistency | Immediate choice feedback; preserved attempts; incomplete-confirmation focus | P1 |
| `/courses/:courseId/assessment/:segmentId` | CourseAssessment; `src/features/user/Courses/CourseAssessment/CourseAssessment.jsx` | 0 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/assessments` | Assessments; `src/features/user/Assessments/Assessments.jsx` | 0 field sites; 0 overlay JSX sites; tab/filter states; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/user/assessments` | Assessments; `src/features/user/Assessments/Assessments.jsx` | 0 field sites; 0 overlay JSX sites; tab/filter states; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/user/assessments/:mappingId/start` | AssessmentStart; `src/features/user/Assessments/AssessmentStart/AssessmentStart.jsx` | 2 field sites; 0 overlay JSX sites; shared contract consistency | Contextual permissions/access code; clear start and server deadline | P1 |
| `/user/assessments/:mappingId/take` | AssessmentTake; `src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx` | 1 field sites; 1 overlay JSX sites; inline geometry; shared contract consistency | Preserve two coding actions in test bar; accessible panes/warnings; no instruction row | P0 |
| `/user/assessments/:mappingId/results` | AssessmentResults; `src/features/user/Assessments/AssessmentResults/AssessmentResults.jsx` | 1 field sites; 2 overlay JSX sites; inline geometry; shared contract consistency | Release gate, score explanations, review and accessible feedback rating | P1 |
| `/admin/institutions` | Institutions; `src/features/admin/Institutions/Institutions.jsx` | 1 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/institutions/create` | CreateInstitution; `src/features/admin/Institutions/CreateInstitution/CreateInstitution.jsx` | 8 field sites; 0 overlay JSX sites; shared contract consistency | Associated required/errors; first-error focus; replace toast burst with summary | P1 |
| `/admin/institutions/:id` | InstitutionDetail; `src/features/admin/Institutions/InstitutionDetail/InstitutionDetail.jsx` | 8 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/mailer-templates/:id/edit` | MailerTemplateDetail; `src/features/admin/MailerTemplates/MailerTemplateDetail.jsx` | 0 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/admin/mailer-templates/:id` | MailerTemplateDetail; `src/features/admin/MailerTemplates/MailerTemplateDetail.jsx` | 0 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/admin/mailer-templates` | MailerTemplates; `src/features/admin/MailerTemplates/MailerTemplates.jsx` | 4 field sites; 3 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/settings` | Settings; `src/features/admin/Settings/Settings.jsx` | 5 field sites; 3 overlay JSX sites; tab/filter states; inline geometry; shared contract consistency | Category tabs and create/edit/delete dialog focus | P1 |
| `/admin/users` | Users; `src/features/admin/Users/Users.jsx` | 20 field sites; 8 overlay JSX sites; inline geometry; shared contract consistency | Named table; scoped bulk actions; upload/reset errors and focus | P1 |
| `/admin/users/create` | CreateUser; `src/features/admin/Users/CreateUser/CreateUser.jsx` | 8 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/users/:id` | UserDetail; `src/features/admin/Users/UserDetail/UserDetail.jsx` | 10 field sites; 4 overlay JSX sites; shared contract consistency | Clear detail/edit/security-action hierarchy | P1 |
| `/admin/assessments/management` | AssessmentManagement; `src/features/admin/assessments/AssessmentManagement/AssessmentManagement.jsx` | 2 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/assessments/create` | AssessmentCreate; `src/features/admin/assessments/AssessmentCreate/AssessmentCreate.jsx` | 3 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/assessments/:id/edit` | AssessmentEdit; `src/features/admin/assessments/AssessmentEdit/AssessmentEdit.jsx` | 26 field sites; 5 overlay JSX sites; tab/filter states; inline geometry; shared contract consistency | Fix question-picker dialog lifecycle; clarify segment and publish actions | P0 |
| `/admin/assessments/configurations` | ConfigurationsList; `src/features/admin/assessments/ConfigurationsList/ConfigurationsList.jsx` | 0 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/assessments/:id/configurations` | AssessmentConfigurations; `src/features/admin/assessments/AssessmentConfigurations/AssessmentConfigurations.jsx` | 0 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/assessments/:id/configurations/create` | ConfigurationCreate; `src/features/admin/assessments/ConfigurationCreate/ConfigurationCreate.jsx` | 51 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Six-step form: associated validation, step semantics and preserved choices | P1 |
| `/admin/assessments/administrations` | AssessmentAdministration; `src/features/admin/assessments/AssessmentAdministration/AssessmentAdministration.jsx` | 0 field sites; 0 overlay JSX sites; shared contract consistency | Preserve redirect-only route; no new screen | P2 |
| `/admin/assessments/administrators/:adminId/users` | AssessmentUserMapping; `src/features/admin/assessments/AssessmentUserMapping/AssessmentUserMapping.jsx` | 10 field sites; 1 overlay JSX sites; shared contract consistency | Separate selection from bulk actions; scope, progress and extend-time focus | P1 |
| `/admin/assessments/results/:mappingId` | AssessmentResult; `src/features/admin/assessments/AssessmentResult/AssessmentResult.jsx` | 0 field sites; 3 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/assessments/progress/:mappingId` | AssessmentResult; `src/features/admin/assessments/AssessmentResult/AssessmentResult.jsx` | 0 field sites; 3 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/groups` | Groups; `src/features/admin/Groups/Groups.jsx` | 2 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/groups/create` | CreateGroup; `src/features/admin/Groups/CreateGroup/CreateGroup.jsx` | 11 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/groups/:id/edit` | CreateGroup; `src/features/admin/Groups/CreateGroup/CreateGroup.jsx` | 11 field sites; 0 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/courses/management` | CoursesManagement; `src/features/admin/courses/CoursesManagement/CoursesManagement.jsx` | 9 field sites; 3 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/courses/management/:id/edit` | CourseEdit; `src/features/admin/courses/CoursesManagement/CourseEdit/CourseEdit.jsx` | 10 field sites; 3 overlay JSX sites; tab/filter states; shared contract consistency | Outline hierarchy and lesson/media modal states | P1 |
| `/admin/courses/:courseId/topics/:topicId/practice` | PracticeSegmentManager; `src/features/admin/courses/PracticeSegmentManager/PracticeSegmentManager.jsx` | 3 field sites; 2 overlay JSX sites; tab/filter states; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/courses/administrations` | CourseAdministrations; `src/features/admin/courses/CourseAdministrations/CourseAdministrations.jsx` | 15 field sites; 3 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/courses/administrations/create` | CreateAdministration; `src/features/admin/courses/CourseAdministrations/CreateAdministration/CreateAdministration.jsx` | 12 field sites; 0 overlay JSX sites; shared contract consistency | Wizard steps, audience selection and preserved wall-clock payload | P1 |
| `/admin/courses/administrations/:id` | AdministrationDetail; `src/features/admin/courses/CourseAdministrations/AdministrationDetail/AdministrationDetail.jsx` | 12 field sites; 4 overlay JSX sites; tab/filter states; inline geometry; shared contract consistency | Separate enrol/invite/expire actions; named tables and confirmations | P1 |
| `/admin/courses/administrations/:id/users/:userId/progress` | ProgressReport; `src/features/admin/courses/CourseAdministrations/ProgressReport/ProgressReport.jsx` | 0 field sites; 2 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/questions` | Navigate; `src/App.jsx:155` | Entry/redirect behavior | Preserve alias destination and browser back | P2 |
| `/admin/questions/banks` | QuestionBanks; `src/features/admin/Questions/QuestionBanks.jsx` | 1 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/questions/banks/create` | QuestionBankForm; `src/features/admin/Questions/QuestionBankForm.jsx` | 6 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/questions/banks/:id` | QuestionBankDetail; `src/features/admin/Questions/QuestionBankDetail.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/admin/questions/banks/:id/edit` | QuestionBankForm; `src/features/admin/Questions/QuestionBankForm.jsx` | 6 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/questions/list` | QuestionList; `src/features/admin/Questions/QuestionList.jsx` | 4 field sites; 1 overlay JSX sites; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P1 |
| `/admin/questions/list/create` | QuestionForm; `src/features/admin/Questions/QuestionForm.jsx` | 25 field sites; 2 overlay JSX sites; inline geometry; shared contract consistency | Label each rich-text editor; accessible tabs/options and import recovery | P1 |
| `/admin/questions/list/:id` | QuestionDetail; `src/features/admin/Questions/QuestionDetail.jsx` | 0 field sites; 0 overlay JSX sites; inline geometry; shared contract consistency | Visible page heading; clear primary action; readable content and responsive filters/forms; associated errors; verify all listed states | P2 |
| `/admin/questions/list/:id/edit` | QuestionForm; `src/features/admin/Questions/QuestionForm.jsx` | 25 field sites; 2 overlay JSX sites; inline geometry; shared contract consistency | Label each rich-text editor; accessible tabs/options and import recovery | P1 |
| `/admin/questions/list/:id/testcases` | TestCaseManager; `src/features/admin/Questions/TestCaseManager.jsx` | 7 field sites; 3 overlay JSX sites; inline geometry; shared contract consistency | Readable sample/hidden I/O; case editing and import validation | P1 |

## 6. Shared component and overlay plan

Dependency map: App → API/theme providers and ToastContainer → Layout → Sidebar/Navigation and Header/TopBar. SecureLayout owns assessment-only presentation. Features → Button/Table wrappers → Primitives; Dropdown/ThemedSelect → Combobox/SelectControl; Confirm/Input wrappers → FormDialogs → Dialog → Layer/Surface; media/lesson/rich-text wrappers → design/widgets; CodeEditor → CodeSurface → Monaco. Preserve compatibility wrappers and improve their central implementations first.

[Complete component inventory](docs/ui-ux-audit/COMPONENT_INVENTORY.md) lists every JSX file's dependencies, controls, fields, headings, conditional states and overlay sites. Automated signals are discovery aids, not proof of absence or tested behavior.

| Shared component | Proposed central change | Preserve and verify |
|---|---|---|
| ActionButton/Button | Explicit variant/size, pressed and width-stable busy state | Native type/disabled/ref and handlers |
| FieldGroup and callers | Label/control/help/error IDs; required/invalid forwarding | Validation rules and payloads |
| Combobox/SelectControl | Correct focused owner; Home/End; active visibility and empty handling | Native select when sufficient; search/multiple/create/positioning |
| Switch/native choices | Consistent targets, labels, fieldset groups | Real checkbox/radio semantics |
| Panel/CourseCard | Shared padding/heading/action hierarchy and media fallback | Progress and navigation |
| DataTable/Pagination | Named regions/captions, opt-in sticky actions, numeric formatting | Selection/export/pagination contracts |
| Navigation/TopBar/Layout | Stable labels, mobile focus/inert lifecycle, account disclosure policy | Roles, active route, collapse preference/logout |
| Tabs/filter groups | Full tab contract or pressed-button filters based on purpose | Selected filter/content |
| Dialog/FormDialogs | All overlays through lifecycle; safe exit/reopen and scroll containment | Nested inert fix, assessment enforcement |
| Popover/tooltip | Focus/Escape, origin-aware optional motion | Critical help never tooltip-only; no extra tooltip suite |
| ToastContainer | Persistent inline validation; deduplicated asynchronous outcomes | Existing pause/drag/limit; inspect library transitions |
| Loading/Empty/Error | Named status, static reduced-motion state, useful retry/next step | No false success or discarded failed input |
| Shared SplitPane proposal | Pointer capture/cancel, keyboard arrows/Home/End, coalesced updates | Direct 1:1 precision; no divider momentum |
| RichTextEditor/CodeSurface | Specific labels and field IDs; efficient resizing | Formatting, drafts, execution |
| Media/document widgets | Named controls, keyboard/errors; caption/transcript capability audit | Do not promise captions absent from supplied content |

### Logical overlay/state catalogue

These group Layer/Surface pairs and callers; they are not 86 independent dialogs. Every mode becomes its own Stage B test row.

- Auth: forgot-password InputModal, PasswordSetup stages; reset-token error/success; shared text/double-text/confirm busy/error/disabled.
- People: Users upload/file/manual entry/validation/result, create/edit/delete, BulkReset group search/pagination/errors; UserDetail edit/reset/regenerate; institution/group delete and member selection.
- Content: course create/delete, CourseEdit lesson create/edit and media/document/text/quiz/practice modes/upload/confirm; practice CRUD/question picker; question import/type-specific editors/options/templates; testcase CRUD/import/delete.
- Delivery: administration edit/delete, detail add/invite/delete/force-expire, report code viewer; creation wizard/audience selectors.
- Assessment authoring: question picker, segment editor, publish/delete/duplicate, configuration activation/delete, mapping refresh/regrade/invite/extend-time, result code/violation action.
- Learner: entry/fullscreen/switch-limit/retry/close/test-submit/segment-submit/end; results feedback rating; quiz incomplete confirmation. Enforcement overlays stay nondraggable.
- Workspace: settings CRUD, email preview/delete/inline form, Playground confirmation/share; account disclosure, custom/native selects and rich-text pickers.

Stage A opened bulk-reset and segment views; other conditional branches were source-inventoried. Exhaustive runtime mode/error coverage is pending and mandatory before marking affected implementation batches complete.

## 7. Interaction improvement plan

| Interaction | Current behavior | Desired / gesture | Motion and interruption | Accessible alternative |
|---|---|---|---|---|
| Navigation | Shared desktop/mobile collapse and slide | Desktop collapse; modal mobile drawer | Reversible slide; optional handle-only swipe | Button/Escape/return focus |
| Account | Outside/Escape close | Native disclosure with deliberate focus/out policy | Optional anchored pointer entrance; keyboard immediate | Tab through links/buttons |
| Select/search | Active index and incomplete focus ownership | Correct owner, active scrolling, Home/End | Selection immediate, search never delayed | Arrows/Enter/Tab/Escape |
| Dialog | Mostly central, authoring bypass | One lifecycle, retain input, persistent errors | Reversible presence without input lock | Top trap, title, return trigger |
| Validate/save | Mixed inline/toast/busy | Associated errors, first-error focus and retry | Immediate stable busy | Summary and field links |
| Table/filter/page | Broad last-column stickiness | Scoped actions, named region and retained filters | Instant; no row stagger | Keyboard scroll/links/sort where supported |
| Course outline | Nested disclosures | Learning rail/current/completed labels | Brief expansion only if useful | Disclosure buttons/current semantics |
| Quiz/MCQ | Mixed choices and review | Labelled groups, preserve attempts/review | Immediate choices/questions | Native option keyboard behavior |
| Code workflow | Two actions/custom cases | Preserve toolbar placement and removed row | Stable pending/error output, no editor animation | Named cases/separators/status |
| Splitter | Mixed mouse/pointer | Direct one-pointer resize, cancel/unmount cleanup | Coalesce layout, no spring lag | Arrows/Home/End |
| Outline reorder | Move up/down | Preserve buttons; optional drag only if justified | Minimal spatial tracking | Existing buttons/announcements |
| Import/upload | File/validation/batch | Stage progress, limits and recoverable errors | Determinate; reduced static busy | Native file + persistent summary |
| Playback | Existing media/document | Clear controls/errors/captions if available | Native playback; no scroll override | Keyboard and supplied transcript |
| Invite/reset/expire/publish | Consequential confirmations | Specific target/scope/outcome | No swipe/hold requirement | Conventional Cancel/confirm |
| Theme | Binary toggle | Preserve explicit choice, optional system mode | No full-page flash/wash | Named control, contrast both modes |
| Outcomes | Toast/spinner/empty | Persistent critical failures; useful next action | Library motion checked; static reduced status | Restrained live regions, no timed-only essential message |

## 8. Implementation roadmap — approval required

Dependencies: 1 → 2 → verified page batches in 3 → 4 → 5 → 6 → 7. Accessibility ships with its owning component, not postponed to final polish. Each phase updates UI_UX_IMPLEMENTATION_PROGRESS.md with files, commands, evidence and outstanding risks.

### Phase 1 — Foundation

Files: tokens/colors.css, system.css, index.css, ThemeContext, palette/token tests/docs. Add semantic status foregrounds, type/spacing/control/easing variables; preserve aliases. Assign one owner to repeated geometry; remove overrides only after documenting winning rules. Outcome: readable coherent foundation without route/API changes.

Acceptance: ordinary text >=4.5:1 and control boundaries/large text per WCAG; 44px touch and 16px input policy; both themes and 200% zoom; current business behavior intact. Tests: composited contrast assertions and Users/form/course/assessment screenshots. Risks: existing exact-palette test requires intentional update; global cascade blast radius. Stop on regression.

### Phase 2 — Shared components

Files: Primitives, Combobox, Dialog, FormDialogs, Navigation, TopBar, Switch, Pagination, Layout, confirmation hook/widgets and compatibility wrappers; new shared splitter. Implement fields/errors, explicit buttons, selection semantics, drawer lifecycle, table options and confirmation single-flight/cancel. Outcome: consistent accessible behavior reused by pages.

Acceptance: labelled states; nested dialogs restore focus/inertness in either close order; closed drawer cannot receive Tab; correct combobox focus owner; pointer cancellation and keyboard resize. Tests: DOM component tests, browser keyboard checks, existing assessment regressions. Risks: portals under inert roots, focus through exit, custom/native selectors and outstanding promises. No second dialog/select system.

### Phase 3 — Page-by-page migration

Files: every owner in section 5 and nested features/widgets in inventory. Verify one batch before next:

1. Auth/profile/shell/dashboard.
2. Institutions, users/bulk reset/upload/detail and groups/create/edit.
3. Courses/edit/lesson/practice manager; question banks/list/forms/detail/testcases/imports.
4. Delivery/create/detail/progress; mailer list/detail/form and Settings.
5. Learner courses/overview/current/practice/quiz/course assessment; standalone editor and Playground/shared.
6. Assessment authoring/configurations/mapping/results; learner list/start/take/results and secure alias.

Per batch: inspect conditional branches; apply shared contracts; preserve API/role behavior; fill route/state ledger; compare screenshots and run targeted tests. Acceptance: every batch route has desktop/mobile, light/dark and all owned overlay states verified, no removed functionality, preserved draft/error/busy behavior. Risks: large authoring files, timers/proctoring, bulk actions and media/iframes. Use synthetic fixtures for visuals and isolated live services for E2E; never production destructive testing.

### Phase 4 — Motion/interaction

Files: central tokens, Dialog presence, Navigation drawer, Combobox/TopBar, Switch and SplitPane. Follow section 4 exact specs. Prototype reversible drawer and measure bundle/performance before any spring dependency. CSS default for simple transitions; if Motion needed record version/import size and decision before adding. Outcome: purposeful spatial continuity.

Acceptance: open/close/open and direction reversals always accept input; no presentation jump; velocity only for actual drawer; no animated timers/questions/typing; <=300ms predetermined transitions. Tests: rapid toggles, keyboard immediate, pointercancel/lostcapture, nested exit lifecycle, reduced motion, CPU traces and real-device touch. Risks: lingering locks, clipping, bundle cost. Remove effects with no usability benefit.

### Phase 5 — Responsive/accessibility refinement

Files: failing route owners/layout/widget semantics. Matrix widths 320/390/768/1024/1440, 200% zoom/400% reflow where applicable, both themes, keyboard/screen reader, coarse pointer, mobile keyboard/landscape/safe areas and reduced motion/contrast/transparency.

Acceptance: zero critical/serious automated findings; manual focus/name/error/selected-state checklist; no page overflow except intentional named data/code regions; important mobile actions reachable. Tests: axe plus NVDA/browser, actual iPhone/Android when available. Risks: emulation cannot establish real hardware feel or WCAG compliance. Record limitations rather than declaring success.

### Phase 6 — Comprehensive verification

Files: tests, dev fixtures, route/state ledger and progress; scoped dev-only tooling. Execute npm test, npm run test:assessment, npx eslint ., npm run build. Record baseline lint failures separately; no typecheck claim for JS without checker. Backend contract tests only in known isolated environment, not unknown DB startup.

Add meaningful DOM/E2E tests for field/selector/drawer/modal contracts, auth recovery, create/edit/filter/import, authoring/enrolment/media, quiz and assessment draft/resume/run/submit. Outcome: reproducible evidence. Acceptance: ledger pass or explicit limitation for every required cell; no P0/P1 regressions; new tests/build pass; console/network failures triaged; bundle/interaction comparison. Mock success is not live-service verification.

### Phase 7 — Review and feature-branch release

Review full diff; remove debug/unused/duplicated UI code; verify no backend/policy drift. Progress records files, tests, screenshots and limitations. Commit meaningful phase changes and push codex/ui-ux-upgrade to existing frontend remote, never force-push; no unrelated parent submodule/backend commit. No develop merge/deployment without explicit approval.

Acceptance: unrelated changes untouched; no secrets/env/sensitive fixtures committed; tests/build reviewed; remote feature commit confirmed. Existing deployment workflow unchanged unless separately approved tooling work requires it.

## 9. QA strategy

- Unit: contrast/token pairs, state transitions, confirmation cancellation, validation/formatting contracts and splitter bounds.
- Component: Field help/error IDs, button states, tabs/filter semantics, combobox empty/search/multiple, drawer/modal focus and inert recovery. Add a maintained dev-only DOM runner only where existing Node tests cannot test browser behavior; justify dependency/version first.
- Integration: delay/401/403/422/500/offline/retry, retained input, role-dependent controls, import batch progress, duplicate-submit prevention. Preserve payload and timezone semantics.
- E2E: disposable fixture accounts and isolated DB/API. ui-live needs :3182/:3183. Email/S3/execution/popup tests only in designated test services; do not infer from synthetic snapshots.
- Ledger: every route/redirect/role; source owner; default/loading/empty/error/success; overlay mode; viewport/theme; executed action/evidence/result. Separate source review, initial browser render, completed interaction and live-service coverage.
- Stress data: plausible long names/titles, long plus-addressed email, Jo, CJK/Arabic/emoji initials, missing fields/media, 0/1/page-size+1/1000 rows, long code/I/O, Unicode and long validation lists. Inject via dev fixture data boundary, no production mutations or validation-policy changes.
- Motion: ten rapid toggles, mid-flight reversal, pointercancel/lostcapture/unmount, reduced mode, drawer scrolling, slow/frame review and CPU trace. Precision resize legitimately changes layout; profile rather than applying fake scale.
- Performance: record lazy chunk baseline and interaction long tasks. Target no unexplained >10% route-chunk growth, no new >50ms animation task in agreed trace, measured smooth 60Hz on representative hardware. Immediate busy indication; no decorative loading delays.
- Accessibility: WCAG 2.2 AA target; headings/names, focus not obscured, keyboard, associated errors, non-color status, zoom and composited contrast. Axe supplements NVDA/manual/hardware checks; it cannot establish compliance alone.
- Visual: same fixture/viewport/theme before/after, intentional differences reviewed; interaction tests remain necessary beyond screenshots.

## 10. Before/after expectations and approval

| Before | After / measurable criterion |
|---|---|
| Hidden navigation may lose names or retain invisible focus | Every link named; closed drawer excluded from Tab; focus restored |
| Dense labels/status contrast inconsistent | Shared type scale and >=4.5:1 ordinary text in both themes |
| Visual errors disconnected | Every invalid control associated with persistent error; failed values retained |
| Authoring overlay bypasses lifecycle | Every modal owner passes focus/Escape/scroll/inert recovery |
| Mouse-only splitter variations | Pointer/touch/keyboard support, safe cancellation and profiled precision |
| Cascading overrides/implicit variants | Documented style ownership and explicit semantic component APIs |
| Spring token is ordinary easing | Duration/easing separated from actual gesture spring behavior |
| Preview mistaken for complete testing | Full route/state ledger with honest infrastructure gaps |
| develop push can deploy | Dedicated feature branch only; merge/deploy explicit approval |

Recommended scope: all seven phases in order, preserve architecture/brand, prioritize P0/P1 access and interaction issues. Retain coding actions in test-case bar and do not restore removed instruction row. No backend/database contract changes or new production UI framework. Spring dependency remains conditional on concrete prototype/bundle justification.

The user approved the roadmap (“yes”) before implementation began. Phase 1 implementation and Phase 2 shared component work are underway; current verification status is recorded in UI_UX_IMPLEMENTATION_PROGRESS.md. Actual OS permissions/popups, live services, real devices and exhaustive conditional runtime states remain verification work, not silently completed tests.
