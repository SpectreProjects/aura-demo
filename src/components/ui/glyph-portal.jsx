import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { pacificoWord } from './harmony-pacifico-paths'

// Scroll-only adaptation of the visible Glyph Portal experience:
// https://21st.dev/@Legacy/components/glyph-portal
// The supplied artwork and its own entrance animation remain untouched.
// This point sits inside a solid Pacifico stroke, so zooming naturally fills
// the viewport with the word's white ink, without an overlay or colour fade.
const inkAnchor = { x: 403, y: 133, radius: 12 }
const artwork = { width: 824, height: 294 }

export function GlyphPortal({ children, written, cta }) {
  const portalRef = useRef(null)
  const stageRef = useRef(null)
  const wordRef = useRef(null)
  const canvasRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const fillScale = useMotionValue(1)
  const centreX = useMotionValue(0)
  const centreY = useMotionValue(0)
  const { scrollYProgress } = useScroll({
    target: portalRef,
    offset: ['start start', 'end end'],
  })
  // Touch scroll events arrive in steps. Interpolate the camera between them,
  // without intercepting scrolling or adding React renders on every frame.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 600, damping: 40, mass: 0.6, restDelta: 0.0001, restSpeed: 0.001,
  })
  const progress = useTransform(smoothProgress, value => Math.min(1, Math.max(0, value)))
  useMotionValueEvent(scrollYProgress, 'change', value => {
    // Native scrolling can leave the sticky stage before the spring settles.
    // Match both boundaries immediately, including Home/End and restored scroll.
    if (value <= 0 || value >= 1) smoothProgress.jump(value)
  })

  const scale = useTransform(() => reduceMotion ? 1 : Math.exp(
    Math.log(fillScale.get()) * progress.get(),
  ))
  const x = useTransform(() => reduceMotion ? 0 : centreX.get() * progress.get())
  const y = useTransform(() => reduceMotion ? 0 : centreY.get() * progress.get())
  const ctaOpacity = useTransform(() => reduceMotion ? 1 : Math.max(0, 1 - progress.get() / 0.06))
  const ctaVisibility = useTransform(() => !reduceMotion && progress.get() >= 0.06 ? 'hidden' : 'visible')

  useEffect(() => {
    const stage = stageRef.current
    const word = wordRef.current
    const canvas = canvasRef.current
    // Keep the original SVG for the greeting and as a browser fallback. Once
    // written, redraw those exact vector contours into a viewport-sized surface.
    // Scaling the DOM SVG to tens of thousands of pixels caused expensive mobile
    // rasterisation. Never scale a cached bitmap: redraw the path at each zoom.
    const context = !reduceMotion && written && typeof Path2D !== 'undefined'
      ? canvas.getContext('2d') : null
    const path = context ? new Path2D(pacificoWord) : null
    const ink = getComputedStyle(stage).color
    let geometry
    const draw = () => {
      const p = progress.get()
      const active = Boolean(context && geometry && p > 0)
      if (active) {
        const { width, height, unit, ratio, cx, cy, endScale } = geometry
        const zoom = Math.exp(Math.log(endScale) * p)
        context.setTransform(ratio, 0, 0, ratio, 0, 0)
        context.clearRect(0, 0, width, height)
        context.fillStyle = ink
        const anchorX = width / 2 - cx * (1 - p)
        const anchorY = height / 2 - cy * (1 - p)
        if (unit * zoom * inkAnchor.radius >= Math.hypot(
          width / 2 + Math.abs(cx * (1 - p)), height / 2 + Math.abs(cy * (1 - p)),
        )) {
          // All corners are already inside solid ink. Avoid processing an
          // enormous offscreen path when the correct result is entirely white.
          context.fillRect(0, 0, width, height)
        } else {
          context.setTransform(unit * zoom * ratio, 0, 0, unit * zoom * ratio,
            (anchorX - inkAnchor.x * unit * zoom) * ratio,
            (anchorY - inkAnchor.y * unit * zoom) * ratio)
          context.fill(path)
        }
      }
      const renderer = active ? 'canvas' : 'svg'
      if (stage.dataset.renderer !== renderer) stage.dataset.renderer = renderer
    }
    const measure = () => {
      // Layout dimensions exclude the zoom transform, including during resize.
      const unit = parseFloat(getComputedStyle(word).width) / artwork.width
      if (!unit) return
      const width = stage.clientWidth
      const height = stage.clientHeight
      const endScale = Math.max(1, Math.hypot(width, height) / (2 * inkAnchor.radius * unit) * 1.15)
      const cx = (artwork.width / 2 - inkAnchor.x) * unit
      const cy = (artwork.height / 2 - inkAnchor.y) * unit
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      geometry = { width, height, unit, ratio, cx, cy, endScale }
      if (context) {
        canvas.width = Math.ceil(width * ratio)
        canvas.height = Math.ceil(height * ratio)
      }
      fillScale.set(endScale)
      centreX.set(cx)
      centreY.set(cy)
      draw()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    observer.observe(word)
    measure()
    const unsubscribe = progress.on('change', draw)
    return () => {
      observer.disconnect()
      unsubscribe()
      delete stage.dataset.renderer
    }
  }, [fillScale, centreX, centreY, progress, reduceMotion, written])

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
          <canvas ref={canvasRef} className="harmony-portal-canvas" aria-hidden="true" />
          {cta && (
            <motion.div className="harmony-portal-action" style={{ opacity: ctaOpacity, visibility: ctaVisibility }}>
              <div className="harmony-portal-action-content">{cta}</div>
            </motion.div>
          )}
        </div>
      </section>
      <section className="harmony-white-page" aria-hidden="true" />
    </>
  )
}
