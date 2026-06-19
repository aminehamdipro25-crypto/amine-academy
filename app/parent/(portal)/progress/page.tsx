'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Award, Zap, Target, Clock, Brain } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import type { Student, ProgressReport } from '@/lib/types'

interface GameHistory {
  totalPlays: number
  totalMinutes: number
  byGame: Record<string, { plays: number; avgScore: number; avgAccuracy: number; lastPlayed: string }>
  byWeek: { week: string; gamesPlayed: number; avgScore: number; totalMinutes: number }[]
}

interface ChildData { student: Student; history: GameHistory }
interface ChildReports { child: Student; reports: ProgressReport[] }

const DOMAIN_LABELS: Record<string, string> = {
  'memory-cards':    'مطابقة البطاقات',
  'sequence-memory': 'تذكر التسلسل',
  'n-back':          'ذاكرة N-Back',
  'word-recall':     'تذكر الكلمات',
  'letter-match':    'مطابقة الحروف',
  'breathing':       'تمارين التنفس',
  'tap-target':      'التناسق الحركي',
  'simon-says':      'سايمون يقول',
  'reaction-game':   'سرعة رد الفعل',
  'stroop-test':     'ستروب',
  'stop-signal':     'توقف أو اكمل',
  'emotion-cards':   'التعرف على المشاعر',
}

const METRIC_LABELS: Record<string, string> = {
  attention:            'الانتباه والتركيز',
  impulse_control:      'كبح الاندفاعية',
  social_interaction:   'المهارات الاجتماعية',
  motor_coordination:   'التنسيق الحركي',
  emotional_regulation: 'الضبط الانفعالي',
}

function weekLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function ProgressPage() {
  const [gameData, setGameData] = useState<ChildData[]>([])
  const [reportData, setReportData] = useState<ChildReports[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'games' | 'reports'>('games')

  useEffect(() => {
    Promise.all([
      fetch('/api/parent/game-progress').then(r => r.json()).catch(() => ({ progressData: [] })),
      fetch('/api/parent/reports').then(r => r.json()).catch(() => ({ reportsPerChild: [] })),
    ]).then(([gameResp, reportResp]) => {
      const gd: ChildData[] = gameResp.progressData || []
      const rd: ChildReports[] = reportResp.reportsPerChild || []
      setGameData(gd)
      setReportData(rd)
      setSelectedChild(gd[0]?.student.id || rd[0]?.child.id || '')
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-4xl animate-pulse">📈</div>
    </div>
  )

  const allChildren = Array.from(
    new Map([
      ...gameData.map(d => [d.student.id, d.student] as [string, Student]),
      ...reportData.map(d => [d.child.id, d.child] as [string, Student]),
    ]).entries()
  ).map(([, s]) => s)

  const currentGame = gameData.find(d => d.student.id === selectedChild)
  const currentReport = reportData.find(d => d.child.id === selectedChild)
  const student = allChildren.find(s => s.id === selectedChild)
  const reports = currentReport?.reports || []
  const latest = reports[0]
  const history = currentGame?.history

  const topGames = history
    ? Object.entries(history.byGame)
        .map(([gameId, data]) => ({ gameId, ...data, label: DOMAIN_LABELS[gameId] || gameId }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 6)
    : []

  const weekChartData = history?.byWeek.map(w => ({
    name: weekLabel(w.week),
    ألعاب: w.gamesPlayed,
    'متوسط الأداء': w.avgScore,
    دقائق: w.totalMinutes,
  })) || []

  const scoreChartData = history?.byWeek.map(w => ({
    name: weekLabel(w.week),
    الأداء: w.avgScore,
  })) || []

  const avgScores: Record<string, { total: number; count: number }> = {}
  reports.forEach(r => {
    r.behaviorRatings?.forEach(({ metric, score }) => {
      if (!avgScores[metric]) avgScores[metric] = { total: 0, count: 0 }
      avgScores[metric].total += score
      avgScores[metric].count++
    })
  })

  // Behavioral domain trend over time
  const behaviorTrend = reports.length >= 2
    ? [...reports].reverse().map(r => {
        const row: Record<string, number | string> = {
          date: new Date(r.periodEnd || r.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        }
        r.behaviorRatings?.forEach(({ metric, score }) => {
          row[METRIC_LABELS[metric] || metric] = score
        })
        return row
      })
    : []

  const TREND_COLORS = ['#7C5CFC', '#FF8C65', '#22C55E', '#F59E0B', '#3B9EFF']
  const trendMetrics = Object.keys(METRIC_LABELS).filter(m =>
    reports.some(r => r.behaviorRatings?.some(b => b.metric === m))
  )

  // Milestones: metrics improved from first to last report by ≥1
  const milestones: string[] = []
  if (reports.length >= 2) {
    const first = reports[reports.length - 1].behaviorRatings || []
    const last  = reports[0].behaviorRatings || []
    trendMetrics.forEach(m => {
      const firstScore = first.find(b => b.metric === m)?.score ?? 0
      const lastScore  = last.find(b => b.metric === m)?.score ?? 0
      if (lastScore - firstScore >= 1) milestones.push(METRIC_LABELS[m])
    })
  }

  const hasGameData = history && history.totalPlays > 0
  const hasReportData = reports.length > 0

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">تطور طفلك</h1>
        <p className="text-gray-500 text-sm mt-0.5">بيانات حقيقية من الجلسات • محدّث تلقائياً</p>
      </div>

      {/* ── Child selector ── */}
      {allChildren.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={
                selectedChild === child.id
                  ? { background: '#6B46F0', color: '#FFFFFF' }
                  : { background: '#FFFFFF', color: '#6B7280', border: '1.5px solid #E5E7EB' }
              }
              onMouseEnter={e => { if (selectedChild !== child.id) (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF' }}
              onMouseLeave={e => { if (selectedChild !== child.id) (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}
            >
              {child.firstName}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasGameData && !hasReportData && (
        <div
          className="rounded-3xl p-12 text-center"
          style={{ background: '#FFFFFF', border: '2px dashed #E5E7EB' }}
        >
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-600 mb-2">لم تبدأ الجلسات بعد</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">بعد إجراء جلسات مع الأستاذ أمين، ستظهر هنا مؤشرات تطور طفلك بشكل تفصيلي.</p>
        </div>
      )}

      {(hasGameData || hasReportData) && (
        <>
          {/* ── Quick stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Brain className="w-5 h-5" style={{ color: '#6B46F0' }} />, bg: '#F3EEFF', value: history?.totalPlays ?? 0, label: 'لعبة مكتملة', color: '#5A32D9' },
              { icon: <Clock className="w-5 h-5" style={{ color: '#D97706' }} />, bg: '#FFFBEB', value: history?.totalMinutes ?? 0, label: 'دقيقة تدريب', color: '#B45309' },
              { icon: <Zap className="w-5 h-5" style={{ color: '#EA580C' }} />, bg: '#FFF7ED', value: student?.streak ?? 0, label: 'يوم متتالي 🔥', color: '#C2410C' },
              { icon: <Award className="w-5 h-5" style={{ color: '#7C3AED' }} />, bg: '#F5F3FF', value: student?.totalPoints ?? 0, label: 'نقطة إجمالية', color: '#6D28D9' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                <div className="flex justify-center mb-1">{s.icon}</div>
                <div className="font-black text-xl ltr-num" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 rounded-2xl p-1" style={{ background: '#F3F4F6' }}>
            {([['games', '🎮 أداء الألعاب'], ['reports', '📊 تقارير الأستاذ']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={
                  activeTab === key
                    ? { background: '#FFFFFF', color: '#5A32D9', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                    : { color: '#6B7280' }
                }
                onMouseEnter={e => { if (activeTab !== key) (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
                onMouseLeave={e => { if (activeTab !== key) (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Games tab ── */}
          {activeTab === 'games' && (
            <div className="space-y-5">
              {!hasGameData ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6' }}>
                  <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">سيتم عرض بيانات الألعاب هنا بعد أول جلسة تفاعلية</p>
                </div>
              ) : (
                <>
                  {scoreChartData.length > 1 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-1 text-sm">منحنى الأداء الأسبوعي</h2>
                      <p className="text-gray-400 text-xs mb-4">متوسط الدرجة في كل أسبوع (0-100)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={scoreChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0E8FF" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(v: number) => [`${v}%`, 'الأداء']}
                          />
                          <Line type="monotone" dataKey="الأداء" stroke="#7C5CFC" strokeWidth={2.5} dot={{ fill: '#7C5CFC', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {weekChartData.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-1 text-sm">النشاط الأسبوعي</h2>
                      <p className="text-gray-400 text-xs mb-4">عدد الألعاب ودقائق التدريب أسبوعياً</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weekChartData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0E8FF" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="ألعاب" fill="#7C5CFC" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="دقائق" fill="#FFBA44" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {topGames.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-4 text-sm">أداء كل لعبة</h2>
                      <div className="space-y-3">
                        {topGames.map(game => (
                          <div key={game.gameId}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{game.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ltr-num" style={{ background: '#F3F4F6', color: '#6B7280' }}>×{game.plays}</span>
                              </div>
                              <span className="text-sm font-black text-gray-900 ltr-num">{game.avgScore}%</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${game.avgScore}%`,
                                  background: game.avgScore >= 80 ? '#22C55E' : game.avgScore >= 60 ? '#F59E0B' : '#F87171',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Reports tab ── */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              {!hasReportData ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6' }}>
                  <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">سيتم عرض تقارير الأستاذ أمين هنا بعد كل دورة</p>
                </div>
              ) : (
                <>
                  {/* Milestones banner */}
                  {milestones.length > 0 && (
                    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#F0FDF4', border: '1.5px solid #A7F3D0' }}>
                      <span className="text-2xl flex-shrink-0">🏅</span>
                      <div>
                        <p className="font-black text-emerald-800 text-sm mb-1">تقدّم ملحوظ!</p>
                        <p className="text-emerald-700 text-xs leading-relaxed">
                          تحسّن ملحوظ في: <span className="font-bold">{milestones.join(' · ')}</span> مقارنةً بأول تقرير
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Behavioral domain trend chart */}
                  {behaviorTrend.length >= 2 && trendMetrics.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-1 text-sm">تطور المجالات السلوكية</h2>
                      <p className="text-gray-400 text-xs mb-4">مقياس 1-5 عبر جميع التقارير</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={behaviorTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0E8FF" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                          />
                          {trendMetrics.map((m, i) => (
                            <Line
                              key={m}
                              type="monotone"
                              dataKey={METRIC_LABELS[m]}
                              stroke={TREND_COLORS[i % TREND_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 4, fill: TREND_COLORS[i % TREND_COLORS.length] }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {trendMetrics.map((m, i) => (
                          <div key={m} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TREND_COLORS[i % TREND_COLORS.length] }} />
                            <span className="text-xs text-gray-500">{METRIC_LABELS[m]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(avgScores).length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-4 text-sm">متوسط التقييم السلوكي</h2>
                      <div className="space-y-3.5">
                        {Object.entries(avgScores).map(([metric, { total, count }]) => {
                          const pct = Math.round(((total / count) / 5) * 100)
                          return (
                            <div key={metric}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-gray-700 font-medium">{METRIC_LABELS[metric] || metric}</span>
                                <span className="text-sm font-black text-gray-900 ltr-num">{pct}%</span>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: '#7C5CFC' }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {reports.length > 1 && (
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <h2 className="font-black text-gray-900 mb-4 text-sm">تطور النقاط</h2>
                      <div className="flex items-end gap-3 h-28">
                        {[...reports].reverse().slice(-6).map(r => {
                          const pct = Math.min(100, (r.pointsEarned / 300) * 100)
                          return (
                            <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-xs text-gray-500 ltr-num">{r.pointsEarned}</span>
                              <div className="w-full rounded-t-lg overflow-hidden flex-1 flex flex-col justify-end" style={{ background: '#F3F4F6' }}>
                                <div className="w-full rounded-t-lg" style={{ height: `${pct}%`, background: '#7C5CFC' }} />
                              </div>
                              <span className="text-xs text-gray-400 ltr-num">
                                {new Date(r.periodEnd).toLocaleDateString('fr-FR', { month: 'short' })}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {latest && (
                    <div
                      className="rounded-2xl p-5 text-white"
                      style={{ background: 'linear-gradient(to left, #6B46F0, #4A20C8)' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-black text-lg">آخر تقرير</h2>
                        <span className="text-white/70 text-xs">
                          {new Date(latest.periodEnd).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {latest.aiSummary && (
                        <p className="text-white/90 text-sm leading-relaxed mb-4">{latest.aiSummary}</p>
                      )}
                      {latest.professorNotes && (
                        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <p className="text-white/70 text-xs mb-1 font-bold">ملاحظات الأستاذ أمين</p>
                          <p className="text-white text-sm leading-relaxed">{latest.professorNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-white/70 text-xs">
                        <span>✅ {latest.completedExercises}/{latest.totalExercises} تمرين</span>
                        <span>⭐ {latest.pointsEarned} نقطة</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
