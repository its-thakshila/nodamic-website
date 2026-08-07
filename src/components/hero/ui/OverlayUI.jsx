import { useRef, memo } from 'react'
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
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.duration,
      ease: [0.16, 1, 0.3, 1],
      delay: ANIMATION_TIMING.textDelay
    },
  },
}

const fadeUpCTA = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.duration,
      ease: [0.16, 1, 0.3, 1],
      delay: ANIMATION_TIMING.ctaDelay
    },
  },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_TIMING.duration,
      ease: 'easeOut',
      delay: ANIMATION_TIMING.textDelay
    },
  },
}

/*
 * Layer 6 (z-60): OverlayUI
 * Contains all interactive architecture: Logo, Navigation (Header), Hero title,
 * Paragraph, Labels, CTA button, and Scroll discovery badge.
 */
export default memo(function OverlayUI({ isLoaded = false }) {
  const iconRef = useRef(null)

  return (
    <div
      className="absolute inset-0 w-full h-full px-6 sm:px-12 md:px-16 flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] pointer-events-none select-none pt-[max(clamp(16px,4vh,40px),env(safe-area-inset-top))] pb-[max(clamp(20px,4vh,48px),env(safe-area-inset-bottom))] lg:pt-12 lg:pb-12"
      style={{ zIndex: LAYER_Z_INDEX.overlayUI }}
    >
      {/* Row 1: Logo & Navigation Bar (Interactive) */}
      <div className="lg:col-span-12 lg:row-start-1 pointer-events-auto shrink-0 z-50">
        <Header isLoaded={isLoaded} />
      </div>

      {/* Row 3: Bottom layout / Mobile Hero Composition */}
      <div className="flex-1 flex flex-col justify-between lg:justify-end lg:gap-0 lg:col-span-12 lg:row-start-3 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-[clamp(2rem,3.1vw,3rem)] lg:pb-[clamp(3.3rem,5.2vw,5rem)] relative z-40 w-full">
        
        {/* Product Placeholder for Mobile Flexbox Composition (absorbs extra vertical space) */}
        <div className="w-full flex-[1.5] min-h-[30svh] lg:hidden" />

        {/* Text Group (Maintains a tight, near-constant gap between typography elements on mobile) */}
        <div className="flex flex-col gap-[clamp(16px,2svh,24px)] lg:contents shrink-0">
          {/* Main hardware title */}
          <motion.div
            className="lg:col-span-7 self-start lg:self-end relative w-full"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <motion.h1
              custom={0}
              variants={fadeUp}
              className="font-outfit text-[clamp(2.5rem,18.5vw,4.5rem)] md:text-[clamp(4.5rem,9.0vw,8.6rem)] font-[400] leading-[0.88] text-white relative z-10 lg:whitespace-nowrap"
              style={{ letterSpacing: '-0.035em' }}
            >
              {UI_CONTENT.headingTitle}<br />
              {UI_CONTENT.headingSubtitle}
            </motion.h1>

            {/* DESKTOP CTA (Absolutely positioned) */}
            <motion.div custom={1} variants={fadeUpCTA} className="hidden lg:block absolute lg:-bottom-[clamp(2.3rem,3.6vw,3.5rem)] left-0 z-20">
              <button
                id="desktop-scroll-btn"
                className="flex items-center gap-3 pointer-events-auto bg-transparent w-auto h-auto text-white/90 hover:text-white transition-colors duration-300 font-outfit uppercase tracking-[0.18em] lg:text-[clamp(0.7rem,1.1vw,1.05rem)] lg:whitespace-nowrap"
                onMouseEnter={() => iconRef.current?.startAnimation?.()}
                onMouseLeave={() => iconRef.current?.stopAnimation?.()}
              >
                <SquareChevronDownIcon ref={iconRef} size={20} className="shrink-0" />
                <span className="leading-none pt-[0.15em]">{UI_CONTENT.ctaButtonText}</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Paragraph */}
          <motion.div
            className="flex lg:col-span-5 lg:col-start-8 self-start lg:self-end flex-col items-start lg:items-end justify-end w-full lg:mb-2 lg:justify-self-end"
            variants={fadeIn}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <p
              className="font-outfit text-[clamp(1rem,5.6vw,1.35rem)] sm:text-[1.45rem] lg:text-[clamp(1.25rem,2.0vw,1.9rem)] font-light leading-[1.25] lg:leading-[1.15] text-white/70 lg:text-white/80 text-left lg:text-right lg:whitespace-nowrap"
              style={{ letterSpacing: '0.001em' }}
            >
              {/* Desktop paragraph with specific line breaks */}
              <span className="hidden lg:inline">
                {UI_CONTENT.bodyParagraph.desktop.split('\n').map((line, index, array) => (
                  <span key={`desktop-${index}`}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </span>
                ))}
              </span>
              
              {/* Tablet paragraph with tailored line breaks */}
              <span className="hidden sm:inline lg:hidden">
                {UI_CONTENT.bodyParagraph.tablet.split('\n').map((line, index, array) => (
                  <span key={`tablet-${index}`}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </span>
                ))}
              </span>

              {/* Mobile paragraph (natural fluid wrapping to prevent orphaned words) */}
              <span className="sm:hidden">
                {UI_CONTENT.bodyParagraph.mobile}
              </span>
            </p>
          </motion.div>

          {/* MOBILE CTA (Restored to exact desktop styling with minimum touch target height) */}
          <motion.div
            custom={1}
            variants={fadeUpCTA}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            className="w-full lg:hidden pointer-events-auto shrink-0"
          >
            <button
              id="mobile-scroll-btn"
              className="flex items-center justify-start gap-3 pointer-events-auto bg-transparent w-full min-h-[48px] text-white/90 hover:text-white transition-colors duration-300 font-outfit uppercase tracking-[0.18em] text-[clamp(0.75rem,3.9vw,0.95rem)]"
            >
              <SquareChevronDownIcon size={20} className="shrink-0" />
              <span className="leading-none pt-[0.15em]">{UI_CONTENT.ctaButtonText}</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
})
