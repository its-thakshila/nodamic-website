import { memo, useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ANIMATION_TIMING } from '../../../config/hero.config'
import { LinkedInIcon } from './LinkedInIcon'
import { GitHubIcon } from './GitHubIcon'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.duration,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.1, // Fast immediate start without 0.8s empty screen wait
    },
  }),
  exit: (i) => ({
    opacity: 0,
    y: 28,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0],
      delay: i * 0.04, // Smooth cascading reverse exit
    },
  }),
}

const TEAM = [
  {
    name: 'Thakshila Bandara',
    role: 'Founder | Firmware Engineer',
    roleLine1: 'Founder | Firmware',
    roleLine2: 'Engineer',
    photo: `${import.meta.env.BASE_URL}team/thakshila.png`,
    linkedin: 'https://www.linkedin.com/in/its-thakshila/',
    github: 'https://github.com/its-thakshila',
  },
  {
    name: 'Sithum Vitharana',
    role: 'Co-Founder | Electronics Engineer',
    roleLine1: 'Co-Founder | Electronics',
    roleLine2: 'Engineer',
    photo: `${import.meta.env.BASE_URL}team/sithum.png`,
    linkedin: 'https://www.linkedin.com/in/sithum-vitharana/',
    github: 'https://github.com/SSW6421',
  },
  {
    name: 'Anupama Dewpura',
    role: 'Co-Founder | Mechanical Engineer',
    roleLine1: 'Co-Founder | Mechanical',
    roleLine2: 'Engineer',
    photo: `${import.meta.env.BASE_URL}team/anupama.png`,
    linkedin: 'https://www.linkedin.com/in/anupamadewpura/',
    github: 'https://github.com/AnupamaDewpura',
  },
]

/* Shared portrait card — image on top, text below */
function PortraitCard({ member, i, imgHeight, isSlider = false }) {
  const cardContent = (
    <div className="flex flex-col items-center shrink-0 w-full">
      <div className="flex items-end justify-center overflow-hidden" style={{ height: imgHeight }}>
        <img
          src={member.photo}
          alt={member.name}
          className="max-w-full max-h-full object-contain object-bottom"
          draggable={false}
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="mt-2 sm:mt-2.5 text-center flex flex-col items-center">
        <p
          className="font-outfit text-white font-[500] leading-snug"
          style={{
            fontSize: isSlider ? 'min(clamp(1.15rem,5vw,1.35rem),2.8svh)' : 'min(clamp(0.85rem,3.2vw,1.1rem),2.2svh)',
            letterSpacing: '-0.01em',
          }}
        >
          {member.name}
        </p>
        <p
          className="font-outfit text-white/55 font-[300] leading-snug"
          style={{
            fontSize: isSlider ? 'min(clamp(0.78rem,3.4vw,0.92rem),1.8svh)' : 'min(clamp(0.6rem,2.2vw,0.78rem),1.5svh)',
            marginTop: '0.15em',
          }}
        >
          <span className="block whitespace-nowrap">{member.roleLine1}</span>
          <span className="block whitespace-nowrap">{member.roleLine2}</span>
        </p>

        {/* Social Links */}
        <div className={`flex items-center justify-center pointer-events-auto ${isSlider ? 'gap-4 mt-3' : 'gap-3 mt-1.5 sm:mt-2'}`}>
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name}'s LinkedIn profile`}
              className="text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 p-1"
            >
              <LinkedInIcon size={isSlider ? 22 : 18} />
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name}'s GitHub profile`}
              className="text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 p-1"
            >
              <GitHubIcon size={isSlider ? 22 : 18} />
            </a>
          )}
        </div>
      </div>
    </div>
  )

  if (isSlider) {
    return cardContent
  }

  return (
    <motion.div
      key={member.name}
      custom={i + 1}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center shrink-0"
    >
      {cardContent}
    </motion.div>
  )
}

/*
 * TeamScreen
 * Renders the "Who's Behind It" layout for Screen 4.
 * Layout strategy:
 *   - Landscape / desktop: horizontal row of 3 cards
 *   - Portrait mobile  (< 640px): 1 person at a time automatic slider with dots & swipe
 *   - Portrait tablet  (≥ 640px): top row of 2 cards + 1 centered below
 * Everything is vertically centered within the available space below the header.
 */
