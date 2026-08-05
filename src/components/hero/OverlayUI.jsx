import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { UI_CONTENT } from '../../config/hero.config'

/* ─── Animation Variants (existing entrance animations preserved) ─────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.5 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' },
  },
}

export default function OverlayUI() {
  return (
    /*
     * Full-viewport CSS Grid layout replacing absolute positioning.
     * pointer-events: none allows mouse tracking to pass through to the 3D canvas behind it.
     */
    <div
      className="absolute inset-0 z-10 w-full h-full p-6 pb-10 md:p-10 md:pb-10 grid grid-cols-1 md:grid-cols-12 grid-rows-[1fr_auto_1fr] pointer-events-none select-none"
    >
      {/* Row 1: Top spacing for Header */}
      <div className="col-span-full row-start-1" />

      {/* Row 2: Center-right product badge */}
      <motion.div
        className="col-span-full md:col-span-3 md:col-start-10 row-start-2 flex flex-col items-end justify-center gap-1.5"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.6 }}
      >
        <span
          className="font-grotesk text-[9px] font-medium tracking-widest text-white/20 uppercase"
          style={{ letterSpacing: '0.22em' }}
        >
          {UI_CONTENT.badgeTitle}
        </span>
        <div className="w-4 h-px bg-white/15" />
        <span
          className="font-grotesk text-[9px] font-light tracking-widest text-white/15 uppercase"
          style={{ letterSpacing: '0.18em' }}
        >
          {UI_CONTENT.badgeSubtitle}
        </span>
      </motion.div>

      {/* Row 3: Bottom hero typography (left) and descriptive summary (right) */}
      <div className="col-span-full row-start-3 grid grid-cols-1 sm:grid-cols-12 items-end gap-6">
        {/* Bottom-left: Eyebrow, Main heading + CTA */}
        <motion.div
          className="sm:col-span-8 flex flex-col gap-4 md:gap-5 self-end"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <span
              className="font-grotesk text-[10px] font-medium tracking-widest text-white/30 uppercase"
              style={{ letterSpacing: '0.25em' }}
            >
              {UI_CONTENT.eyebrow}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-grotesk text-[clamp(2.8rem,7vw,6rem)] font-bold leading-[0.92] tracking-tight text-white"
            style={{ lineHeight: '0.92' }}
          >
            {UI_CONTENT.headingTitle}<br />
            {UI_CONTENT.headingSubtitle}
          </motion.h1>

          <motion.div variants={fadeUp}>
            <button
              id="scroll-discover-btn"
              className="pill-btn text-white/50 border-white/15 hover:text-white/80 hover:border-white/30 gap-2 pointer-events-auto"
              style={{ fontSize: '0.65rem', letterSpacing: '0.18em' }}
            >
              <span className="scroll-btn-arrow">
                <ArrowRight size={11} strokeWidth={2} />
              </span>
              {UI_CONTENT.ctaButtonText}
            </button>
          </motion.div>
        </motion.div>

        {/* Bottom-right: Body paragraph */}
        <motion.div
          className="hidden sm:flex sm:col-span-4 self-end flex-col items-end justify-end max-w-[220px] md:max-w-[260px] sm:justify-self-end"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.2 }}
        >
          <p
            className="font-inter text-xs font-light leading-relaxed text-white/45 text-right"
            style={{ letterSpacing: '0.02em' }}
          >
            {UI_CONTENT.bodyParagraph}
          </p>

          <div className="mt-3 ml-auto w-8 h-px bg-white/15" />
        </motion.div>
      </div>
    </div>
  )
}
