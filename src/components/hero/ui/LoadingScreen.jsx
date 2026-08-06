import { useProgress } from '@react-three/drei'
import { useState, useEffect } from 'react'

export default function LoadingScreen({ onNearFinish }) {
  const { progress } = useProgress()
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // When everything is loaded (progress reaches 100)
    if (progress === 100 && !fading && !hidden) {
      // Trigger animations immediately so their 450ms internal delay begins counting down
      onNearFinish()

      // Delay the fade out slightly so the animations have time to start moving
      // before the overlay completely disappears.
      const startFadeTimer = setTimeout(() => {
        setFading(true)
        
        // Remove from DOM after the quick 500ms fade out completes
        const hideTimer = setTimeout(() => {
          setHidden(true)
        }, 500)

        return () => {
          clearTimeout(hideTimer)
        }
      }, 250)

      return () => clearTimeout(startFadeTimer)
    }
  }, [progress, fading, hidden, onNearFinish])

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
}
