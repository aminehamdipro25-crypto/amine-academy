'use client'
import { useState, useEffect } from 'react'

const MOODS = [
  { emoji: '😁', label: 'رائع', color: 'bg-green-100 border-green-300' },
  { emoji: '🙂', label: 'كويس', color: 'bg-brand-100 border-brand-300' },
  { emoji: '😐', label: 'عادي', color: 'bg-gray-100 border-gray-300' },
  { emoji: '😔', label: 'مو كويس', color: 'bg-amber-100 border-amber-300' },
  { emoji: '😢', label: 'حزين', color: 'bg-red-100 border-red-300' },
]

interface Entry { date: string; mood: number; text: string }

const PROMPTS = [
  'ما أفضل شيء حدث اليوم؟',
  'كيف كان تركيزك في التمارين اليوم؟',
  'ما الذي صعب عليك اليوم؟',
  'كيف ساعدك الأستاذ أمين هذا الأسبوع؟',
  'شيء واحد تريد تحسينه غداً؟',
]

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const todayStr = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length]

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
    localStorage.setItem('aa_journal', JSON.stringify(next))
    setSaved(true)
    setMood(null)
    setText('')
    setTimeout(() => setSaved(false), 3000)
  }

  const todayEntry = entries.find(e => new Date(e.date).toDateString() === new Date().toDateString())

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <h1 className="font-black text-2xl text-gray-900">يومياتي 📔</h1>
        <p className="text-gray-500 text-sm mt-1">{todayStr}</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-black text-green-700">تم حفظ يومياتك!</p>
        </div>
      )}

      {!todayEntry ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-5">
          <h2 className="font-black text-gray-900 mb-4">كيف حالك اليوم؟</h2>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {MOODS.map((m, i) => (
              <button
                key={i}
                onClick={() => setMood(i)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                  mood === i ? m.color + ' scale-110' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-bold text-gray-600">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-brand-50 rounded-xl p-3 mb-4">
            <p className="text-brand-700 text-sm font-medium">💭 {prompt}</p>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 300))}
            placeholder="اكتب هنا..."
            rows={4}
            className="w-full bg-gray-50 rounded-xl p-4 text-sm resize-none border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            dir="rtl"
          />
          <div className="text-xs text-gray-400 text-left mt-1 ltr-num">{text.length}/300</div>

          <button
            onClick={save}
            disabled={mood === null}
            className="mt-4 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-colors"
          >
            احفظ يومياتي 💾
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">{MOODS[todayEntry.mood].emoji}</div>
          <p className="font-black text-green-700 text-lg">دوّنت يومياتك اليوم!</p>
          {todayEntry.text && <p className="text-gray-600 text-sm mt-2 leading-relaxed">"{todayEntry.text}"</p>}
        </div>
      )}

      {/* Past entries */}
      {entries.length > 1 && (
        <div>
          <h2 className="font-black text-gray-900 mb-3">يومياتي السابقة</h2>
          <div className="space-y-2">
            {entries.slice(1, 7).map((e, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{MOODS[e.mood]?.emoji || '😐'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 ltr-num">{new Date(e.date).toLocaleDateString('ar')}</p>
                  {e.text && <p className="text-sm text-gray-600 truncate mt-0.5">{e.text}</p>}
                </div>
                <span className="text-xs text-gray-400">{MOODS[e.mood]?.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
