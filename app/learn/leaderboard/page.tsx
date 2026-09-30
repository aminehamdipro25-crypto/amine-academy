'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import { Trophy, ArrowLeft, ArrowRight, Loader2, Star } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Row { name: string; xp: number; rank: number; isMe: boolean }

export default function LeaderboardPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState<{ rank: number; xp: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learner/leaderboard').then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setRows(d.rows || []); setMe(d.me) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const medal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
            {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}
          </Link>
        </div>

        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1"><Trophy className="w-5 h-5" style={{ color: PURPLE }} /> {pickLang(lang, 'المتصدّرون هذا الأسبوع', 'This week’s leaders', 'Classement de la semaine')}</h1>
        <p className="text-slate-400 text-sm mb-5">{pickLang(lang, 'اكسب نقاطاً من التمارين والمفردات لترتقي.', 'Earn XP from practice and vocabulary to climb.', 'Gagnez des XP pour grimper.')}</p>

        {me && (
          <div className="rounded-2xl p-4 mb-4 text-white flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
            <p className="font-black">{pickLang(lang, `ترتيبك: #${me.rank}`, `Your rank: #${me.rank}`, `Votre rang : #${me.rank}`)}</p>
            <p className="font-black flex items-center gap-1"><Star className="w-4 h-4" /> {me.xp} XP</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin" style={{ color: PURPLE }} /></div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 text-sm">{pickLang(lang, 'لا نشاط بعد هذا الأسبوع — كن الأوّل!', 'No activity yet — be first!', 'Aucune activité — soyez le premier !')}</div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {rows.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${r.isMe ? 'bg-violet-50' : ''}`}>
                <span className="w-8 text-center font-black text-sm" style={{ color: r.rank <= 3 ? PURPLE : '#94a3b8' }}>{medal(r.rank)}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 text-white text-xs font-black flex items-center justify-center">{r.name.charAt(0)}</div>
                <p className={`flex-1 font-bold text-sm ${r.isMe ? 'text-violet-800' : 'text-slate-700'}`}>{r.name}{r.isMe ? pickLang(lang, ' (أنت)', ' (you)', ' (vous)') : ''}</p>
                <p className="font-black text-sm flex items-center gap-1" style={{ color: PURPLE }}><Star className="w-3.5 h-3.5" />{r.xp}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
