# CampusZen complete UI rebuild

Planning phase — October 12, 2026. This is the implementation specification, not a completed visual redesign. The source inventory reads all 53 JSX files under pages and all 21 shared JSX components. See `ui-source-inventory.json` and `UI_REBUILD_COVERAGE.md` for file-level coverage. Runtime screenshots for every state remain an implementation acceptance requirement.

## Direction

October 13 update from the user: remove page-purpose headers and their descriptive copy throughout the application. Put list actions beside filters; use a compact toolbar for essential record context, navigation and timers on detail/authoring screens. Restore the supplied CZ symbol on a light square and use that same asset for branding and favicon. These instructions supersede earlier page-heading/hero treatments.

Build a calm, professional learning workspace with strong typography, clear task hierarchy, purposeful whitespace, and precise controls. Use the existing navy, blue, orange, neutral, and semantic colors in both themes. Replace the current shell, page composition, component markup, non-color tokens, CSS, typography scale, icon treatment, chart presentation, and interaction design. A page does not count as rebuilt merely because a shared stylesheet makes it look different.

Start with three complete design prototypes: Users with import and password-reset dialogs; a student dashboard and course player; an assessment configuration wizard and timed assessment. Review these at desktop and mobile sizes in both themes before extending the patterns across all routes. These cover dense administration, content consumption, and high-stakes timed workflows.

## Exact palette contract

Extract color declarations from the current `src/index.css` theme blocks into `src/design/tokens/colors.css` before replacing old styles. `color-palette-baseline.json` records exact values and color literals for both themes. Preserve every existing color value, including semantic success/error/warning and alpha variants; preserve gradient color stops when used, while changing where gradients appear. Do not copy the old spacing, shadow, radius, typography, layout, or component styles.

| Token | Light | Dark |
| --- | --- | --- |
| Main background | #f2f5fb | #070b17 |
| Card surface | #ffffff | #0f1628 |
| Raised surface | #ffffff | #141c33 |
| Primary accent | #2457e6 | #6b9bff |
| Secondary accent | #3b6cf0 | #5687f2 |
| Orange | #f26a1b | #ff8a3d |
| Main text | #0d1630 | #eef2fc |
| Secondary text | #3f4c6b | #b3bfdc |
| Borders | #dde3f0 | #1f2a45 |

Choose accessible combinations from this palette. Existing muted colors that fail text contrast must be used for decoration rather than essential text. Charts use existing accents and semantic colors, with patterns/labels as additional distinctions. Dark mode is designed directly using its own surfaces and text colors, rather than applying an inversion filter.

## New structure

Use `src/design` for primitives, tokens, layouts, and patterns. Use `src/features` for page views and feature-specific composition. Separate data hooks, validation, and transformation code from new visual views so business behavior remains testable. Keep the existing routes and endpoint contracts during the transition; role visibility must match server authorization.

Create a route metadata registry containing page titles, breadcrumbs, navigation group, role visibility, and layout type. Preserve aliases and redirects, public playground shares, and the secure assessment route. Do not leave production links pointing to discarded legacy screens.

Build four layout types:

1. **Administration workspace:** 248px navigation on wide screens, compact rail on medium screens, drawer on phones. A 64px top bar carries breadcrumbs, account menu, and theme switch. Page headings include a short purpose statement and one primary action. Content uses a 1,440px maximum reading width; wide reports may exceed it inside a dedicated scroll region.
2. **Student workspace:** distinct navigation grouping and an action-led dashboard. Continue learning, upcoming assessments, and progress lead the content. Course cards have readable titles, metadata, and one next action.
3. **Learning/editor workspace:** a compact contextual bar, resizable curriculum/problem pane, media/editor surface, and a clear next-step footer. Resize persistence must be scoped per layout. Small screens stack panes and expose a labeled switcher rather than squeezing them side by side.
4. **Secure assessment workspace:** no general sidebar. Fixed timer/status region, question content, navigation palette, and visible save state. Separate submission actions from ordinary navigation. Preserve fullscreen, proctoring, timing, autosave, and grading semantics.

The shell should use grid/sticky positioning so header/sidebar widths come from one source. Avoid each page calculating its own fixed offsets. At 320px there must be no page-level horizontal scrolling; tables and code are permitted to scroll within explicitly labeled regions.

## Typography, spacing, and visual hierarchy

