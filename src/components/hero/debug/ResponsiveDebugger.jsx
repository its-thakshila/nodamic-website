import { useEffect, useRef } from 'react'
import { useControls, button } from 'leva'

// This component uses Leva to expose live sliders for scale, offsetX, and offsetY.
// It writes these values to the window object so the 3D model can instantly read them in the render loop without triggering React re-renders.
export default function ResponsiveDebugger() {
  const keyframes = useRef([])

  useControls('Responsive Tweaks', () => ({
    enableTweaking: { value: false, label: 'Enable Override', onChange: (v) => window.__DEBUG_ENABLE = v },
    offsetX: { value: 0, min: -0.5, max: 0.5, step: 0.01, onChange: (v) => window.__DEBUG_OFFSET_X = v },
    offsetY: { value: 0, min: -0.5, max: 0.5, step: 0.01, onChange: (v) => window.__DEBUG_OFFSET_Y = v },
    scale: { value: 1, min: 0.1, max: 2, step: 0.01, onChange: (v) => window.__DEBUG_SCALE = v },
    'Add Keyframe': button(() => {
      const frame = {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetX: window.__DEBUG_OFFSET_X || 0,
        offsetY: window.__DEBUG_OFFSET_Y || 0,
        scale: window.__DEBUG_SCALE || 1
      }
      keyframes.current.push(frame)
      console.log('Keyframe added:', frame)
      console.log('All Keyframes:', JSON.stringify(keyframes.current, null, 2))
    }),
    'Export Config': button(() => {
      // Sort and format for easy copy-pasting
      const sorted = [...keyframes.current].sort((a, b) => b.width - a.width)
      const json = JSON.stringify(sorted, null, 2)
      navigator.clipboard.writeText(json).then(() => {
        alert('Keyframes copied to clipboard!\n\n' + json)
      }).catch(err => {
        console.error('Failed to copy', err)
        alert('Could not copy to clipboard. Check console.')
      })
    }),
    'Clear All': button(() => {
      keyframes.current = []
      alert('Keyframes cleared!')
    })
  }))

  // Cleanup globals on unmount
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      delete window.__DEBUG_OFFSET_X
      delete window.__DEBUG_OFFSET_Y
      delete window.__DEBUG_SCALE
    }
  }, [])

  return null
}
