import { useState, useEffect } from 'react'
import { BREAKPOINTS } from '../config/hero.config'

/**
 * Returns fluid progress values based strictly on window innerWidth interpolation.
 * Used to mathematically sync atmospheric CSS layers with the 3D model and viewport geometry.
 *
 * mobile:  0.0 at >= BREAKPOINTS.lg (1024px),  1.0 at <= BREAKPOINTS.xs (480px)
 * desktop: 0.0 at >= BREAKPOINTS['3xl'] (1920px), 1.0 at <= BREAKPOINTS.lg (1024px)
 */
export function useViewportProgress() {
  const [progress, setProgress] = useState({ mobile: 0, desktop: 0 })

  useEffect(() => {
    const handleResize = () => {
      // mobile: 0.0 at >= 1024px, 1.0 at <= 480px
      const mobile = Math.max(0, Math.min(1, (BREAKPOINTS.lg - window.innerWidth) / (BREAKPOINTS.lg - BREAKPOINTS.xs)))

      // desktop: 0.0 at >= 1920px, 1.0 at <= 1024px
      const desktop = Math.max(0, Math.min(1, (BREAKPOINTS['3xl'] - window.innerWidth) / (BREAKPOINTS['3xl'] - BREAKPOINTS.lg)))

      setProgress({ mobile, desktop })
    }

    handleResize() // Initialize
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return progress
}
