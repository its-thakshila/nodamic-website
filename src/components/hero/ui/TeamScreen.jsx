import { memo } from 'react'
import { motion } from 'framer-motion'
import { ANIMATION_TIMING } from '../../../config/hero.config'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.duration,
      ease: [0.16, 1, 0.3, 1],
      delay: ANIMATION_TIMING.textDelay + i * 0.12,
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const TEAM = [
  {
    name: 'Sithum Vitharana',
    role: 'Co-Founder | Electronics Engineer',
    photo: `${import.meta.env.BASE_URL}team/sithum.png`,
  },
  {
    name: 'Thakshila Bandara',
    role: 'Founder | Firmware Engineer',
    photo: `${import.meta.env.BASE_URL}team/thakshila.png`,
  },
  {
    name: 'Anupama Dewpura',
    role: 'Co-Founder | Mechanical Engineer',
    photo: `${import.meta.env.BASE_URL}team/anupama.png`,
  },
]

/* Shared portrait card — image on top, text below */
function PortraitCard({ member, i, imgHeight }) {
  return (
    <motion.div
      key={member.name}
      custom={i + 1}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center shrink-0"
    >
      <div className="flex items-end justify-center overflow-hidden" style={{ height: imgHeight }}>
        <img
          src={member.photo}
          alt={member.name}
          className="max-w-full max-h-full object-contain object-bottom"
          draggable={false}
        />
      </div>
      <div className="mt-[0.5em] text-center">
        <p
          className="font-outfit text-white font-[500] leading-snug"
          style={{ fontSize: 'min(clamp(0.9rem,3.8vw,1.15rem),2.4svh)', letterSpacing: '-0.01em' }}
        >
          {member.name}
        </p>
        <p
          className="font-outfit text-white/55 font-[300] leading-snug"
          style={{ fontSize: 'min(clamp(0.62rem,2.5vw,0.82rem),1.6svh)', marginTop: '0.15em' }}
        >
          {member.role}
        </p>
      </div>
    </motion.div>
  )
}

/*
 * TeamScreen
 * Renders the "Who's Behind It" layout for Screen 3.
 * Layout strategy:
 *   - Landscape / desktop: horizontal row of 3 cards
 *   - Portrait mobile  (< 640px): single vertical column, image height capped by svh
 *   - Portrait tablet  (≥ 640px): top row of 2 cards + 1 centered below
 * Everything is vertically centered within the available space below the header.
 */
export default memo(function TeamScreen() {
  return (
    /* justify-center vertically centers the whole group (title + cards) */
    <div className="w-full h-full flex flex-col items-center justify-center select-none pointer-events-none overflow-hidden px-4 sm:px-6 gap-0">

      {/* ── Title ── */}
      <motion.h1
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="font-outfit font-[400] text-white text-center leading-[1] shrink-0
                   text-[min(clamp(2rem,9vw,3.5rem),7svh)]
                   sm:text-[clamp(2.5rem,8vw,4rem)]
                   lg:text-[clamp(4rem,6.5vw,7rem)]
                   mb-[max(2svh,0.8rem)] lg:mb-[max(3svh,1.5rem)]"
        style={{ letterSpacing: '-0.035em' }}
      >
        Who's Behind It
      </motion.h1>

      {/* ══════════════════════════════════════════
          LANDSCAPE / DESKTOP — horizontal 3-card row
      ══════════════════════════════════════════ */}
      <div className="hidden landscape:flex flex-row items-end justify-center gap-6 sm:gap-8 lg:gap-16 xl:gap-24 w-full max-w-[1400px]">
        {TEAM.map((member, i) => (
          <motion.div
            key={member.name}
            custom={i + 1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center flex-1 min-w-0"
          >
            <div className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px] xl:max-w-[380px] overflow-hidden flex items-end justify-center">
              <img src={member.photo} alt={member.name} className="w-full h-auto object-contain object-bottom" draggable={false} />
            </div>
            <div className="mt-3 lg:mt-5 text-center">
              <p className="font-outfit text-white text-[min(clamp(1.05rem,4.5vw,1.2rem),2.5svh)] sm:text-[1.15rem] md:text-[1.25rem] lg:text-[clamp(1.25rem,2vw,1.6rem)] font-[500] leading-snug" style={{ letterSpacing: '-0.01em' }}>
                {member.name}
              </p>
              <p className="font-outfit text-white/55 text-[min(clamp(0.75rem,3.5vw,0.85rem),1.8svh)] sm:text-[0.85rem] md:text-[0.9rem] lg:text-[clamp(0.85rem,1.15vw,1.1rem)] font-[300] leading-snug mt-0.5">
                {member.role}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          PORTRAIT MOBILE (< 640px) — single column
          Image height is svh-capped so all 3 + title always fit.
      ══════════════════════════════════════════ */}
      <div className="[@media(orientation:portrait)_and_(max-width:639px)]:flex hidden flex-col items-center gap-[max(1.2svh,0.5rem)] w-full max-w-[280px]">
        {TEAM.map((member, i) => (
          <PortraitCard key={member.name} member={member} i={i} imgHeight="min(17svh, 42vw)" />
        ))}
      </div>

      {/* ══════════════════════════════════════════
          PORTRAIT TABLET (≥ 640px) — 2-on-top + 1 centered below
      ══════════════════════════════════════════ */}
      <div className="[@media(orientation:portrait)_and_(min-width:640px)]:flex hidden flex-col items-center gap-[max(4svh,2rem)] w-full">
        {/* Row 1: first two people */}
        <div className="flex flex-row justify-center gap-[max(8vw,3rem)]">
          <PortraitCard member={TEAM[0]} i={0} imgHeight="min(28svh, 40vw)" />
          <PortraitCard member={TEAM[1]} i={1} imgHeight="min(28svh, 40vw)" />
        </div>
        {/* Row 2: third person centered */}
        <PortraitCard member={TEAM[2]} i={2} imgHeight="min(28svh, 40vw)" />
      </div>

    </div>
  )
})
