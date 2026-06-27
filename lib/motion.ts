import type { Variants } from 'framer-motion'

// Shared entrance/stagger variants for dashboard pages — keeps every "alive" card
// animation consistent instead of each page hand-rolling its own timing curve.

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

export const liftHover = {
  whileHover: { y: -6, scale: 1.015, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
  whileTap: { scale: 0.98 },
}

export const tapOnly = {
  whileTap: { scale: 0.97 },
}
