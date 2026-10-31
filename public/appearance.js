// Apply the saved appearance before the application paints to avoid a theme flash.
try {
  const savedPreference = localStorage.getItem('themePreference');
  const savedTheme = localStorage.getItem('theme');
  const preference = ['light', 'dark', 'system'].includes(savedPreference) ? savedPreference : ['light', 'dark'].includes(savedTheme) ? savedTheme : 'system';
  const theme = preference === 'dark' || preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
} catch { /* Leave the document's default appearance when storage is unavailable. */ }
