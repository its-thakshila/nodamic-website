import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const ScrollContext = createContext()

export function useScrollState() {
  return useContext(ScrollContext)
}

export function ScrollProvider({ children, totalScreens = 2 }) {
  const [activeScreen, setActiveScreen] = useState(0)
  const activeScreenRef = useRef(0)
  
  useEffect(() => {
    activeScreenRef.current = activeScreen
  }, [activeScreen])

  useEffect(() => {
    let lastTime = 0
    let currentDebounce = 800
    let touchStartY = 0

    const processScroll = (direction) => {
      const now = Date.now()
      if (now - lastTime < currentDebounce) return
      
      const current = activeScreenRef.current
      let next = current
      
      if (direction === 'down' && current < totalScreens - 1) next = current + 1
      if (direction === 'up' && current > 0) next = current - 1
      
      if (next !== current) {
        // Lock scrolling for the exact duration of the transition animation
        if ((current === 1 && next === 2) || (current === 2 && next === 1)) {
          currentDebounce = 2000 // Wait for the full 360 spin
        } else {
          currentDebounce = 1000 // Standard snappy transition lock
        }
        
        setActiveScreen(next)
        lastTime = now
      }
    }

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 20) { // threshold to ignore tiny trackpad jitters
        processScroll(e.deltaY > 0 ? 'down' : 'up')
      }
    }

    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const onTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY
      const diff = touchStartY - touchEndY
      
      if (Math.abs(diff) > 50) { // Swipe threshold
        processScroll(diff > 0 ? 'down' : 'up')
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [totalScreens])

  return (
    <ScrollContext.Provider value={{ activeScreen, setActiveScreen }}>
      {children}
    </ScrollContext.Provider>
  )
}
