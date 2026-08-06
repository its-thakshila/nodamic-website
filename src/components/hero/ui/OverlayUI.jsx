import { useRef } from 'react'
import { motion } from 'framer-motion'
import { SquareChevronDownIcon } from './SquareChevronDownIcon'
import Header from './Header'
import { UI_CONTENT, LAYER_Z_INDEX, ANIMATION_TIMING } from '../../../config/hero.config'

/* ─── Animation Variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {},
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { 
      duration: ANIMATION_TIMING.duration - (i * 0.15), 
      ease: [0.16, 1, 0.3, 1],
      delay: ANIMATION_TIMING.introDelay + (i * 0.15)
    },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      duration: ANIMATION_TIMING.duration - 0.3, 
      ease: 'easeOut',
      delay: ANIMATION_TIMING.introDelay + 0.3
    },
  },
}

/*
 * Layer 6 (z-60): OverlayUI
 * Contains all interactive architecture: Logo, Navigation (Header), Hero title,
 * Paragraph, Labels, CTA button, and Scroll discovery badge.
 */
export default function OverlayUI({ isLoaded = false }) {
  const iconRef = useRef(null)

  return (
    <div
      className="absolute inset-0 w-full h-full px-6 py-6 sm:px-12 sm:py-10 md:px-16 md:py-12 grid grid-cols-12 grid-rows-[auto_1fr_auto] pointer-events-none select-none"
      style={{ zIndex: LAYER_Z_INDEX.overlayUI }}
    >
      {/* Row 1: Logo & Navigation Bar (Interactive) */}
      <div className="col-span-12 row-start-1 pointer-events-auto">
        <Header isLoaded={isLoaded} />
      </div>

      {/* Row 3: Bottom 12-column layout — Typography (Left 7 cols) & Paragraph (Right 4 cols) */}
      <div className="col-span-12 row-start-3 grid grid-cols-12 items-end gap-x-6 lg:gap-x-12 pb-8 md:pb-16 lg:pb-20">
        {/* Bottom-left: Main hardware title */}
        <motion.div
          className="col-span-12 lg:col-span-7 self-end relative"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          <motion.h1
            custom={0}
            variants={fadeUp}
            className="font-outfit text-[clamp(3.6rem,9.5vw,8.6rem)] font-[400] leading-[0.88] text-white relative z-10"
            style={{ letterSpacing: '-0.035em' }}
          >
            {UI_CONTENT.headingTitle}<br />
            {UI_CONTENT.headingSubtitle}
          </motion.h1>

          <motion.div custom={1} variants={fadeUp} className="absolute -bottom-12 md:-bottom-14 left-0 z-20">
            <button
              id="scroll-discover-btn"
              className="flex items-center gap-3 pointer-events-auto bg-transparent w-auto h-auto text-white/90 hover:text-white transition-colors duration-300 font-outfit uppercase tracking-[0.18em] text-[0.95rem] md:text-[1.05rem]"
              onMouseEnter={() => iconRef.current?.startAnimation?.()}
              onMouseLeave={() => iconRef.current?.stopAnimation?.()}
            >
              <SquareChevronDownIcon ref={iconRef} size={20} className="-translate-y-[-1.2px]" />
              <span>{UI_CONTENT.ctaButtonText}</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Bottom-right: Paragraph (max-width 32rem) */}
        <motion.div
          className="hidden sm:flex sm:col-span-5 sm:col-start-8 lg:col-span-5 lg:col-start-8 self-end flex-col items-end justify-end max-w-[32rem] mb-1 lg:mb-2 sm:justify-self-end"
          variants={fadeIn}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          <p
            className="font-grotesk text-2xl md:text-[1.75rem] font-extralight leading-[1.35] text-white/80 text-right"
            style={{ letterSpacing: '0.01em', maxWidth: '32rem' }}
          >
            {UI_CONTENT.bodyParagraph}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
