import { memo, useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ANIMATION_TIMING } from '../../../config/hero.config'
import { useScrollState } from '../ScrollContext'
import posts from '../../../data/stories.json'

/* ─── Animation Variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {},
  exit: {},
}

const getVariants = (isScrollingUp) => {
  // When scrolling UP (from Who's Behind It -> Our Stories), enter immediately (0s delay)
  // When scrolling DOWN (from Node 1 -> Our Stories), keep the deliberate cinematic delay (0.8s)
  const entryDelay = isScrollingUp ? 0 : ANIMATION_TIMING.textDelay
  const cardEntryBaseDelay = isScrollingUp ? 0.05 : ANIMATION_TIMING.textDelay + 0.15

  return {
    fadeUp: {
      hidden: { opacity: 0, y: 32 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: ANIMATION_TIMING.duration, // Restored exact original animation duration
          ease: [0.16, 1, 0.3, 1],
          delay: entryDelay,
        },
      },
      exit: {
        opacity: 0,
        y: 32,
        transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
      },
    },
    cardVariants: {
      hidden: { opacity: 0, y: 40 },
      visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: ANIMATION_TIMING.duration, // Restored exact original animation duration
          ease: [0.16, 1, 0.3, 1],
          delay: cardEntryBaseDelay + (i % posts.length) * 0.1,
        },
      }),
      exit: (i) => ({
        opacity: 0,
        y: 40,
        transition: {
          duration: 0.3,
          ease: [0.7, 0, 0.84, 0],
          delay: (i % posts.length) * 0.04,
        },
      }),
    },
  }
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({ post, isDraggingRef }) {
  const handleClick = (e) => {
    // If the user swiped to slide the cards, prevent following the link
    if (isDraggingRef?.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      onClick={handleClick}
      className="
        group relative flex flex-col w-full h-full pointer-events-auto select-none
        rounded-2xl overflow-hidden
        border border-white/[0.07] hover:border-white/[0.18]
        bg-white/[0.035] hover:bg-white/[0.065]
        hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.8),0_0_24px_-4px_rgba(255,255,255,0.05)]
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        cursor-pointer
      "
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'pan-x',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Image area: Square ratio (aspect-square) */}
      <div className="relative w-full aspect-square overflow-hidden bg-white/5 shrink-0">
        {post.image ? (
          <>
            <img
              src={`${import.meta.env.BASE_URL}${post.image.replace(/^\//, '')}`}
              alt={post.title || 'Story'}
              className="w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025] group-hover:brightness-[1.04]"
              draggable={false}
              loading="eager"
              decoding="async"
            />
            {/* Subtle soft gradient transition to card body */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/[0.03]" />
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4 flex-1 justify-center">
        <p
          className="
            font-outfit text-white/70 group-hover:text-white/95 font-[300] leading-[1.3]
            text-[min(clamp(0.85rem,3vw,1rem),1.7svh)]
            sm:text-[0.95rem]
            lg:text-[clamp(0.85rem,1.1vw,1.05rem)]
            line-clamp-3
            transition-colors duration-400 ease-out
          "
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt?.replace(/\.{3,}$/, '')}
        </p>
      </div>
    </a>
  )
}

/* ─── StoriesScreen ──────────────────────────────────────────────────────── */
/*
 * Renders the "Our Stories" layout.
 * Number of visible cards dynamically matches the device width:
 *   - Mobile (< 640px): 1 card visible
 *   - Tablet (640px - 1023px): 2 cards visible
 *   - Small Laptop / Desktop (1024px - 1279px): 3 cards visible
 *   - Large Desktop (>= 1280px): 4 cards visible
 * Smooth entrance animation (cardVariants stagger fadeUp) restored.
 */
