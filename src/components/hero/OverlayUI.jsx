import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Header from '../Header'
import { UI_CONTENT, LAYER_Z_INDEX } from '../../config/hero.config'

/* ─── Animation Variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.4 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' },
  },
}

/*
 * Layer 6 (z-60): OverlayUI
 * Contains all interactive architecture: Logo, Navigation (Header), Hero title,
 * Paragraph, Labels, CTA button, and Scroll discovery badge.
 */
export default function OverlayUI() {
  return (
    <div
      className="absolute inset-0 w-full h-full px-6 py-6 sm:px-12 sm:py-10 md:px-16 md:py-12 grid grid-cols-12 grid-rows-[auto_1fr_auto] pointer-events-none select-none"
      style={{ zIndex: LAYER_Z_INDEX.overlayUI }}
    >
      {/* Row 1: Logo & Navigation Bar (Interactive) */}
      <div className="col-span-12 row-start-1 pointer-events-auto">
        <Header />
      </div>

      {/* Row 3: Bottom 12-column layout — Typography (Left 7 cols) & Paragraph (Right 4 cols) */}
      <div className="col-span-12 row-start-3 grid grid-cols-12 items-end gap-x-6 lg:gap-x-12 pb-8 md:pb-16 lg:pb-20">
        {/* Bottom-left: Main hardware title */}
        <motion.div
          className="col-span-12 lg:col-span-7 self-end relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUp}
            className="font-outfit text-[clamp(3.6rem,9.5vw,8.6rem)] font-[400] leading-[0.88] text-white pointer-events-auto relative z-10"
            style={{ letterSpacing: '-0.035em' }}
          >
            {UI_CONTENT.headingTitle}<br />
            {UI_CONTENT.headingSubtitle}
          </motion.h1>

          <motion.div variants={fadeUp} className="absolute -bottom-16 md:-bottom-20 left-0 z-20">
            <button
              id="scroll-discover-btn"
              className="pill-btn gap-2.5 pointer-events-auto"
            >
              <span className="scroll-btn-arrow">
                <ArrowRight size={12} strokeWidth={1.75} />
              </span>
              <span>{UI_CONTENT.ctaButtonText}</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Bottom-right: Paragraph (max-width 32rem) */}
        <motion.div
          className="hidden sm:flex sm:col-span-5 sm:col-start-8 lg:col-span-5 lg:col-start-8 self-end flex-col items-end justify-end max-w-[32rem] mb-1 lg:mb-2 sm:justify-self-end pointer-events-auto"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.1 }}
        >
          <p
            className="font-outfit text-2xl md:text-[1.75rem] font-normal leading-[1.55] text-white/90 text-right"
            style={{ letterSpacing: '0.015em', maxWidth: '32rem' }}
          >
            {UI_CONTENT.bodyParagraph}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
