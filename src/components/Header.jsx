import { Share2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.12 },
  }),
}

export default function Header() {
  return (
    <motion.header
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-10 md:py-6"
      style={{ pointerEvents: 'auto' }}
    >
      {/* ── Brand ── */}
      <motion.div custom={0} variants={fadeDown} className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
          <div className="w-1 h-1 rounded-full bg-white opacity-40" />
        </div>

        {/* Brand text */}
        <span
          className="font-grotesk text-sm font-medium tracking-widest text-white/80 select-none uppercase"
          style={{ letterSpacing: '0.12em' }}
        >
          nodamic
        </span>

        {/* Divider */}
        <span className="text-white/20 font-light text-sm select-none">|</span>

        <span
          className="font-inter text-xs font-light tracking-wide text-white/40 select-none hidden sm:block"
          style={{ letterSpacing: '0.06em' }}
        >
          Innovation Studio
        </span>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div custom={1} variants={fadeDown} className="flex items-center gap-3">
        {/* Share button */}
        <button
          id="share-btn"
          className="icon-btn"
          aria-label="Share"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'nodamic Node 1',
                text: 'Unthink the Ordinary. — nodamic Innovation Studio',
                url: window.location.href,
              })
            } else {
              navigator.clipboard?.writeText(window.location.href)
            }
          }}
        >
          <Share2 size={14} strokeWidth={1.8} />
        </button>

        {/* CTA pill */}
        <button id="discover-btn" className="pill-btn">
          <Zap size={11} strokeWidth={2} />
          Discover Innovation
        </button>
      </motion.div>
    </motion.header>
  )
}
