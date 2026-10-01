// Apple Hello Effect animation adapted from ncdai/chanhdai.com (MIT).
// Custom Harmony lettering. See LICENSE.ncdai.txt for the original animation licence.
import { motion, useReducedMotion } from 'framer-motion'

const initialProps = { pathLength: 0, opacity: 0 }
const animateProps = { pathLength: 1, opacity: 1 }

// The first stem and a continuous second stroke, as in the original hello effect.
const firstStroke = 'M9 166 C36 151 61 131 90 98 C109 75 120 49 120 31 C120 18 114 7 102 7 C88 7 80 18 75 41 C69 67 65 96 54 180'
const wordStroke = 'M145 180 C153 133 164 78 171 42 C176 16 188 8 191 25 C195 49 176 99 154 117 C132 135 111 129 89 119 C83 116 78 113 72 112 C96 112 122 105 151 109 C167 111 169 128 164 150 C155 187 181 189 204 152 C211 140 215 128 218 119 C218 127 214 137 218 143 C229 119 251 109 265 120 C279 133 269 167 252 179 C234 193 216 181 219 160 C221 140 240 116 263 119 C274 121 279 127 280 131 L270 169 C266 189 289 187 309 158 L321 119 C325 105 337 103 343 112 C350 123 335 141 324 148 C339 124 352 115 361 126 C369 135 363 149 358 161 C351 184 371 189 392 159 L403 119 L395 173 C410 129 424 112 436 118 C450 124 438 155 432 172 C447 130 465 110 477 117 C490 123 481 152 474 172 C481 187 500 179 513 156 C523 125 538 111 555 117 C578 126 570 161 552 176 C532 192 513 179 517 156 C521 132 535 115 552 116 C568 117 574 137 587 137 C594 137 600 128 604 118 L594 173 C610 130 628 111 642 118 C657 125 645 153 639 170 C635 185 653 186 669 157 C681 140 683 124 688 118 L679 157 C671 182 691 188 711 169 C723 154 728 137 733 119 C725 167 716 211 694 228 C676 242 658 234 667 218 C676 201 711 192 743 175 C763 164 782 143 793 129'

export function HarmonyHelloEffect({
  className,
  durationScale = 0.5,
  onAnimationComplete,
  ...props
}) {
  const reduceMotion = useReducedMotion()
  const calc = (duration) => reduceMotion ? 0 : duration * durationScale

  return (
    <motion.svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 810 250"
      fill="none"
      stroke="currentColor"
      strokeWidth="13"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <title>Harmony</title>
      <motion.path
        d={firstStroke}
        initial={reduceMotion ? false : initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.8),
          ease: 'easeInOut',
          opacity: { duration: calc(0.4) },
        }}
      />
      <motion.path
        d={wordStroke}
        initial={reduceMotion ? false : initialProps}
        animate={animateProps}
        transition={{
          duration: calc(2.8),
          ease: 'easeInOut',
          delay: calc(0.7),
          opacity: { duration: calc(0.7), delay: calc(0.7) },
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </motion.svg>
  )
}
