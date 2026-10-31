# UI/UX implementation progress

Updated 31 October 2026 (Asia/Calcutta). The user approved the roadmap. Implementation is active on `codex/ui-ux-upgrade`. **The full plan is not complete. On 31 October the user explicitly requested pushing the current reviewed UI changes to the feature branch.**

## Current phase ledger

| Phase | Status | Evidence / remaining work |
|---|---|---|
| 1 Foundation | Implemented; verification in progress | Semantic contrast, type, spacing, boundaries, touch sizing and reduced motion added. Contrast tests pass. Correct mobile screenshot method recovered; viewport/theme/zoom matrix in progress. |
| 2 Shared components | Implemented core fixes; verification in progress | Fields/selects/rich text share labels/errors; explicit button variants; named tables with opt-in sticky actions; central modal drawer lifecycle; confirmation cancellation; shared pointer/keyboard splitter. Browser checks passed for select, nesting, confirmations and keyboard resize. Pointer cancellation and broader route checks remain. |
| 3 Page migration | In progress | 324 buttons across 55 JSX owners migrated; 15 tables named; 35 standard page titles; status filters corrected; create-user/institution/group validation summaries; assessment question picker uses central layer; five coding splitters migrated. Full route/state ledger in progress. |
| 4 Motion | In progress | Closing layers become inert immediately; modal locks release safely while visual exit finishes; short reversible CSS transitions, keyboard disclosure behavior and reduced-motion policy. Reversal/gesture/performance checks remain. |
| 5 Accessibility/responsive | In progress | Mobile drawer focus trap, Escape and focus restoration verified; mobile form fits 390px. Full width/theme/zoom matrix, automated checks, screen-reader/hardware limitations to record. |
| 6 Comprehensive verification | In progress | Last unit pass: 26/26; assessment: 5/5 plus four draft assertions; build: 416 modules. Full eslint: 0 errors, 90 warnings. These preceded the latest motion/theme edits and must be rerun after final fixes. Live service flows and browser ledger pending. |
| 7 Review/release | Not started | Review full diff, finish reports and await user review before push. Never merge develop (it deploys). |

## Changes and reasons

- Foundation: readable semantic status/muted text and distinct control borders, retained decorative signal colors, consistent type/spacing/radius/easing, reduced-motion loops stopped. See `docs/ui-ux-audit/FOUNDATION_TOKENS.md`.
- Combobox: focused input owns active-option semantics; empty results have no dangling ID; one-step arrows, Home/End, active visibility, Tab exit, search reset and error context.
- Fields: preserve existing feedback IDs; labels/descriptions/invalid/required states reach native/custom selects and rich text. Create forms keep validation rules and payloads while presenting persistent summaries and focusing the first invalid field.
- Dialogs: capture trigger before autofocus, preserve autofocus, propagate restoration through out-of-order nested closes, make exiting content inert and release ownership safely on close. The mobile navigation drawer uses the central layer for background inertness, scroll lock and focus containment.
- Confirmation: overlapping requests settle the old promise as false; unmount cancels pending requests; stable dialog component identity supports presence.
- Splitters: shared ResizeHandle replaces mouse-only listeners in standalone editor, code/output, playground, practice and assessment. Pointer capture, cached geometry, animation-frame updates, keyboard bounds and cancellation cleanup.
- Page consistency: explicit action variants, named table regions, opt-in sticky action columns, visible primary headings, pressed-state filters and execution views.
- Theme: persisted explicit light/dark choice plus device appearance option, live system preference and browser chrome color.

## Verification evidence

Browser shared fixture: arrow down selected option 1 (no duplicate event), End/Enter selected C, empty search exposed zero options and no active ID, Tab moved to the next control. Nested dialogs closed outer first then inner with focus returned to original trigger. Two confirmations settled [false,true]. Divider End reached its 80% upper bound. Mobile drawer Shift+Tab wrapped to the last link; Escape restored the menu button; closed navigation was absent from the accessibility tree.

