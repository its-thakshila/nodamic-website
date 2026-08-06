import { Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import wordmark from '../../../assets/wordmark.svg'
import { ANIMATION_TIMING } from '../../../config/hero.config'

const fadeDown = {
  hidden: { opacity: 0, y: -14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      duration: ANIMATION_TIMING.duration - (i * 0.12), 
      ease: [0.25, 0.1, 0.25, 1], 
      delay: ANIMATION_TIMING.introDelay + i * 0.12 
    },
  }),
}

export default function Header({ isLoaded = false }) {
  return (
    <motion.header
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      className="w-full flex items-center justify-between pb-4 sm:pb-2 pointer-events-auto"
    >
      {/* ── Brand Logo & Title ── */}
      <motion.div custom={0} variants={fadeDown} className="flex items-end gap-4 sm:gap-5 pb-1">
        <img
          src={wordmark}
          alt="Nodamic Logo"
          className="h-5 sm:h-6 brightness-0 invert select-none object-contain"
        />
        <div className="w-[2px] h-4 sm:h-8 bg-white/30 translate-y-1.5" />

        <span
          className="font-outfit text-base sm:text-lg font-light tracking-wide text-white/50 select-none leading-none translate-y-1.5"
          style={{ letterSpacing: '0.04em' }}
        >
          Hardware Innovation Startup
        </span>
      </motion.div>

      {/* ── Navigation Actions ── */}
      <motion.div custom={1} variants={fadeDown} className="flex items-center gap-3 mt-2">
        <button
          id="share-btn"
          className="flex items-center justify-center w-11 h-11 text-white/70 hover:text-white transition-colors duration-300 bg-transparent border-transparent"
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
          <Share2 size={20} strokeWidth={1.8} />
        </button>
        <button id="discover-btn" className="pill-btn !border-2 !border-white/40 !text-white/70 hover:!border-white/70 hover:!text-white !gap-0 justify-center !text-base sm:!text-lg !px-7 !py-2.5 !tracking-[0.04em] !font-light">
          <span className="leading-none translate-y-[1px] pl-[0.04em]">Contact Us</span>
        </button>
      </motion.div>
    </motion.header>
  )
}
