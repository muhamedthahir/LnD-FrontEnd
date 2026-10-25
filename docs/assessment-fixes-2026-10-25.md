# Assessment fixes — 25 October 2026

| Bug | Cause | Fix |
| --- | --- | --- |
| Permission prompts count as switches | Secure-window blur monitoring started before data/permissions were ready; a separate visibility listener could count the same departure again. | Explicit Enter assessment gate; register monitoring only after entry/fullscreen succeeds; count visibility departures through one listener. Native blur alone no longer counts as a tab switch. |
| Page becomes unresponsive | Concurrent dialogs restored previously captured inert flags in the wrong order, potentially leaving the application or another dialog disabled. | Central dialog-stack restoration preserves original inert values; assessment dialogs have a single priority-selected active view. |
| Unexpected clipboard toast | Context-menu, drag and focus-related clipboard handlers treated ordinary gestures as prohibited clipboard use. | Warn only for clipboard shortcuts/events and paste/drop input; remove clipboard clearing on focus and context-menu warnings. Right-click restrictions remain independently configurable. |
| Save appears successful after server failure | Save callback never checked response.ok and removed the recovery draft. | Check HTTP status and retain the local draft; failed saves do not mark code saved or proceed to execution. |
| Execution appears stuck | Requests had no timeout, so busy states could remain indefinitely. | Default 30-second request timeout with existing error/finally recovery. |
| Timer can skip auto-submit | Timer set the submission guard before calling the guarded submit function. Interval callbacks also captured old question/segment state. | Trigger expiry from an effect; use current callback refs; keep state updaters pure. Calculate elapsed wall time when browser ticks are delayed. |
| Expired resume gains time | A zero remaining time fell through an OR fallback to total duration. | Nullish fallbacks preserve zero. |
| Failed auto-submit closes the window / warning gets stuck | Countdown closed the secure window even after submit failed; exceeded-limit dialog had no recovery action. | Submit returns a success result; close only on success; offer Retry submission after countdown on failure. |
| Failed code submit looks recorded | A callback returning success:false could fall through to a success message. | Treat explicit failure as an error and show it in output. |
| Sample execution uses wrong fields | Input/output field aliases were handled inconsistently. | Accept input/input_data and expected_result/expected_output/output, preserving empty expected output. |
| Current question loses its highlight | Answered status took precedence over current status. | Current question styling takes precedence. |

The coding workspace has two primary actions: Save & Run and Submit Code. Save & Run saves first, then runs all visible samples or the selected custom input. Submit Code saves and sends the solution for authoritative grading, including hidden cases. Students may submit partial solutions without first passing every sample.

Custom cases are added, edited and selected inside the Test cases panel (up to ten). Sample results and submission history remain separate tabs. The problem/editor divider supports pointer dragging and keyboard arrows; the editor/output divider remains adjustable. Narrow viewports stack panels. The question-menu control is text-labelled and aligned with question progress.

Validation: npm test passed (24 tests); npm run test:assessment passed (5 test entries, including four draft-storage assertions); production build passed. Browser QA used synthetic assessment and execution responses to verify entry, sample running, custom input execution, question-menu opening, MCQ selection, and returning to coding.

Limits: the checked-in frontend contains fullscreen requests but no getDisplayMedia/screen-sharing implementation. The entry gate prevents initial permission-related penalties in this assessment flow. Actual OS screen-sharing prompts and live execution/submission services were not exercised. Tab visibility monitoring intentionally does not penalize blur-only events, including native popups; switching to a different app while the assessment remains visible is therefore not classified as a tab switch.

Preview: /scripts/assessment-qa/index.html?role=student&route=/user/assessments/1/take (development only).
