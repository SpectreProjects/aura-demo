// Pacifico letter shapes, revealed with the original Apple Hello Effect's
// two-stroke path animation. Animation source: ncdai/chanhdai.com (MIT).
import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { firstPenStroke, pacificoWord, wordPenStroke } from './harmony-pacifico-paths'

const initialProps = { pathLength: 0, opacity: 0 }
const animateProps = { pathLength: 1, opacity: 1 }
const penEase = [0.25, 0.1, 0.75, 0.9]

export function HarmonyHelloEffect({
  className,
  durationScale = 0.65,
  onAnimationComplete,
  ...props
}) {
  const reduceMotion = useReducedMotion()
  const maskId = `pacifico-${useId().replaceAll(':', '')}`
  const calc = (duration) => reduceMotion ? 0 : duration * durationScale

  return (
    <motion.svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 824 294"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <title>Harmony</title>
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="824"
          height="294"
          style={{ maskType: 'alpha' }}
        >
          <motion.path
            d={firstPenStroke}
            fill="none"
            stroke="white"
            strokeWidth="40"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : initialProps}
            animate={animateProps}
            transition={{
              duration: calc(0.8),
              ease: penEase,
              opacity: { duration: calc(0.4) },
            }}
          />
          <motion.path
            d={wordPenStroke}
            fill="none"
            stroke="white"
            strokeWidth="44"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : initialProps}
            animate={animateProps}
            transition={{
              duration: calc(2.8),
              ease: penEase,
              delay: calc(0.7),
              opacity: { duration: calc(0.7), delay: calc(0.7) },
            }}
            onAnimationComplete={onAnimationComplete}
          />
        </mask>
      </defs>
      <path d={pacificoWord} fill="currentColor" mask={`url(#${maskId})`} />
    </motion.svg>
  )
}
