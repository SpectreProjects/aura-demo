import { useEffect, useState } from 'react'

export default function TypewriterIntro({ text }) {
  const [visibleText, setVisibleText] = useState('')

  useEffect(() => {
    let index = 0
    let timeoutId

    function typeNextCharacter() {
      index += 1
      setVisibleText(text.slice(0, index))

      if (index < text.length) {
        const character = text[index - 1]
        const pause = character === ',' ? 125 : character === ' ' ? 42 : 28 + (index % 4) * 8
        timeoutId = window.setTimeout(typeNextCharacter, pause)
      }
    }

    timeoutId = window.setTimeout(typeNextCharacter, 220)
    return () => window.clearTimeout(timeoutId)
  }, [text])

  return (
    <h2 aria-label={text} className="whitespace-nowrap text-[clamp(0.88rem,3vw,2.9rem)] font-medium leading-none tracking-[-0.052em] text-white">
      <span aria-hidden="true">{visibleText}</span>
      <span
        aria-hidden="true"
        className={`ml-1 inline-block h-[0.86em] w-[4px] translate-y-[0.08em] rounded-full bg-[#3867F4] ${visibleText.length < text.length ? 'animate-pulse' : 'opacity-0'}`}
      />
    </h2>
  )
}
