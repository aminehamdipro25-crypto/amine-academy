'use client'

// Centralized Arabic TTS — single source of truth for all speech in the app.
// Handles the Chrome voiceschanged async race condition that causes voice
// selection to silently fail when called immediately on page load.

let cachedVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

function pickArabicVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Prefer Saudi Arabic (most widely available), then Egyptian, then any ar-*
  return (
    voices.find(v => v.lang === 'ar-SA') ??
    voices.find(v => v.lang === 'ar-EG') ??
    voices.find(v => v.lang.startsWith('ar-')) ??
    voices.find(v => v.lang === 'ar') ??
    null
  )
}

function refreshVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    voicesLoaded = true
    cachedVoice = pickArabicVoice(voices)
  }
}

// Chrome loads voices asynchronously and fires 'voiceschanged' when ready.
// Firefox and Safari load them synchronously so the initial call below works.
// We guard with typeof window to avoid SSR errors.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voicesLoaded = false
    cachedVoice = null
    refreshVoices()
  })
  refreshVoices()
}

/**
 * Speak Arabic text with the best available Arabic voice.
 * Returns a Promise that resolves when speech ends (or immediately if TTS unavailable).
 */
export function speakArabic(text: string, rate = 0.85): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve()
      return
    }

    // Lazy-load voices on first call if voiceschanged hasn't fired yet
    if (!voicesLoaded) refreshVoices()

    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang   = 'ar-SA'
    utt.rate   = rate
    utt.pitch  = 1
    utt.volume = 1

    if (cachedVoice) utt.voice = cachedVoice

    utt.onend   = () => resolve()
    utt.onerror = () => resolve()

    window.speechSynthesis.speak(utt)
  })
}

/** Stop any currently playing speech. */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** True if browser supports TTS at all (not whether an Arabic voice exists). */
export function hasTTSSupport(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Arabic digit words for numbers 0–10 (avoids browser speaking digits in English). */
const AR_DIGITS = ['صفر','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة']
export function arabicDigitWord(n: number): string {
  return AR_DIGITS[n] ?? String(n)
}
