// Serif wordmark with the Apple Hello Effect's stroke-reveal technique.
// Animation adapted from ncdai/chanhdai.com (MIT). See LICENSE.ncdai.txt.
import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { harmonyGlyphs, harmonyJoins } from './harmony-serif-paths'

const initialProps = { pathLength: 0, opacity: 0 }
const animateProps = { pathLength: 1, opacity: 1 }

export function HarmonyHelloEffect({
  className,
  durationScale = 0.5,
  onAnimationComplete,
  ...props
}) {
  const reduceMotion = useReducedMotion()
  const id = useId().replaceAll(':', '')
  const calc = (duration) => reduceMotion ? 0 : duration * durationScale
  const delayFor = (index) => harmonyGlyphs.slice(0, index).reduce((total, glyph) => total + glyph.duration, 0)

  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 750 224"
      fill="currentColor"
      {...props}
    >
      <title>Harmony</title>
      <defs>
        {harmonyGlyphs.map((glyph, index) => (
          <mask
            id={`${id}-letter-${index}`}
            key={index}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="750"
            height="224"
            style={{ maskType: 'alpha' }}
          >
            <motion.path
              d={glyph.draw}
              fill="none"
              stroke="white"
              strokeWidth={glyph.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? false : initialProps}
              animate={animateProps}
              transition={{
                duration: calc(glyph.duration),
                delay: calc(delayFor(index)),
                ease: 'easeInOut',
                opacity: { duration: calc(0.12), delay: calc(delayFor(index)) },
              }}
              onAnimationComplete={index === harmonyGlyphs.length - 1 ? onAnimationComplete : undefined}
            />
          </mask>
        ))}
      </defs>
      {harmonyGlyphs.map((glyph, index) => (
        <path key={index} d={glyph.d} mask={`url(#${id}-letter-${index})`} />
      ))}
      {harmonyJoins.map((d, index) => (
        <motion.path
          key={index}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          initial={reduceMotion ? false : initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.18),
            delay: calc(delayFor(index + 1) - 0.12),
            ease: 'easeInOut',
            opacity: { duration: calc(0.06), delay: calc(delayFor(index + 1) - 0.12) },
          }}
        />
      ))}
    </svg>
  )
}
