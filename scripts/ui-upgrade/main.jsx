// Keep the existing shared fixture untouched; isolate theme preferences per QA URL.
const requestedTheme = new URLSearchParams(location.search).get('theme')
localStorage.setItem('themePreference', requestedTheme === 'dark' ? 'dark' : 'light')
document.documentElement.dataset.theme = requestedTheme === 'dark' ? 'dark' : 'light'
import('../ui-mock/main.jsx').then(async () => {
  if (new URLSearchParams(location.search).has('coding')) await import('./codingFixture.js')
})
if (new URLSearchParams(location.search).has('a11y')) {
  import('./accessibility.js')
}
