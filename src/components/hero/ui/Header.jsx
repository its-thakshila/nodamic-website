import { Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import wordmark from '../../../assets/wordmark.svg'
import { ANIMATION_TIMING } from '../../../config/hero.config'

const fadeDown = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: ANIMATION_TIMING.duration, 
      ease: [0.25, 0.1, 0.25, 1], 
      delay: ANIMATION_TIMING.textDelay 
    },
  },
}

export default function Header({ isLoaded = false }) {
  return (
    <motion.header
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      className="w-full flex items-center justify-between pb-4 sm:pb-2 pointer-events-auto"
    >
      {/* ── Brand Logo & Title ── */}
      <motion.div custom={0} variants={fadeDown} className="flex items-center gap-4 sm:gap-5">
        <img
          src={wordmark}
          alt="Nodamic Logo"
          className="h-5 sm:h-6 brightness-0 invert select-none object-contain -translate-y-[1.5px]"
        />
        <div className="hidden lg:block w-[2px] h-4 sm:h-7 bg-white/30" />

        <span
          className="hidden lg:inline-block font-outfit text-base sm:text-lg font-light tracking-wide text-white/50 select-none leading-none pt-[0.1em]"
          style={{ letterSpacing: '0.04em' }}
        >
          Hardware Innovation Startup
        </span>
      </motion.div>

      {/* ── Navigation Actions ── */}
      <motion.div custom={1} variants={fadeDown} className="flex items-center gap-1 sm:gap-3">
        <button
          id="share-btn"
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 text-white/70 hover:text-white transition-colors duration-300 bg-transparent border-transparent"
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
        <button id="discover-btn" className="pill-btn !border-2 !border-white/40 !text-white/70 hover:!border-white/70 hover:!text-white !gap-0 justify-center !text-sm sm:!text-lg !px-5 sm:!px-7 !py-2 sm:!py-2.5 !tracking-[0.04em] !font-light">
          <span className="leading-none translate-y-[1px] pl-[0.04em]">Contact Us</span>
        </button>
      </motion.div>
    </motion.header>
  )
}
