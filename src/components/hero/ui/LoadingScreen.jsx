import { useProgress } from '@react-three/drei'
import { useState, useEffect, useRef, memo } from 'react'

// Short, minimalist "hold on" messages that cycle during loading
const LOADING_MESSAGES = [
  'Setting the stage.',
  'Polishing surfaces.',
  'Calibrating light.',
  'Almost there.',
]

const MESSAGE_INTERVAL_MS = 2000  // how long each message stays
const MESSAGE_FADE_MS = 400       // cross-fade duration between messages

export default memo(function LoadingScreen({ onReady, isModelRendered }) {
  const { progress, active } = useProgress()
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Cycling message state
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const msgTimerRef = useRef(null)

  // Cycle messages on a fixed interval
  useEffect(() => {
    const cycle = () => {
      // Fade out current message
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
        setMsgVisible(true)
      }, MESSAGE_FADE_MS)
    }

    msgTimerRef.current = setInterval(cycle, MESSAGE_INTERVAL_MS)
    return () => clearInterval(msgTimerRef.current)
  }, [])

  // Fade out messages when loading finishes
  useEffect(() => {
    if (fading) {
      setMsgVisible(false)
      clearInterval(msgTimerRef.current)
    }
  }, [fading])

  // Main loading completion logic
  useEffect(() => {
    let isMounted = true

    if (progress === 100 && !active && isModelRendered && !fading && !hidden) {
      document.fonts.ready.then(() => {
        if (!isMounted) return
        onReady()
        setFading(true)
      })
    }

    return () => { isMounted = false }
  }, [progress, active, isModelRendered, fading, hidden, onReady])

  // Remove from DOM after fade completes
  useEffect(() => {
    if (fading) {
      const hideTimer = setTimeout(() => setHidden(true), 600)
      return () => clearTimeout(hideTimer)
    }
  }, [fading])

  if (hidden) return null

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#0a0a0a] transition-opacity duration-500 ease-out pointer-events-none ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Cycling status message */}
      <p
        className="font-outfit text-[0.75rem] tracking-[0.12em] text-white/40 transition-opacity select-none"
        style={{
          opacity: msgVisible ? 1 : 0,
          transition: `opacity ${MESSAGE_FADE_MS}ms ease-in-out`,
        }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-48 h-[1px] bg-white/10 overflow-hidden">
        <div
          className="h-full bg-white/60 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
})