Users light/dark, Create User, course library, assessment list/editor desktop views inspected. Correct-size mobile form screenshot confirms reflow without page overflow. Earlier native screenshot viewport captures were scaled; those are superseded by tab.screenshot() evidence, not counted as responsive passes.

New dev-only fixtures: `scripts/ui-components` for shared interactions; `scripts/ui-upgrade` wraps the existing mock fixture and isolates appearance preference without editing its preexisting changes.

Local servers: frontend on 5173; backend on 3000, connected to local MySQL `demo`. Backend was started at the user's request; it performs its existing table initialization. No backend source changes made by this upgrade. Existing configured execution service is remote; no live execution claim.

## Outstanding and preserved state

Complete all remaining route/overlay/error/busy states and responsive matrix. Real NVDA/device/OS permission validation may require explicit limitations; never claim WCAG or full live-service coverage from mocks. Maintain the user's two coding actions in the test-case header and keep the removed status row absent.

Preserve preexisting frontend `scripts/ui-mock/main.jsx`, untracked ui-live workbook/audio, backend controller/model/log edits, and root evidence directories. Do not stage them. No upgrade commit, push, merge or production deployment has occurred.

## 31 October follow-up

Completed the requested compact titles and group transfer layout before resuming the UI review. Shared heading defaults are now 20px / 18px / 16px. Group membership selection uses equal available/selected columns with centered transfer arrows; below 600px the lists stack and arrows turn vertically. Compact selection labels remove redundant boxes. Student rows are native checkbox labels; searches have distinct accessible names. Fixed the group form submit path passing no event to validation focus handling.

Browser fixture verification: add moved available 16→15 and selected 8→9; reverse restored 16/8. Desktop 1440 and phone 390 had no horizontal page overflow. Desktop group selection axe reported no violations; incompletes concern text clipped inside scrolling lists. Semantic foreground contrast is separately tested. Screenshot: docs/ui-ux-audit/after/group-transfer-desktop-light.png. Synthetic students only; no real membership was changed.

Continued assessment editor review: Details/Segments now expose selected state through aria-pressed. Add Segment dialog passed axe with no violations/incompletes; Escape returned focus to Add Segment and released the body scroll lock.

Latest checks: frontend tests 26/26; assessment tests 5/5 plus four draft assertions; build 419 modules passed before the final small CSS/tab-state follow-up. Full ESLint 0 errors / 90 warnings. Backend earlier tests 86 passed. Route evidence contains 600 width/theme combinations; accessibility evidence covers desktop and phone in both themes. These use deterministic fixtures and do not establish full live-service coverage.

Browser Ctrl+plus did not change CSS viewport or devicePixelRatio in the available IAB; actual browser zoom remains unverified. Narrow CSS viewport reflow was checked independently. NVDA, real touch/mobile keyboard/safe areas, OS permissions, external compiler behavior, and CPU traces remain explicit verification limitations. Full plan remains in progress; no push or production deployment is authorized before review.

## Shared page Back navigation follow-up

Moved page-level return actions into an explicit PageContent backAction slot across 44 return states. Page title and Back now share one flex row, with Back aligned to the right; form-step and dialog Back controls keep their workflow behavior. Dynamic course/assessment/quiz headings move into the same shared row. Removed empty back-only toolbars.

Browser fixture check: all 35 affected normal routes at 320px and 1440px passed title/button vertical-center alignment, non-overlap and no page overflow (70 route/width cells; earlier representative checks also retained). Verified group Back destination. Screenshots: docs/ui-ux-audit/after/page-back-desktop.png and page-back-mobile.png. Build passed (419 modules); 26 frontend tests passed; ESLint remains 0 errors / 90 warnings. No push.

## Feature branch publication

The user requested push after reviewing compact headings, group transfer lists, and aligned Back navigation. Publishing the current implementation to codex/ui-ux-upgrade; develop and its production deployment remain unchanged. Preexisting ui-mock fixture edits, ui-live workbook/audio, lint scratch output, and backend edits are excluded. The earlier verification limitations remain applicable.
