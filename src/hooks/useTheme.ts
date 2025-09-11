import { createContext, useContext } from 'react'

type Theme = 
  | 'dark' 
  | 'ocean'
  | 'slate'


export const themeDisplayNames: Record<Theme, string> = {
  dark: 'Dark Turquoise',
  ocean: 'Ocean Deep',
  slate: 'Slate Gray',
}

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

export { ThemeProviderContext, type Theme }