import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// Scroll-only adaptation of the visible Glyph Portal experience:
// https://21st.dev/@Legacy/components/glyph-portal
// The supplied artwork and its own entrance animation remain untouched.
// This point sits inside a solid Pacifico stroke, so zooming naturally fills
// the viewport with the word's white ink, without an overlay or colour fade.
const inkAnchor = { x: 403, y: 133, radius: 12 }
const artwork = { width: 824, height: 294 }

export function GlyphPortal({ children, written }) {
  const portalRef = useRef(null)
  const stageRef = useRef(null)
  const wordRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const fillScale = useMotionValue(1)
  const centreX = useMotionValue(0)
  const centreY = useMotionValue(0)
  const { scrollYProgress } = useScroll({
    target: portalRef,
    offset: ['start start', 'end end'],
  })

  const scale = useTransform(() => reduceMotion ? 1 : Math.exp(
    Math.log(fillScale.get()) * scrollYProgress.get(),
  ))
  const x = useTransform(() => reduceMotion ? 0 : centreX.get() * scrollYProgress.get())
  const y = useTransform(() => reduceMotion ? 0 : centreY.get() * scrollYProgress.get())

  useEffect(() => {
    const stage = stageRef.current
    const word = wordRef.current
    const measure = () => {
      // Layout dimensions exclude the zoom transform, including during resize.
      const unit = word.clientWidth / artwork.width
      if (!unit) return
      fillScale.set(Math.max(1, Math.hypot(stage.clientWidth, stage.clientHeight)
        / (2 * inkAnchor.radius * unit) * 1.15))
      centreX.set((artwork.width / 2 - inkAnchor.x) * unit)
      centreY.set((artwork.height / 2 - inkAnchor.y) * unit)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    observer.observe(word)
    measure()
    return () => observer.disconnect()
  }, [fillScale, centreX, centreY])

  return (
    <>
      <section ref={portalRef} className="harmony-portal">
        <div ref={stageRef} className="harmony-portal-stage">
          <motion.div
            ref={wordRef}
            className="harmony-portal-word"
            data-written={written}
            style={{
              scale, x, y,
              transformOrigin: `${inkAnchor.x / artwork.width * 100}% ${inkAnchor.y / artwork.height * 100}%`,
            }}
          >
            {children}
          </motion.div>
        </div>
      </section>
      <section className="harmony-white-page" aria-hidden="true" />
    </>
  )
}
