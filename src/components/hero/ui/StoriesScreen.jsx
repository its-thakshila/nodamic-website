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
      <div className="flex flex-col px-4 pt-4 pb-5 flex-1 justify-center">
        <p
          className="
            font-outfit text-white/70 font-[300] leading-[1.3]
            text-[min(clamp(0.95rem,4vw,1.1rem),1.9svh)]
            sm:text-[1.05rem]
            md:text-[1.15rem]
            lg:text-[clamp(0.95rem,1.3vw,1.25rem)]
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
  const [visibleCount, setVisibleCount] = useState(4)
  const [isPaused, setIsPaused] = useState(false)
  const scrollState = useScrollState()
  const isScrollingUp = scrollState?.direction === 'up'
  const { fadeUp, cardVariants } = getVariants(isScrollingUp)

  // Dynamically calculate visible cards depending on viewport width
  const updateLayout = useCallback(() => {
    const width = window.innerWidth
    if (width < 640) {
      setVisibleCount(1)
    } else if (width < 1024) {
      setVisibleCount(2)
    } else if (width < 1280) {
      setVisibleCount(3)
    } else {
      setVisibleCount(4)
    }
  }, [])

  useEffect(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [updateLayout])

  const canFitAll = posts.length <= visibleCount

  // Circular auto-sliding when total posts exceed visible count on current screen
  useEffect(() => {
    if (canFitAll || isPaused) return
    const track = trackRef.current
    if (!track) return

    const interval = setInterval(() => {
      const firstChild = track.children[0]
      if (!firstChild) return

      const style = window.getComputedStyle(track)
      const gap = parseFloat(style.gap) || 16
      const step = firstChild.getBoundingClientRect().width + gap

      const maxScroll = track.scrollWidth - track.clientWidth
      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        track.scrollBy({ left: step, behavior: 'smooth' })
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [canFitAll, isPaused])

  // Duplicated list for continuous circular wrapping when scrolling is active
  const displayPosts = canFitAll ? posts : [...posts, ...posts, ...posts]

  // Dynamic gap based on screen size (16px on mobile/tablet, 24px on desktop)
  const gapPx = visibleCount >= 3 ? 24 : 16

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
      <div className="flex flex-col items-center text-center px-6 shrink-0 mb-[max(5svh,2.5rem)] lg:mb-[max(7svh,4rem)]">
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

      {/* ── Dynamic Card Container / Circular Slider ── */}
      <div
        className="w-full max-w-[1560px] px-4 sm:px-6 lg:px-8 xl:px-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
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
            scrollSnapType: canFitAll ? 'none' : 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayPosts.map((post, i) => (
            <motion.div
              key={`${post.id}-${i}`}
              custom={i}
              variants={cardVariants}
              className="shrink-0 h-full"
              style={{
                width: `calc((100% - ${(visibleCount - 1) * gapPx}px) / ${visibleCount})`,
                scrollSnapAlign: canFitAll ? 'none' : 'start',
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
