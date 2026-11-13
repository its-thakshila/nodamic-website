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
function PostCard({ post }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group relative flex flex-col w-full h-full pointer-events-auto
        rounded-2xl overflow-hidden
        bg-white/[0.04]
        hover:bg-white/[0.07]
        transition-all duration-500 ease-out
        hover:-translate-y-1
        cursor-pointer
      "
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Image area: Square ratio (aspect-square) */}
      <div className="relative w-full aspect-square overflow-hidden bg-white/5 shrink-0">
        {post.image ? (
          <img
            src={`${import.meta.env.BASE_URL}${post.image.replace(/^\//, '')}`}
            alt={post.title || 'Story'}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            draggable={false}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/[0.03]" />
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4 flex-1 justify-center">
        <p
          className="
            font-outfit text-white/70 font-[300] leading-[1.3]
            text-[min(clamp(0.85rem,3vw,1rem),1.7svh)]
            sm:text-[0.95rem]
            lg:text-[clamp(0.85rem,1.1vw,1.05rem)]
            line-clamp-3
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

  // On initial load (when slider is active), center the active cards in Set 2 so Post 4 peeks on the left
  useEffect(() => {
    if (canFitAll) return
    const raf = requestAnimationFrame(() => {
      const track = trackRef.current
      if (!track) return
      const firstChild = track.children[0]
      if (!firstChild) return

      const style = window.getComputedStyle(track)
      const gap = parseFloat(style.gap) || 16
      const cardWidth = firstChild.getBoundingClientRect().width
      const step = cardWidth + gap
      const trackWidth = track.clientWidth

      const visibleSpanWidth = visibleCount * cardWidth + (visibleCount - 1) * gap
      const sideMargin = (trackWidth - visibleSpanWidth) / 2
      const targetScroll = (posts.length * step) - sideMargin

      track.scrollTo({ left: targetScroll, behavior: 'instant' })
      currentIndexRef.current = posts.length
    })

    return () => cancelAnimationFrame(raf)
  }, [canFitAll, visibleCount])

  // Circular auto-sliding when total posts exceed visible count
  useEffect(() => {
    if (canFitAll || isPaused) return
    const track = trackRef.current
    if (!track) return

    const interval = setInterval(() => {
      const firstChild = track.children[0]
      if (!firstChild) return

      const style = window.getComputedStyle(track)
      const gap = parseFloat(style.gap) || 16
      const cardWidth = firstChild.getBoundingClientRect().width
      const step = cardWidth + gap
      const trackWidth = track.clientWidth

      const visibleSpanWidth = visibleCount * cardWidth + (visibleCount - 1) * gap
      const sideMargin = (trackWidth - visibleSpanWidth) / 2

      const nextIndex = currentIndexRef.current + 1
      const targetScroll = (nextIndex * step) - sideMargin
      track.scrollTo({ left: targetScroll, behavior: 'smooth' })
      currentIndexRef.current = nextIndex

      // Silent wrap AFTER smooth scroll animation settles (~650ms), when cards are stationary
      setTimeout(() => {
        if (!trackRef.current) return
        if (currentIndexRef.current >= posts.length * 2) {
          const wrapIndex = currentIndexRef.current - posts.length
          const wrapScroll = (wrapIndex * step) - sideMargin
          trackRef.current.scrollTo({ left: wrapScroll, behavior: 'instant' })
          currentIndexRef.current = wrapIndex
        }
      }, 650)
    }, 3500)

    return () => clearInterval(interval)
  }, [canFitAll, isPaused, visibleCount])

  // Track manual scroll / swipe to update currentIndex and seamlessly wrap AFTER scrolling stops
  const handleScroll = useCallback(() => {
    if (canFitAll) return
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
    scrollDebounceRef.current = setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      const firstChild = track.children[0]
      if (!firstChild) return

      const style = window.getComputedStyle(track)
      const gap = parseFloat(style.gap) || 16
      const cardWidth = firstChild.getBoundingClientRect().width
      const step = cardWidth + gap
      const trackWidth = track.clientWidth

      const visibleSpanWidth = visibleCount * cardWidth + (visibleCount - 1) * gap
      const sideMargin = (trackWidth - visibleSpanWidth) / 2

      const scrollLeft = track.scrollLeft
      const nearestIndex = Math.round((scrollLeft + sideMargin) / step)

      if (nearestIndex < posts.length) {
        // Swiped backward into Set 1 -> silently jump to Set 2
        const wrapIndex = nearestIndex + posts.length
        const wrapScroll = (wrapIndex * step) - sideMargin
        track.scrollTo({ left: wrapScroll, behavior: 'instant' })
        currentIndexRef.current = wrapIndex
      } else if (nearestIndex >= posts.length * 2) {
        // Swiped forward into Set 3 -> silently jump to Set 2
        const wrapIndex = nearestIndex - posts.length
        const wrapScroll = (wrapIndex * step) - sideMargin
        track.scrollTo({ left: wrapScroll, behavior: 'instant' })
        currentIndexRef.current = wrapIndex
      } else {
        currentIndexRef.current = nearestIndex
        if (visibleCount > 1) {
          track.scrollTo({ left: (nearestIndex * step) - sideMargin, behavior: 'smooth' })
        }
      }
    }, 150)
  }, [canFitAll, visibleCount])

  const handleTouchStart = () => {
    setIsPaused(true)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
  }

  const handleTouchEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000)
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
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
        className={`w-full flex justify-center ${
          canFitAll ? 'max-w-[1320px] px-6 sm:px-12 md:px-16' : 'px-0 max-w-none'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className={`
            w-full flex flex-row items-stretch
            pb-3
            ${canFitAll
              ? 'justify-center overflow-x-hidden'
              : 'justify-start overflow-x-auto scrollbar-hide'
            }
          `}
          style={{
            gap: `${gapPx}px`,
            scrollSnapType: canFitAll ? 'none' : (visibleCount === 1 ? 'x mandatory' : 'none'),
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayPosts.map((post, i) => (
            <motion.div
              key={`${post.id}-${i}`}
              custom={i}
              variants={cardVariants}
              className="shrink-0 h-full flex flex-col"
              style={{
                width: cardWidthStyle,
                scrollSnapAlign: canFitAll ? 'none' : (visibleCount === 1 ? 'center' : 'none'),
              }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
})
