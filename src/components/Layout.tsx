import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Palette, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, themeDisplayNames, type Theme } from '@/hooks/useTheme'

const navigationItems = [
  { name: 'Home', href: '/' },
  { name: 'Nostradouglas', href: '/nostradouglas' },
  { name: 'Fantasy SRA', href: '/fantasy-sra' },
  { name: 'Pick Deez', href: '/pick-deez' },
  { name: 'Predictions', href: '/community' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const themeDropdownRef = useRef<HTMLDivElement>(null)

  const allThemes = Object.keys(themeDisplayNames) as Theme[]

  // Close theme dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-semibold text-foreground">
                Coach Jeffries Academy
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Dropdown */}
              <div ref={themeDropdownRef} className="relative">
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="flex items-center space-x-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Change theme"
                >
                  <Palette className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
                
                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-50"
                    >
                      <div className="py-1 max-h-80 overflow-y-auto">
                        {allThemes.map((themeName) => (
                          <button
                            key={themeName}
                            onClick={() => {
                              setTheme(themeName)
                              setIsThemeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              theme === themeName
                                ? 'bg-primary text-primary-foreground'
                                : 'text-card-foreground hover:bg-secondary hover:text-secondary-foreground'
                            }`}
                          >
                            {themeDisplayNames[themeName]}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-background">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="pt-4 border-t border-border mt-4 space-y-2">
                  {/* Mobile Theme Section */}
                  <div className="px-3 py-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Theme</div>
                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                      {allThemes.map((themeName) => (
                        <button
                          key={themeName}
                          onClick={() => {
                            setTheme(themeName)
                            setIsMobileMenuOpen(false)
                          }}
                          className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                            theme === themeName
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          {themeDisplayNames[themeName]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {user ? (
                    <>
                      <div className="flex items-center px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-primary-foreground">
                            {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {user.user_metadata?.full_name || user.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          signOut()
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="block px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}