export default memo(function StoriesScreen({ bodyParagraph }) {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(posts.length)
  const [canFitAll, setCanFitAll] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const scrollState = useScrollState()
  const isScrollingUp = scrollState?.direction === 'up'
  const { fadeUp, cardVariants } = getVariants(isScrollingUp)

  // Dynamically calculate whether all posts fit inside standard page margins,
  // triggering the slider ONLY when cards actually reach the margin boundaries / overflow.
  const updateLayout = useCallback(() => {
    const width = window.innerWidth
    // Page margins from OverlayUI: 48px on mobile (<640), 96px on sm (<768), 128px on md+
    const marginPx = width < 640 ? 48 : width < 768 ? 96 : 128
    const maxContentWidth = Math.min(width - marginPx, 1320 - marginPx)

    // Minimum comfortable card width before it feels squeezed
    const minCardWidth = 230
    const gap = width < 768 ? 16 : 20

    // Width required to display all available posts comfortably within page margins
    const requiredWidthForAll = posts.length * minCardWidth + (posts.length - 1) * gap

    if (maxContentWidth >= requiredWidthForAll) {
      // All posts fit within standard margins without touching page edges!
      setVisibleCount(posts.length)
      setCanFitAll(true)
    } else {
      // Posts overflow! Activate slider and determine how many cards fit centered
      setCanFitAll(false)
      if (width < 640) {
        setVisibleCount(1)
      } else if (width < 890) {
        setVisibleCount(2)
      } else if (width < 1180) {
        setVisibleCount(3)
      } else {
        const count = Math.max(1, Math.floor((width - 120) / (minCardWidth + gap)))
        setVisibleCount(Math.min(count, posts.length - 1))
      }
    }
  }, [])

  useEffect(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [updateLayout])
  const currentIndexRef = useRef(posts.length)
  const resumeTimerRef = useRef(null)

  // Duplicated list (3 sets) for seamless infinite circular wrapping
  const displayPosts = canFitAll ? posts : [...posts, ...posts, ...posts]

  // Dynamic gap based on screen size (16px on mobile/tablet, 20px on desktop)
  const gapPx = visibleCount >= 3 ? 20 : 16

  // Responsive card width bounded by BOTH horizontal space AND vertical viewport height.
  // When cards overflow (!canFitAll):
  // - visibleCount active cards fit in center, with symmetric peeks on left and right edge
  // - Vertical height is capped with calc(48svh - padding) to ensure square images scale down smoothly on short screens without bottom clipping!
  const cardWidthStyle = canFitAll
    ? `min(295px, calc((100% - ${(visibleCount - 1) * gapPx}px) / ${visibleCount}), calc(48svh - 4.8rem))`
    : visibleCount === 1
      ? 'min(clamp(240px, calc(100vw - 4.5rem), 335px), calc(48svh - 4.5rem))'
      : visibleCount === 2
        ? 'min(clamp(260px, calc((100vw - 7.5rem) / 2), 340px), calc(48svh - 4.5rem))'
        : visibleCount === 3
          ? 'min(clamp(250px, calc((100vw - 11rem) / 3), 320px), calc(48svh - 4.8rem))'
          : `min(clamp(240px, calc((100vw - 14rem) / ${visibleCount}), 300px), calc(48svh - 4.8rem))`

  const scrollDebounceRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const wrapTimerRef = useRef(null)

  // Pixel-perfect target scroll calculation using actual card offsetLeft
  const getTargetScroll = useCallback((idx) => {
    const track = trackRef.current
    if (!track) return 0
    const card = track.children[idx]
    if (!card) return 0

    const style = window.getComputedStyle(track)
    const gap = parseFloat(style.gap) || 16
    const cardWidth = card.getBoundingClientRect().width
    const visibleSpanWidth = visibleCount * cardWidth + (visibleCount - 1) * gap
    const sideMargin = (track.clientWidth - visibleSpanWidth) / 2

    return card.offsetLeft - sideMargin
  }, [visibleCount])

  // On initial load (when slider is active), center the active cards in Set 2 so Post 4 peeks on the left
  useEffect(() => {
    if (canFitAll) return
    const raf = requestAnimationFrame(() => {
      const track = trackRef.current
      if (!track) return
      track.scrollTo({ left: getTargetScroll(posts.length), behavior: 'instant' })
      currentIndexRef.current = posts.length
    })

    return () => cancelAnimationFrame(raf)
  }, [canFitAll, visibleCount, getTargetScroll])

  // Circular auto-sliding when total posts exceed visible count
  useEffect(() => {
    if (canFitAll || isPaused) return
    const track = trackRef.current
    if (!track) return

    const interval = setInterval(() => {
      if (isAnimatingRef.current) return
      const nextIndex = currentIndexRef.current + 1

      isAnimatingRef.current = true
      track.scrollTo({ left: getTargetScroll(nextIndex), behavior: 'smooth' })
      currentIndexRef.current = nextIndex

      if (wrapTimerRef.current) clearTimeout(wrapTimerRef.current)
      wrapTimerRef.current = setTimeout(() => {
        if (!trackRef.current) return
        if (currentIndexRef.current >= posts.length * 2) {
          const wrapIndex = currentIndexRef.current - posts.length
          trackRef.current.scrollTo({ left: getTargetScroll(wrapIndex), behavior: 'instant' })
          currentIndexRef.current = wrapIndex
        }
        isAnimatingRef.current = false
      }, 550)
    }, 3500)

    return () => clearInterval(interval)
  }, [canFitAll, isPaused, visibleCount, getTargetScroll])

  // Track manual trackpad/desktop scroll to silently wrap AFTER scrolling stops
  const handleScroll = useCallback(() => {
    if (canFitAll || isAnimatingRef.current) return
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
    scrollDebounceRef.current = setTimeout(() => {
      if (isAnimatingRef.current) return
      const track = trackRef.current
      if (!track || !track.children[0]) return

      const style = window.getComputedStyle(track)
      const gap = parseFloat(style.gap) || 16
      const cardWidth = track.children[0].getBoundingClientRect().width
      const step = cardWidth + gap
      const trackWidth = track.clientWidth

      const visibleSpanWidth = visibleCount * cardWidth + (visibleCount - 1) * gap
      const sideMargin = (trackWidth - visibleSpanWidth) / 2

      const scrollLeft = track.scrollLeft
      const nearestIndex = Math.round((scrollLeft + sideMargin) / step)

      if (nearestIndex < posts.length) {
        const wrapIndex = nearestIndex + posts.length
        track.scrollTo({ left: getTargetScroll(wrapIndex), behavior: 'instant' })
        currentIndexRef.current = wrapIndex
      } else if (nearestIndex >= posts.length * 2) {
        const wrapIndex = nearestIndex - posts.length
        track.scrollTo({ left: getTargetScroll(wrapIndex), behavior: 'instant' })
        currentIndexRef.current = wrapIndex
      } else {
        currentIndexRef.current = nearestIndex
        if (visibleCount > 1) {
          track.scrollTo({ left: getTargetScroll(nearestIndex), behavior: 'smooth' })
        }
      }
    }, 250)
  }, [canFitAll, visibleCount, getTargetScroll])

  const touchStartPos = useRef({ x: 0, y: 0, time: 0 })
  const isDraggingRef = useRef(false)
  const isSwipingTouchRef = useRef(false)

  const handleTouchStart = (e) => {
    setIsPaused(true)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    if (wrapTimerRef.current) clearTimeout(wrapTimerRef.current)

    // Settle any pending wrap instantly before new touch interaction begins
    const track = trackRef.current
    if (track) {
      if (currentIndexRef.current >= posts.length * 2) {
        const normalizedIndex = currentIndexRef.current - posts.length
        track.scrollTo({ left: getTargetScroll(normalizedIndex), behavior: 'instant' })
        currentIndexRef.current = normalizedIndex
      } else if (currentIndexRef.current < posts.length) {
        const normalizedIndex = currentIndexRef.current + posts.length
        track.scrollTo({ left: getTargetScroll(normalizedIndex), behavior: 'instant' })
        currentIndexRef.current = normalizedIndex
      }
    }
    isAnimatingRef.current = false

    if (e.touches && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
    isDraggingRef.current = false
    isSwipingTouchRef.current = false
  }

  const handleTouchMove = (e) => {
    if (!e.touches || !e.touches[0]) return
    const dx = e.touches[0].clientX - touchStartPos.current.x
    const dy = e.touches[0].clientY - touchStartPos.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      isDraggingRef.current = true
    }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwipingTouchRef.current = true
    }
  }

  const handleTouchEnd = (e) => {
    if (canFitAll) {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000)
      setTimeout(() => { isDraggingRef.current = false }, 100)
      return
    }

    const touch = e.changedTouches ? e.changedTouches[0] : null
    const track = trackRef.current

    if (touch && isSwipingTouchRef.current && track) {
      const dx = touch.clientX - touchStartPos.current.x
      const dt = Date.now() - touchStartPos.current.time
      const velocity = Math.abs(dx) / (dt || 1)

      // If swiped left by > 25px or flicked -> slide forward
      // If swiped right by > 25px or flicked -> slide backward
      let targetIndex = currentIndexRef.current
      if (dx < -25 || (dx < -15 && velocity > 0.25)) {
        targetIndex = currentIndexRef.current + 1
      } else if (dx > 25 || (dx > 15 && velocity > 0.25)) {
        targetIndex = currentIndexRef.current - 1
      }

      isAnimatingRef.current = true
      track.scrollTo({ left: getTargetScroll(targetIndex), behavior: 'smooth' })
      currentIndexRef.current = targetIndex

      // Silent wrap AFTER smooth scroll animation settles (~550ms), when cards are stationary
      if (wrapTimerRef.current) clearTimeout(wrapTimerRef.current)
      wrapTimerRef.current = setTimeout(() => {
        if (!trackRef.current) return
        if (currentIndexRef.current >= posts.length * 2) {
          const wrapIndex = currentIndexRef.current - posts.length
          trackRef.current.scrollTo({ left: getTargetScroll(wrapIndex), behavior: 'instant' })
          currentIndexRef.current = wrapIndex
        } else if (currentIndexRef.current < posts.length) {
          const wrapIndex = currentIndexRef.current + posts.length
          trackRef.current.scrollTo({ left: getTargetScroll(wrapIndex), behavior: 'instant' })
          currentIndexRef.current = wrapIndex
        }
        isAnimatingRef.current = false
      }, 550)
    }

    // Keep dragging flag for 150ms so onClick on <a> does not fire when swiping
    setTimeout(() => {
      isDraggingRef.current = false
      isSwipingTouchRef.current = false
    }, 150)

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000)
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
      if (wrapTimerRef.current) clearTimeout(wrapTimerRef.current)
    }
  }, [])

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── Title & Body Paragraph Block ── */}
      <div className="flex flex-col items-center text-center px-6 sm:px-12 md:px-16 shrink-0 mb-[clamp(1rem,3svh,2rem)] lg:mb-[clamp(1.5rem,4svh,2.5rem)]">
        <motion.h1
          variants={fadeUp}
          className="
            font-outfit font-[400] text-white leading-[1] pointer-events-none
            text-[min(clamp(2rem,9vw,3.5rem),7svh)]
            sm:text-[clamp(2.5rem,8vw,4rem)]
            lg:text-[clamp(4rem,6.5vw,7rem)]
            mb-[max(1.5svh,0.6rem)]
          "
          style={{ letterSpacing: '-0.035em' }}
        >
          Our Stories
        </motion.h1>

        {bodyParagraph && (
          <motion.p
            variants={fadeUp}
            className="
              font-outfit
              text-[min(clamp(1rem,5.6vw,1.2rem),2.4svh)]
              sm:text-[1.15rem]
              md:text-[1.3rem]
              lg:text-[clamp(1.25rem,2.0vw,1.9rem)]
              font-light
              leading-[1.25] lg:leading-[1.15]
              text-white/70 lg:text-white/80
              pointer-events-none
              text-center
              max-w-[900px]
            "
            style={{ letterSpacing: '0.001em' }}
          >
            {typeof bodyParagraph === 'object' ? (
              <>
                <span className="hidden lg:inline">{bodyParagraph.desktop}</span>
                <span className="hidden sm:inline lg:hidden">{bodyParagraph.tablet}</span>
                <span className="sm:hidden">{bodyParagraph.mobile}</span>
              </>
            ) : (
              bodyParagraph
            )}
          </motion.p>
        )}
      </div>

      {/* ── Dynamic Card Container / Circular Slider (edge-to-edge when overflowing) ── */}
      <div
        className={`w-full flex justify-center pointer-events-auto touch-pan-x select-none ${
          canFitAll ? 'max-w-[1320px] px-6 sm:px-12 md:px-16' : 'px-0 max-w-none'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className={`
            relative w-full flex flex-row items-stretch pointer-events-auto touch-pan-x select-none
            pb-3
            ${canFitAll
              ? 'justify-center overflow-x-hidden'
              : 'justify-start overflow-x-auto scrollbar-hide'
            }
          `}
          style={{
            gap: `${gapPx}px`,
            scrollSnapType: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: canFitAll ? 'auto' : 'pan-x',
          }}
        >
          {displayPosts.map((post, i) => (
            <motion.div
              key={`${post.id}-${i}`}
              custom={i}
              variants={cardVariants}
              className="shrink-0 h-full flex flex-col pointer-events-auto select-none"
              style={{
                width: cardWidthStyle,
              }}
            >
              <PostCard post={post} isDraggingRef={isDraggingRef} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
})
