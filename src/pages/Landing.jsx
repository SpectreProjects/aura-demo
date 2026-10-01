import { AppleHelloEffectEnglish } from '../components/ui/apple-hello-effect'
import './Landing.css'

export default function Landing() {
  return (
    <main className="harmony-landing" aria-label="Harmony">
      <AppleHelloEffectEnglish className="harmony-hello" role="img" aria-label="hello" />
    </main>
  )
}
