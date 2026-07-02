'use client'
import { useState, useEffect } from 'react'
import { useLang, tr } from '@/lib/i18n'

const MOOD_CFG = [
  { ringColor: '#22C55E', bg: '#F0FFF4', textColor: '#15803D' },
  { ringColor: '#7C5CFC', bg: '#F3EEFF', textColor: '#6B46F0' },
  { ringColor: '#9CA3AF', bg: '#F9FAFB', textColor: '#6B7280' },
  { ringColor: '#F59E0B', bg: '#FFFBEB', textColor: '#B45309' },
  { ringColor: '#EF4444', bg: '#FEF2F2', textColor: '#B91C1C' },
]
const MOOD_EMOJI = ['😄', '😊', '😐', '😕', '😢']

interface Entry { date: string; mood: number; text: string }

export default function JournalPage() {
  const { lang } = useLang()
  const t = tr[lang].studentJournal
  const MOODS = MOOD_CFG.map((cfg, i) => ({
    ...cfg,
    emoji: MOOD_EMOJI[i],
    label: [t.moods.great, t.moods.good, t.moods.okay, t.moods.bad, t.moods.sad][i],
  }))
  const locale = lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-FR' : 'en-US'
  const [entries, setEntries] = useState<Entry[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  const todayStr = new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const prompt = t.prompts[new Date().getDay() % t.prompts.length]

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aa_journal') || '[]') as Entry[]
      setEntries(stored)
    } catch {}
  }, [])

  function save() {
    if (mood === null) return
    const entry: Entry = { date: new Date().toISOString(), mood, text }
    const next = [entry, ...entries].slice(0, 30)
    setEntries(next)
    try { localStorage.setItem('aa_journal', JSON.stringify(next)) } catch {}
    setSaved(true)
    setMood(null)
    setText('')
    setTimeout(() => setSaved(false), 3000)
  }

  const todayEntry = entries.find(e =>
    new Date(e.date).toDateString() === new Date().toDateString()
  )

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="text-center pt-1 pb-1">
        <h1 className="font-black text-2xl text-gray-900">{t.pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1 ltr-num">{todayStr}</p>
      </div>

      {/* ── Save success banner ── */}
      {saved && (
        <div
          className="rounded-2xl p-4 text-center animate-slide-up"
          style={{ background: '#F0FFF4', border: '1.5px solid #A7F3D0' }}
        >
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-black text-green-700">{t.savedBanner}</p>
        </div>
      )}

      {/* ── Entry form / Already done ── */}
      {!todayEntry ? (
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <h2 className="font-black text-gray-900 mb-5 text-lg">{t.howAreYouToday}</h2>

          {/* ── Mood picker ── */}
          <div className="flex gap-2 justify-between mb-6">
            {MOODS.map((m, i) => {
              const isSelected = mood === i
              return (
                <button
                  key={i}
                  onClick={() => setMood(i)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-200"
                  style={{
                    background: isSelected ? m.bg : '#F9FAFB',
                    border: isSelected ? `2px solid ${m.ringColor}` : '2px solid #F3F4F6',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isSelected ? `0 4px 12px ${m.ringColor}40` : 'none',
                  }}
                >
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  <span
                    className="text-[9px] font-black leading-none"
                    style={{ color: isSelected ? m.textColor : '#9CA3AF' }}
                  >
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Daily prompt ── */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#F3EEFF', border: '1px solid #E8DBFF' }}
          >
            <p className="text-sm font-bold leading-relaxed" style={{ color: '#6B46F0' }}>
              💭 {prompt}
            </p>
          </div>

          {/* ── Text area ── */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 300))}
            placeholder={t.textareaPlaceholder}
            rows={4}
            className="w-full rounded-2xl p-4 text-sm resize-none focus:outline-none leading-relaxed text-right"
            style={{
              background: '#FFF8F0',
              border: '1.5px solid #E8DBFF',
              color: '#1F2937',
            }}
            onFocus={e => { e.target.style.border = '1.5px solid #7C5CFC'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)' }}
            onBlur={e => { e.target.style.border = '1.5px solid #E8DBFF'; e.target.style.boxShadow = 'none' }}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
          <div className="text-xs text-gray-400 text-left mt-1 ltr-num">{text.length}/300</div>

          {/* ── Save button ── */}
          <button
            onClick={save}
            disabled={mood === null}
            className="mt-4 w-full text-white font-black py-3.5 rounded-2xl transition-all active:scale-95"
            style={{
              background: mood === null ? '#D1D5DB' : 'linear-gradient(to left, #7C5CFC, #9A7BFD)',
              boxShadow: mood === null ? 'none' : '0 4px 12px rgba(124,92,252,0.3)',
              cursor: mood === null ? 'not-allowed' : 'pointer',
            }}
          >
            {t.saveButton}
          </button>
        </div>
      ) : (
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg,#F0FFF4,#ECFDF5)', border: '1.5px solid #A7F3D0', boxShadow: '0 4px 16px rgba(16,185,129,0.1)' }}
        >
          <div className="text-5xl mb-3">{MOODS[todayEntry.mood]?.emoji}</div>
          <p className="font-black text-green-700 text-lg">{t.savedTodayTitle}</p>
          {todayEntry.text && (
            <div
              className="mt-3 rounded-2xl p-4 text-right"
              style={{ background: 'rgba(255,255,255,0.7)' }}
            >
              <p className="text-gray-600 text-sm leading-relaxed">"{todayEntry.text}"</p>
            </div>
          )}
        </div>
      )}

      {/* ── Past entries ── */}
      {entries.length > 1 && (
        <div>
          <h2 className="font-black text-gray-900 mb-3 text-base">{t.pastEntriesTitle}</h2>
          <div className="space-y-2">
            {entries.slice(1, 8).map((e, i) => {
              const moodData = MOODS[e.mood]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #F0E8FF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={el => { (el.currentTarget as HTMLDivElement).style.transform = 'translateX(-2px)'; (el.currentTarget as HTMLDivElement).style.borderColor = '#D3BBFF' }}
                  onMouseLeave={el => { (el.currentTarget as HTMLDivElement).style.transform = ''; (el.currentTarget as HTMLDivElement).style.borderColor = '#F0E8FF' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: moodData?.bg || '#F9FAFB' }}
                  >
                    {moodData?.emoji || '😐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 ltr-num">
                      {new Date(e.date).toLocaleDateString(locale)}
                    </p>
                    {e.text
                      ? <p className="text-sm text-gray-700 font-medium truncate mt-0.5">{e.text}</p>
                      : <p className="text-xs text-gray-300 mt-0.5">{t.noText}</p>
                    }
                  </div>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: moodData?.bg || '#F9FAFB',
                      color: moodData?.textColor || '#6B7280',
                    }}
                  >
                    {moodData?.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
