# CSS Module Conversion - Complete Guide

## Status
- ✅ Button component converted
- ✅ CourseCard component converted
- ⏳ 57 files remaining

## Conversion Pattern

### 1. File Renaming
```bash
ComponentName.css → ComponentName.module.css
```

### 2. CSS Class Name Conversion
- Convert kebab-case to camelCase
- Example: `.course-card` → `.card`
- Example: `.header-left` → `.left` or `.headerLeft`

### 3. JSX Import Update
```javascript
// Before
import './ComponentName.css'

// After  
import styles from './ComponentName.module.css'
```

### 4. className Updates
```javascript
// Before
<div className="course-card expired">

// After
<div className={`${styles.card} ${styles.expired}`}>

// Dynamic classes
<span className={`status ${status}`}>
// Becomes
<span className={`${styles.status} ${styles[status]}`}>
```

### 5. Global Selectors
For global selectors (like `html[data-sidebar-collapsed]`), you have two options:
- Keep them in a global CSS file (index.css or App.css)
- Use `:global()` wrapper in CSS modules:
```css
:global(html[data-sidebar-collapsed="false"]) .header {
  left: 12rem;
}
```

## Files to Convert (Priority Order)

### High Priority (Shared Components)
1. Header
2. Sidebar  
3. Layout
4. Dropdown
5. Pagination
6. ConfirmModal
7. InputModal
8. DoubleInputModal
9. Toggle
10. ThemeToggle
11. PasswordSetup
12. RichTextEditor

### Medium Priority (Page Components)
- All pages in `src/pages/admin/`
- All pages in `src/pages/user/`
- All pages in `src/pages/`

### MediaPlayer Components
- VideoPlayer
- AudioPlayer
- DocumentViewer

## Testing Checklist
After converting each component:
- [ ] Visual appearance matches original
- [ ] Hover states work
- [ ] Dynamic classes work correctly
- [ ] Responsive styles work
- [ ] No console errors
- [ ] No style conflicts with other components

## Notes
- CSS modules automatically scope class names
- Use camelCase for class names in modules
- Keep truly global styles in `index.css` and `App.css`
- Test thoroughly after each conversion

