import { useState } from 'react'
import { HarmonyHelloEffect } from '../components/ui/apple-hello-effect'
import { GlyphPortal } from '../components/ui/glyph-portal'
import './Landing.css'

export default function Landing() {
  const [written, setWritten] = useState(false)
  return (
    <main className="harmony-landing" aria-label="Harmony">
      <GlyphPortal written={written}>
        <HarmonyHelloEffect
          className="harmony-hello"
          role="img"
          aria-label="Harmony"
          onAnimationComplete={() => setWritten(true)}
        />
      </GlyphPortal>
    </main>
  )
}
