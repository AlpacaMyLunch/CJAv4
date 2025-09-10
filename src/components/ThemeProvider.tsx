import { useEffect, useState } from 'react'
import { ThemeProviderContext, type Theme } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove(
      'light', 'dark', 'midnight', 'ocean', 'forest', 'sunset', 'rose',
      'cyberpunk', 'monochrome', 'lavender', 'emerald', 'amber', 'crimson',
      'slate', 'indigo', 'teal', 'bronze', 'west-ham', 'arctic', 'volcano',
      'galaxy', 'mint'
    )
    
    // Add current theme class (dark theme doesn't need a class as it's the default)
    if (theme !== 'dark') {
      root.classList.add(theme)
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}