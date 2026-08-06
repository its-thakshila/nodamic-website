import { useProgress } from '@react-three/drei'
import { useState, useEffect, memo } from 'react'

export default memo(function LoadingScreen({ onReady }) {
  const { progress, active } = useProgress()
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    // When everything is loaded (progress reaches 100 AND the Drei loading manager queue is fully empty)
    if (progress === 100 && !active && !fading && !hidden) {
      // Additionally ensure all standard DOM WebFonts are fully downloaded and rendered
      document.fonts.ready.then(() => {
        if (!isMounted) return;
        
        // Trigger all 3D and UI animations simultaneously at the exact moment the loading screen begins its fade-out
        onReady()
        setFading(true)
      })
    }
    
    return () => { isMounted = false }
  }, [progress, active, fading, hidden, onReady])

  useEffect(() => {
    if (fading) {
      // Remove from DOM strictly after the 500ms CSS fade out completes
      const hideTimer = setTimeout(() => {
        setHidden(true)
      }, 500)
      return () => clearTimeout(hideTimer)
    }
  }, [fading])

  if (hidden) return null

  return (
    <div
      className={`absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-500 ease-out pointer-events-none ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-48 h-[2px] bg-white/20 overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  )
})
