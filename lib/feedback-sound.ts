'use client'
// Tiny Web-Audio feedback tones, shared across every exercise via the kid
// page's unified onProgress handler — so all 60 exercises get the SAME
// audio feedback without touching any of them. Synthesized (no audio files):
// works offline, adds no assets. Kept deliberately gentle — the "wrong" tone
// is a soft descending blip, never a harsh buzzer, which matters for
// special-needs children who can be startled or discouraged by sharp sounds.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    // Browsers suspend the context until a user gesture; the child taps to
    // answer, so by the time we play a tone a gesture has occurred.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

function tone(freqs: number[], dur: number, type: OscillatorType, gain: number) {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.value = f
    const start = now + i * 0.085
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(gain, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  })
}

// Bright rising major triad — a small "yes!" chime.
export function playCorrect() {
  tone([523.25, 659.25, 783.99], 0.26, 'sine', 0.10) // C5 · E5 · G5
}

// Soft two-note descent — "not quite", encouraging rather than punishing.
export function playWrong() {
  tone([349.23, 293.66], 0.28, 'triangle', 0.07) // F4 · D4
}
