import { useTheme } from '@/hooks/useTheme'

interface LogoProps {
  className?: string
  alt?: string
}

export function Logo({ className = "", alt = "Coach Jeffries Academy" }: LogoProps) {
  const { theme } = useTheme()
  
  // Use dark logo for dark theme, light logo for all other themes
  // const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'
  const logoSrc = '/logo-light.png'
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      className={`h-8 w-auto ${className}`}
    />
  )
}