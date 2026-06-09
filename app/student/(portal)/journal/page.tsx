'use client'
import { useState, useEffect } from 'react'

const MOODS = [
  { emoji: '😄', label: 'رائع',       ring: 'ring-green-400',  bg: 'bg-green-50',  labelColor: 'text-green-600' },
  { emoji: '😊', label: 'كويس',       ring: 'ring-brand-400',  bg: 'bg-brand-50',  labelColor: 'text-brand-600' },
  { emoji: '😐', label: 'عادي',       ring: 'ring-gray-400',   bg: 'bg-gray-50',   labelColor: 'text-gray-500' },
  { emoji: '😕', label: 'مش كويس',   ring: 'ring-amber-400',  bg: 'bg-amber-50',  labelColor: 'text-amber-600' },
  { emoji: '😢', label: 'حزين',       ring: 'ring-red-400',    bg: 'bg-red-50',    labelColor: 'text-red-500' },
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
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-black text-2xl text-gray-900">يومياتي 📔</h1>
        <p className="text-gray-500 text-sm mt-1">{todayStr}</p>
      </div>

      {/* Save success toast */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center animate-slide-up">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-black text-green-700">تم حفظ يومياتك!</p>
        </div>
      )}

      {/* Today entry form or already-done card */}
      {!todayEntry ? (
        <div className="bg-white rounded-3xl border border-[#F0E8FF] p-5 shadow-card">
          <h2 className="font-black text-gray-900 mb-5 text-lg">كيف حالك اليوم؟ 🌟</h2>

          {/* Mood picker — 5 big emoji buttons */}
          <div className="flex gap-2 justify-between mb-6">
            {MOODS.map((m, i) => (
              <button
                key={i}
                onClick={() => setMood(i)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-200 ${
                  mood === i
                    ? `${m.bg} border-transparent ring-2 ${m.ring} scale-125 shadow-card`
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span className={`text-[9px] font-black leading-none ${mood === i ? m.labelColor : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Daily prompt */}
          <div className="bg-brand-50 rounded-2xl p-4 mb-4 border border-[#E8DBFF]">
            <p className="text-brand-700 text-sm font-bold leading-relaxed">💭 {prompt}</p>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 300))}
            placeholder="اكتب هنا..."
            rows={4}
            className="w-full bg-[#FFF8F0] rounded-2xl p-4 text-sm resize-none border border-[#E8DBFF] focus:outline-none focus:ring-2 focus:ring-brand-300 text-right leading-relaxed"
            dir="rtl"
          />
          <div className="text-xs text-gray-400 text-left mt-1 ltr-num">{text.length}/300</div>

          {/* Save button */}
          <button
            onClick={save}
            disabled={mood === null}
            className="mt-4 w-full bg-gradient-to-l from-brand-500 to-[#9A7BFD] hover:from-brand-600 hover:to-brand-500 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all shadow-brand-sm active:scale-95"
          >
            احفظ يومياتي 💾
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-3xl p-6 text-center shadow-card">
          <div className="text-5xl mb-3 animate-bounce-soft">{MOODS[todayEntry.mood]?.emoji}</div>
          <p className="font-black text-green-700 text-lg">دوّنت يومياتك اليوم! 🎉</p>
          {todayEntry.text && (
            <div className="mt-3 bg-white/70 rounded-2xl p-4 text-right">
              <p className="text-gray-600 text-sm leading-relaxed">"{todayEntry.text}"</p>
            </div>
          )}
        </div>
      )}

      {/* Past entries list */}
      {entries.length > 1 && (
        <div>
          <h2 className="font-black text-gray-900 mb-3">يومياتي السابقة 📚</h2>
          <div className="space-y-2">
            {entries.slice(1, 7).map((e, i) => {
              const moodData = MOODS[e.mood]
              return (
                <div key={i} className="bg-white rounded-2xl border border-[#F0E8FF] p-4 flex items-center gap-3 shadow-card">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${moodData?.bg || 'bg-gray-50'}`}>
                    {moodData?.emoji || '😐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 ltr-num">{new Date(e.date).toLocaleDateString('ar')}</p>
                    {e.text
                      ? <p className="text-sm text-gray-700 font-medium truncate mt-0.5">{e.text}</p>
                      : <p className="text-xs text-gray-300 mt-0.5">لا يوجد نص</p>
                    }
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ${moodData?.bg || 'bg-gray-100'} ${moodData?.labelColor || 'text-gray-500'}`}>
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