Use one readable sans family, preferably locally hosted Inter with system fallbacks, and a dedicated monospace face for code. Confirm font licensing and bundle size before adding assets. Use a 16px body baseline, 14px table/UI text, 12px secondary annotations, and a 24–32px page-heading scale. Required content must remain readable at 200% zoom. Use tabular numerals for metrics and timers.

Use a 4px spacing rhythm and consistent 8/12/16/24/32/48px layout gaps. Inputs and primary buttons are 44px high; compact table actions may be smaller visually while retaining a usable target. New radius hierarchy: 6px controls, 10px panels, 16px dialogs. Use a restrained elevation hierarchy; reserve blur for deliberately tested surfaces and avoid large ambient glows behind data.

Each page has one primary heading, purposeful section headings, consistent label placement, and a visible primary action. Eliminate decorative badges around every data cell, repeated gradients, emoji icons in system dialogs, and nested cards without meaning. Use consistent line icons with accessible labels; label actions that are ambiguous without text.

## Component system to create

| Area | Required components and behavior |
| --- | --- |
| Navigation | AppShell, NavigationGroup, Breadcrumbs, PageHeader, Tabs, AccountMenu, ThemeSwitch, MobileNavigation |
| Actions | Button with primary/secondary/quiet/destructive variants, IconButton, SplitAction where justified, loading state with fixed width |
| Forms | Field, Input, Textarea, PasswordField, Select/Combobox, Checkbox, RadioGroup, Switch, DateTimeField, FileDropzone, InlineError, FormSection |
| Data | DataTable, selectable rows, stable column sizing, sort indicators, Pagination, FilterBar, ActiveFilters, BulkActionBar, DescriptionList |
| Feedback | Skeleton, EmptyState, ErrorState with retry, InlineNotice, Toast, Progress, SaveStatus, ImportProgress |
| Overlays | Dialog, AlertDialog, Drawer, Popover, Tooltip. One portal/layer/focus system shared by every feature |
| Learning | CourseCard, CurriculumTree, LessonView, MediaControls, DocumentToolbar, QuestionCard, AnswerOptions, QuestionNavigator |
| Reporting | Metric, ChartFrame, accessible chart legend, SegmentProgress, ReportTable, score visibility/locked-results state |
| Editors | RichContentEditor, CodeWorkspace, LanguageSelect, ConsolePanel, TestCaseEditor, resizable panels |

Every component has an explicit behavior contract and examples in both themes: default, hover, focus, disabled, loading, error, long content, and empty content. Implement complex keyboard behavior with a proven accessible primitive library if warranted; keep all visual styling in the new design layer.

## Page families

| Family | New presentation |
| --- | --- |
| Login, password setup/reset | Focused authentication panel with a modest brand surface, clear errors, labeled password visibility, and a consistent recovery flow |
| Admin/student dashboards | Separate purpose-driven compositions; useful metrics and next actions, responsive course/assessment panels, accessible loading states |
| Users | Search/filter bar, efficient table, individual profile workspace, dedicated creation page, clear import progress, group-reset impact preview |
| Institutions | Structured organization directory, two-column creation form on wide screens, detail tabs for overview/admins, obvious edit/save boundaries |
| Groups | Directory and member-management workspace; selected/available member lists with counts and persistent selection through paging |
| Course management | Content library plus curriculum builder; settings in a side panel and lesson/practice editing in dedicated workspaces |
| Course administration | Enrollment workspace with Overview/Users/Invites/Progress sections; explicit publish, expire, extend, and delete impact summaries |
| Question banks/questions | Searchable library, metadata sidebar, distinct MCQ/programming editors, preview, test-case table, import wizard with row results |
| Assessments | Management list, segment builder, question picker, configuration wizard, mapping workspace, and readable performance reports |
| Student learning | Course overview with outcomes/curriculum; focused lesson player and a clear continue path; distinct practice and timed test modes |
| Student assessments | Availability cards, structured readiness/instructions, secure take flow, explicit save state, results and answer-review views |
| Mail templates/settings | Template list, composition plus preview, delivery status; settings divided into navigable categories rather than a single generic table |
| Profile/playground/code editor | Sectioned personal profile and focused code/file/preview workspaces with responsive panel controls |

Each source file has a separate migration row in `UI_REBUILD_COVERAGE.md`. Nested forms and aliased routes are included rather than treated as unneeded pages.

## Every modal and transient surface

Inventory conditionally rendered overlays as well as components named Modal. Include dialogs with names such as Add Users, Invite Candidates, Force Expire, Extend Time, Preview Template, Add Segment, Question Picker, and proctoring warnings. See the coverage appendix for owners.

