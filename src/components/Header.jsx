import { Share2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import wordmark from '../assets/wordmark.svg'

const fadeDown = {
  hidden: { opacity: 0, y: -14 },
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
      className="w-full flex items-center justify-between pb-4 sm:pb-2 pointer-events-auto"
    >
      {/* ── Brand Logo & Title ── */}
      <motion.div custom={0} variants={fadeDown} className="flex items-end gap-4 sm:gap-5 pb-1">
        <img
          src={wordmark}
          alt="Nodamic Logo"
          className="h-5 sm:h-6 brightness-0 invert select-none object-contain"
        />

        <span
          className="font-outfit text-sm sm:text-base font-light tracking-wide text-white/50 select-none leading-none translate-y-1.5"
          style={{ letterSpacing: '0.04em' }}
        >
          Tech Startup
        </span>
      </motion.div>

      {/* ── Navigation Actions ── */}
      <motion.div custom={1} variants={fadeDown} className="flex items-center gap-3">
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
        <button id="discover-btn" className="pill-btn gap-2">
          <Zap size={11} strokeWidth={2} />
          <span>Discover Innovation</span>
        </button>
      </motion.div>
    </motion.header>
  )
}
