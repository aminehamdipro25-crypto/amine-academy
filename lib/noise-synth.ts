// Procedurally-synthesized focus/calm audio via Web Audio API — there is no
// audio FILE to share a URL for, so syncing this to the child means running
// the SAME synthesis independently in their browser, triggered in lockstep
// via the session's noise-state endpoint (mode + active). Extracted out of
// the specialist session page so both it and the kid page share one
// implementation instead of drifting apart over time.

export type NoiseMode = 'white' | 'rain' | 'focus' | 'calm' | 'theta'

export interface NoiseHandle {
  stop: () => void
}

export function startNoiseEngine(mode: NoiseMode): NoiseHandle | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    const masterGain = ctx.createGain()
    // Fade the whole output in from silence instead of jumping straight to
    // the target level — an instant gain step is a broadband click, the
    // main source of "dirty"/harsh sound on start.
    const envGain = ctx.createGain()
    envGain.gain.value = 0
    envGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6)
    masterGain.connect(envGain)
    envGain.connect(ctx.destination)

    let src: AudioBufferSourceNode | null = null

    if (mode === 'focus' || mode === 'theta') {
      // Clean binaural beat: two pure sine tones, no noise floor at all,
      // panned hard left/right so the interaural frequency difference is
      // perceived as a single pulsing beat. Needs stereo headphones.
      masterGain.gain.value = 0.05
      const beatHz  = mode === 'focus' ? 40 : 6 // gamma vs theta range
      const carrier = 200
      for (const pan of [-1, 1]) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = carrier + (pan * beatHz) / 2
        const panner = ctx.createStereoPanner()
        panner.pan.value = pan
        osc.connect(panner)
        panner.connect(masterGain)
        osc.start()
      }
    } else {
      masterGain.gain.value = mode === 'calm' ? 0.045 : 0.09

      const rate = ctx.sampleRate
      const buf  = ctx.createBuffer(1, rate * 3, rate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true

      if (mode === 'rain') {
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 800
        src.connect(lp)
        lp.connect(masterGain)
      } else if (mode === 'calm') {
        // Quiet, heavily-filtered noise bed under a slow consonant pad —
        // gentle ambient texture (no sudden hits, no melody), shown to lower
        // heart rate/anxiety in slow ambient-music research.
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 400
        src.connect(lp)
        lp.connect(masterGain)

        // Sustained open chord (A2-E3-A3-C#4), each voice breathing in and
        // out at ~0.1Hz — about 6 cycles/min, matching a relaxed breathing rate.
        const padFreqs = [110, 164.81, 220, 277.18]
        padFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = freq
          const oscGain = ctx.createGain()
          const baseLevel = 0.05 / (idx + 1)
          oscGain.gain.value = baseLevel
          osc.connect(oscGain)
          oscGain.connect(masterGain)
          osc.start()

          const breathe = ctx.createOscillator()
          breathe.type = 'sine'
          breathe.frequency.value = 0.1
          const breatheGain = ctx.createGain()
          breatheGain.gain.value = baseLevel * 0.6
          breathe.connect(breatheGain)
          breatheGain.connect(oscGain.gain)
          breathe.start()
        })
      } else {
        src.connect(masterGain)
      }
      src.start()
    }

    const stoppedSrc = src
    return {
      stop: () => {
        const now = ctx.currentTime
        envGain.gain.cancelScheduledValues(now)
        envGain.gain.setValueAtTime(envGain.gain.value, now)
        envGain.gain.linearRampToValueAtTime(0, now + 0.3) // fade-out avoids a stop click
        setTimeout(() => {
          if (stoppedSrc) { try { stoppedSrc.stop() } catch { /* already stopped */ } }
          ctx.close().catch(() => {})
        }, 320)
      },
    }
  } catch {
    return null // Web Audio unavailable
  }
}
