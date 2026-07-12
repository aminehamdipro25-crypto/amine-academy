import { describe, it, expect } from 'vitest'
import { parseStoryText } from '../lib/stories-data'

describe('parseStoryText', () => {
  it('plain text with no markup returns a single segment', () => {
    expect(parseStoryText('كانَ يا ما كان')).toEqual([{ text: 'كانَ يا ما كان' }])
  })

  it('colors a single marked word', () => {
    expect(parseStoryText('رَأى {{الأَسَد|#F59E0B}} كبيراً')).toEqual([
      { text: 'رَأى ' },
      { text: 'الأَسَد', color: '#F59E0B' },
      { text: ' كبيراً' },
    ])
  })

  it('handles multiple colored words in one line', () => {
    expect(parseStoryText('{{أ|#FF0000}} و {{ب|#00FF00}}')).toEqual([
      { text: 'أ', color: '#FF0000' },
      { text: ' و ' },
      { text: 'ب', color: '#00FF00' },
    ])
  })

  it('a marked word at the very start has no leading empty segment', () => {
    expect(parseStoryText('{{مرحباً|#123456}} بالعالم')).toEqual([
      { text: 'مرحباً', color: '#123456' },
      { text: ' بالعالم' },
    ])
  })

  it('supports 3-digit hex colors', () => {
    expect(parseStoryText('{{كلمة|#f00}}')).toEqual([{ text: 'كلمة', color: '#f00' }])
  })

  it('leaves malformed markup (missing color) untouched as plain text', () => {
    const raw = 'هذا {{بلا لون}} نص'
    expect(parseStoryText(raw)).toEqual([{ text: raw }])
  })

  it('empty string returns a single empty segment, not an empty array', () => {
    expect(parseStoryText('')).toEqual([{ text: '' }])
  })
})
