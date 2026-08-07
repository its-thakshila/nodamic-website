import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ScrollContext = createContext()

export function useScrollState() {
  return useContext(ScrollContext)
}

export function ScrollProvider({ children, totalScreens = 2 }) {
  const [activeScreen, setActiveScreen] = useState(0)
  
  const handleScroll = useCallback((direction) => {
    setActiveScreen((prev) => {
      if (direction === 'down' && prev < totalScreens - 1) return prev + 1
      if (direction === 'up' && prev > 0) return prev - 1
      return prev
    })
  }, [totalScreens])

  useEffect(() => {
    let lastTime = 0
    let touchStartY = 0

    const onWheel = (e) => {
      const now = Date.now()
      if (now - lastTime < 800) return // 800ms debounce for smooth cinematic transitions
      
      if (Math.abs(e.deltaY) > 20) { // threshold to ignore tiny trackpad jitters
        handleScroll(e.deltaY > 0 ? 'down' : 'up')
        lastTime = now
      }
    }

    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const onTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY
      const diff = touchStartY - touchEndY
      
      const now = Date.now()
      if (now - lastTime < 800) return // debounce
      
      if (Math.abs(diff) > 50) { // Swipe threshold
        handleScroll(diff > 0 ? 'down' : 'up')
        lastTime = now
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
  }, [handleScroll])

  return (
    <ScrollContext.Provider value={{ activeScreen, setActiveScreen }}>
      {children}
    </ScrollContext.Provider>
  )
}
