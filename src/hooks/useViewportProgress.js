import { useState, useEffect } from 'react'

/**
 * Returns fluid progress values based strictly on window innerWidth interpolation.
 * Used to mathematically sync atmospheric CSS layers with the 3D model and viewport geometry.
 */
export function useViewportProgress() {
  const [progress, setProgress] = useState({ mobile: 0, desktop: 0 })

  useEffect(() => {
    const handleResize = () => {
      // mobile: 0.0 at >= 1024px, 1.0 at <= 430px
      const mobile = Math.max(0, Math.min(1, (1024 - window.innerWidth) / (1024 - 430)))
      
      // desktop: 0.0 at >= 1920px, 1.0 at <= 1024px
      const desktop = Math.max(0, Math.min(1, (1920 - window.innerWidth) / (1920 - 1024)))

      setProgress({ mobile, desktop })
    }

    handleResize() // Initialize
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return progress
}
