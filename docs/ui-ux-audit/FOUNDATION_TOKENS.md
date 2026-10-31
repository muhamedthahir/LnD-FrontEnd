# Foundation tokens and ownership

Phase 1, 30 October 2026. Approved roadmap branch: codex/ui-ux-upgrade.

- colors.css owns theme colors and elevation; system.css no longer overrides theme shadows with generic values.
- Existing success/warning/error aliases now represent readable foregrounds. Original signal values remain --signal-success/--signal-warning/--signal-error for intentional decorative use. The exact-palette baseline was explicitly revised; contrast assertions independently verify accessibility so baseline replacement cannot mask a failure.
- Light status foregrounds: success #066b4d, warning #874e00, error #b42336. They pass 4.5:1 on cards/inputs and composited status tints. Dark foregrounds/on-accent remain suitable. Muted aliases now use readable tertiary text.
- --border-control is separate from decorative separators; input boundaries pass 3:1 against input surfaces. Decorative card separators need not masquerade as required control outlines.
- system.css owns 16px-at-default body typography, heading scale, rem spacing aliases, radius, duration/easing and shared layout. Root uses 100%, respecting browser font preference.
- foundations.css is intentionally last after legacy page rules and owns shared toolbar/field/table/status typography, tabular data, coarse-pointer control policy, increased contrast and reduced transparency. It does not contain route-specific selectors. Page-specific cleanup belongs to Phase 3.
- Tables retain horizontal scroll and every column/action. Shared compact data text is 14px, table headings/status 12px; field/toolbar labels 14px. Controls have 44px touch targets for covered shared primitives; complete native/custom control audit remains Phase 2/5.
- Motion durations/easings are distinct tokens. --transition-spring is only a deprecated compatibility alias, not physical motion. No new decorative motion/dependency introduced. Reduced-motion stops animations rather than running infinite loops at .01ms.
- Explicit theme toggle behavior unchanged. System-mode selector remains optional future work; no new preference model was introduced in this foundation patch.

Verification: npm test 26 pass, npm run test:assessment 5 entries pass, npm run build pass. Browser screenshot/zoom/theme/coarse-pointer verification pending: local browser use is disabled in Work settings. Phase 1 is implemented but NOT complete until those acceptance checks pass. No backend/API/auth business-rule changes.
