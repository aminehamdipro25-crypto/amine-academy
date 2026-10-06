import { Font } from '@react-pdf/renderer'
import { TAJAWAL_BOLD, TAJAWAL_REGULAR } from './fonts-tajawal'

let ready = false

/**
 * Tajawal for every server-rendered PDF, registered once per warm lambda.
 * Data URIs, never file paths: a path makes @react-pdf read the filesystem,
 * which works locally and fails on Vercel where the font is not bundled.
 * Hyphenation is switched off — react-pdf's Latin hyphenation mangles Arabic.
 */
export function registerTajawal() {
  if (ready) return
  Font.register({ family: 'Tajawal', fonts: [{ src: TAJAWAL_REGULAR, fontWeight: 400 }, { src: TAJAWAL_BOLD, fontWeight: 700 }] })
  Font.registerHyphenationCallback(word => [word])
  ready = true
}
