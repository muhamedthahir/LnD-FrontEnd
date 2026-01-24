# CSS Module Conversion Guide

This guide documents the conversion of all CSS files to CSS modules to prevent style conflicts.

## Files to Keep as Global CSS
- `index.css` - CSS variables and global styles
- `App.css` - App-level global styles

## Conversion Pattern

### Step 1: Rename CSS file
- `ComponentName.css` → `ComponentName.module.css`

### Step 2: Update class names in CSS
- Convert kebab-case to camelCase (e.g., `course-card` → `card`)
- Keep semantic names but make them module-scoped
- For dynamic classes, use bracket notation: `styles[className]`

### Step 3: Update JSX imports
```javascript
// Before
import './ComponentName.css'

// After
import styles from './ComponentName.module.css'
```

### Step 4: Update className usage
```javascript
// Before
<div className="course-card expired">

// After
<div className={`${styles.card} ${styles.expired}`}>
```

### Step 5: Handle dynamic classes
```javascript
// Before
<span className={`status ${status}`}>

// After
<span className={`${styles.status} ${styles[status]}`}>
```

## Components Converted
- ✅ Button
- ✅ CourseCard

## Components Remaining
- [ ] All other components in `src/components/`
- [ ] All pages in `src/pages/`

## Notes
- CSS modules automatically scope class names
- Use camelCase for class names in modules
- Keep global styles in `index.css` and `App.css` only
- Test each component after conversion


