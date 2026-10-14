import { useTheme } from '../contexts/ThemeContext'
import { ActionButton } from './Primitives'
import Icon from './Icon'
export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()
  return <ActionButton variant="quiet" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'}/></ActionButton>
}