export default memo(function TeamScreen() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef(null)
  const activeIndexRef = useRef(0)
  const resumeTimerRef = useRef(null)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  const goToSlide = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const width = track.clientWidth
    track.scrollTo({
      left: index * width,
      behavior: 'smooth',
    })
    setActiveIndex(index)
  }, [])

  // Auto-slide effect for mobile view (every 3.5s)
  useEffect(() => {
    if (isPaused) return
    const track = trackRef.current
    if (!track) return

    const interval = setInterval(() => {
      const width = track.clientWidth
      if (!width) return
      const nextIndex = (activeIndexRef.current + 1) % TEAM.length
      track.scrollTo({
        left: nextIndex * width,
        behavior: 'smooth',
      })
      setActiveIndex(nextIndex)
    }, 3500)

    return () => clearInterval(interval)
  }, [isPaused])

  // Track manual scroll / swipe to update indicator dots
  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const width = track.clientWidth
    if (!width) return
    const index = Math.round(track.scrollLeft / width)
    if (index >= 0 && index < TEAM.length && index !== activeIndexRef.current) {
      setActiveIndex(index)
    }
  }, [])

  const handleTouchStart = () => {
    setIsPaused(true)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
  }

  const handleTouchEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return (
    /* justify-center vertically centers the whole group (title + cards) */
    <div className="w-full h-full flex flex-col items-center justify-center select-none pointer-events-none px-0 sm:px-6 gap-0">

      {/* ── Title ── */}
      <motion.h1
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="font-outfit font-[400] text-white text-center leading-[1] shrink-0 px-6
                   text-[min(clamp(2rem,9vw,3.5rem),7svh)]
                   sm:text-[clamp(2.5rem,8vw,4rem)]
                   lg:text-[clamp(4rem,6.5vw,7rem)]
                   mb-[max(1.5svh,0.6rem)] lg:mb-[max(3svh,1.5rem)]"
        style={{ letterSpacing: '-0.035em' }}
      >
        Who's Behind It
      </motion.h1>

      {/* ══════════════════════════════════════════
          LANDSCAPE / DESKTOP — horizontal 3-card row
      ══════════════════════════════════════════ */}
      <div className="hidden landscape:flex flex-row items-end justify-center gap-6 sm:gap-8 lg:gap-16 xl:gap-24 w-full max-w-[1400px] px-4 sm:px-6">
        {TEAM.map((member, i) => (
          <motion.div
            key={member.name}
            custom={i + 1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center flex-1 min-w-0"
          >
            <div className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px] xl:max-w-[380px] overflow-hidden flex items-end justify-center">
              <img src={member.photo} alt={member.name} className="w-full h-auto object-contain object-bottom" draggable={false} loading="eager" decoding="async" />
            </div>
            <div className="mt-3 lg:mt-5 text-center flex flex-col items-center">
              <p className="font-outfit text-white text-[min(clamp(1.05rem,4.5vw,1.2rem),2.5svh)] sm:text-[1.15rem] md:text-[1.25rem] lg:text-[clamp(1.25rem,2vw,1.6rem)] font-[500] leading-snug" style={{ letterSpacing: '-0.01em' }}>
                {member.name}
              </p>
              <p className="font-outfit text-white/55 text-[min(clamp(0.75rem,3.5vw,0.85rem),1.8svh)] sm:text-[0.85rem] md:text-[0.9rem] lg:text-[clamp(0.85rem,1.15vw,1.1rem)] font-[300] leading-snug mt-1">
                <span className="block whitespace-nowrap">{member.roleLine1}</span>
                <span className="block whitespace-nowrap">{member.roleLine2}</span>
              </p>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-4 mt-3.5 pointer-events-auto">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn profile`}
                    className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-1"
                  >
                    <LinkedInIcon size={24} />
                  </a>
                )}
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s GitHub profile`}
                    className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-1"
                  >
                    <GitHubIcon size={24} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          PORTRAIT MOBILE (< 640px) — 1 person at a time auto-slider
          Users can swipe left/right or tap dots; auto-slides every 3.5s
          Edge-to-edge scroll track spans full screen width (no margin clipping)
      ══════════════════════════════════════════ */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="[@media(orientation:portrait)_and_(max-width:639px)]:flex hidden flex-col items-center w-full pointer-events-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Swipe/Scroll Track spanning full screen width */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="w-full flex flex-row overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {TEAM.map((member, i) => (
            <div
              key={member.name}
              className="w-full shrink-0 snap-center flex flex-col items-center px-4"
            >
              <div className="w-full max-w-[320px] flex flex-col items-center">
                <PortraitCard
                  member={member}
                  i={i}
                  imgHeight="min(36svh, 65vw)"
                  isSlider={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-3.5 pointer-events-auto">
          {TEAM.map((member, i) => (
            <button
              key={member.name}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Show ${member.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i
                ? 'w-6 bg-white'
                : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
            />
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          PORTRAIT TABLET (≥ 640px) — 2-on-top + 1 centered below
      ══════════════════════════════════════════ */}
      <div className="[@media(orientation:portrait)_and_(min-width:640px)]:flex hidden flex-col items-center gap-[clamp(0.75rem,2.2svh,1.75rem)] w-full px-4 sm:px-6">
        {/* Row 1: first two people */}
        <div className="flex flex-row justify-center gap-[clamp(1.5rem,6vw,3rem)]">
          <PortraitCard member={TEAM[0]} i={0} imgHeight="min(20svh, 28vw)" />
          <PortraitCard member={TEAM[1]} i={1} imgHeight="min(20svh, 28vw)" />
        </div>
        {/* Row 2: third person centered */}
        <PortraitCard member={TEAM[2]} i={2} imgHeight="min(20svh, 28vw)" />
      </div>

    </div>
  )
})
