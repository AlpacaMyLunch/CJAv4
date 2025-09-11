interface LogoProps {
  className?: string
  alt?: string
}

export function Logo({ className = "", alt = "Coach Jeffries Academy" }: LogoProps) {
  // Use light logo for all themes for now
  const logoSrc = '/logo-light.png'
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      className={`h-8 w-auto ${className}`}
    />
  )
}