Replace every overlay with the new Dialog/AlertDialog/Drawer primitives. Short confirmations use AlertDialog; small edits use Dialog; long editing/import flows use a full page or step-based dialog with a scrollable body. On mobile, complex dialogs become a full-screen sheet while preserving title, progress, and actions.

Required behavior: initial focus, trapped Tab order, Escape according to action semantics, focus restoration, scroll locking, accessible title/description, proper background isolation, predictable nested layers, and no accidental form submission by close buttons. Dialog headers and footers remain visible when bodies scroll. Busy destructive/reset submissions prevent double posting and ambiguous cancellation. Do not clear user input after an error.

For group password reset, show the institution, group, affected count, password rules, matching confirmation, and final affected count. Do not expose passwords in telemetry, logs, URL parameters, or storage. Preserve transactional scope checks.

For student/question/test-case imports, show accepted file constraints, validation preview, transfer/import progress, final row results, duplicate warnings, and invitation status. Network/CORS/WAF errors must not collapse into an unhelpful success or infinite spinner. Preserve the existing student import job across navigation/refresh using only its opaque identifier. Programming uploads still need a server-side upload transport decision before claiming this flow is fixed.

Timed assessment dialogs require a separate interaction review: a fullscreen requirement, tab warning, segment timeout, submit confirmation, or session expiry must never cover the only recovery action or alter the timer unexpectedly. Test keyboard navigation under actual proctoring rules.

## Replacement sequence

1. Freeze the palette and inventory routes, roles, overlays, data states, and existing behavior tests. Capture baseline screenshots for representative pages; identify live/mock differences explicitly.
2. Build and review the three representative prototypes in light/dark at 375px and 1440px. Settle the shell, typography, table, forms, editor, and dialogs here.
3. Implement the new token/component layer with a development-only component gallery. Build the four new layouts and shared overlay infrastructure.
4. Migrate identity, Users, Institutions, Groups, and Settings. Keep creation/edit/reset/import/delete functionality complete.
5. Migrate question libraries, question editors, test cases, course management, lesson editing, and administration reports.
6. Migrate assessment management/configurations/mappings and student dashboards/courses/results. Timed assessments and code execution receive their own integration gate.
7. Run the complete matrix below, fix issues, then delete all unused legacy JSX/CSS, `styles/kit.css`, duplicate `.css`/`.module.css` pairs, and compatibility styling. Rename new routes/components to the final structure and verify the production graph contains no old visual layer.

Legacy rendering can remain temporarily during implementation so routes stay testable. The final result must have a wholly new presentation layer; the acceptance gate blocks leaving old screens behind. Preserve working API/state logic through new hooks rather than rewriting business rules for visual reasons.

## Acceptance matrix

Each route/component/overlay gets a tracked result for:

- Light and dark at 320, 375, 768, 1024, and 1440px, plus 200% zoom and a short 375×667 viewport.
- Platform admin, college admin, and student role paths, including denied/institution-scoped states.
- Loading, empty, normal, populated, long names/emails, 1,000-row pagination, validation errors, API failures, disabled actions, and in-flight submissions.
- Dialog opening/closing, keyboard and screen-reader labels, focus trapping/restoration, nested overlays, internal scrolling, and visible footer actions.
- Table/card/editor/media/chart behavior with real long content; contrast checks for text, inputs, focus, chart legends, and selected states.
- Critical journeys: student import, group password reset, institution creation, group membership, question/programming/test-case import, course publication/enrollment, assessment configuration/start/save/timeout/submit/results, sign-in/refresh/recovery/logout.
- No overlap, cut-off text, invisible controls, detached dropdowns, background scroll during dialogs, layout shifts from missing loaders, or unlabeled icon-only actions.
- Route lazy loading stays in place; xlsx, Monaco, rich editor, PDF, and charts stay out of ordinary initial-load bundles. Record build size and measured load/interactivity before and after. UI beauty must not undo backend performance work.

Use browser screenshots and actual interaction checks for each file/route row, with synthetic data for destructive actions and no real password reset or invitation sending during QA. Unit/build checks support the visual review but do not replace it. A route is accepted only after both themes and all its modal states have recorded evidence.

## Completion criteria

All rows in the coverage appendix are implemented and verified; old presentation files are removed; all role journeys work; theme colors match the preserved palette; the functional tests/build pass; visual artifacts show both themes and responsive layouts. No claim that every screen is beautiful or complete until the full matrix is inspected.
