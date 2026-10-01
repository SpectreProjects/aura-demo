import { HarmonyHelloEffect } from '../components/ui/apple-hello-effect'
import './Landing.css'

export default function Landing() {
  return (
    <main className="harmony-landing" aria-label="Harmony">
      <HarmonyHelloEffect className="harmony-hello" role="img" aria-label="Harmony" />
    </main>
  )
}
