'use client'
import { useState } from 'react'
import { Volume2 } from 'lucide-react'

// Pronounce French text using the browser's built-in speech synthesis (free,
// no API). Picks a French voice when available. A must-have for a language app.
export default function SpeakButton({ text, className = '', size = 16 }: { text: string; className?: string; size?: number }) {
  const [speaking, setSpeaking] = useState(false)

  function speak(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fr-FR'
      u.rate = 0.92
      const fr = synth.getVoices().find(v => v.lang?.toLowerCase().startsWith('fr'))
      if (fr) u.voice = fr
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      setSpeaking(true)
      synth.speak(u)
    } catch { setSpeaking(false) }
  }

  return (
    <button type="button" onClick={speak} aria-label="نطق الكلمة"
      className={`inline-flex items-center justify-center rounded-full transition ${speaking ? 'text-violet-600' : 'text-slate-400 hover:text-violet-600'} ${className}`}>
      <Volume2 style={{ width: size, height: size }} className={speaking ? 'animate-pulse' : ''} />
    </button>
  )
}
