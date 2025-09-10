import { createContext, useContext } from 'react'

type Theme = 
  | 'dark' 
  | 'light' 
  | 'midnight'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'rose'
  | 'cyberpunk'
  | 'monochrome'
  | 'lavender'
  | 'emerald'
  | 'amber'
  | 'crimson'
  | 'slate'
  | 'indigo'
  | 'teal'
  | 'bronze'
  | 'west-ham'
  | 'arctic'
  | 'volcano'
  | 'galaxy'
  | 'mint'

export const themeDisplayNames: Record<Theme, string> = {
  dark: 'Dark Turquoise',
  light: 'Light Turquoise',
  midnight: 'Midnight Blue',
  ocean: 'Ocean Deep',
  forest: 'Forest Green',
  sunset: 'Sunset Orange',
  rose: 'Rose Gold',
  cyberpunk: 'Cyberpunk',
  monochrome: 'Monochrome',
  lavender: 'Lavender Dream',
  emerald: 'Emerald',
  amber: 'Amber Glow',
  crimson: 'Crimson Red',
  slate: 'Slate Gray',
  indigo: 'Indigo Night',
  teal: 'Teal Breeze',
  bronze: 'Bronze Age',
  'west-ham': 'West Ham United',
  arctic: 'Arctic White',
  volcano: 'Volcano Red',
  galaxy: 'Galaxy Purple',
  mint: 'Mint Fresh'
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