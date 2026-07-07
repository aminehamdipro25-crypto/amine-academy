'use client'
// Top header bar of the in-session player (app/session/[id]/page.tsx): close
// button, student identity + quick profile card, session timer, paused/saved
// flash badges, average score, and start/save controls. Extracted out of
// page.tsx to keep that file focused on session state/behavior.
import { Clock, X, Save, ClipboardList, ChevronDown, User, Pause, Check } from 'lucide-react'
import type { ExerciseResult, StudentAssessmentProfile } from '@/lib/types'
import { DIFFICULTY_LABELS_AR } from '@/lib/game-mapping'
import { DIAG_LABELS, SEVERITY_LABELS, SESSION_TYPE_CFG } from '@/lib/session-constants'
import { formatTime } from '@/lib/session-helpers'

export default function SessionHeader({
  headerRef,
  chromeHidden,
  onClose,
  studentName,
  studentAge,
  studentDiagnosis,
  studentSeverity,
  sessionCount,
  appointmentType,
  profileOpen,
  onToggleProfile,
  onCloseProfile,
  pastSessions,
  profile,
  notes,
  running,
  elapsed,
  results,
  avgScore,
  savedFlash,
  onStart,
  onSave,
  saving,
  saved,
  saveFailed,
  kidStatus,
  activeExerciseId,
}: {
  headerRef: React.RefObject<HTMLElement>
  chromeHidden: boolean
  onClose: () => void
  studentName: string
  studentAge: number
  studentDiagnosis: string
  studentSeverity: number
  sessionCount: number
  appointmentType: string
  profileOpen: boolean
  onToggleProfile: () => void
  onCloseProfile: () => void
  pastSessions: { score: number; date: string; count: number }[]
  profile: StudentAssessmentProfile | null
  notes: string
  running: boolean
  elapsed: number
  results: ExerciseResult[]
  avgScore: number
  savedFlash: boolean
  onStart: () => void
  onSave: () => void
  saving: boolean
  saved: boolean
  saveFailed: boolean
  kidStatus: { exerciseId: string; status: 'active' | 'done'; ts: number } | null
  activeExerciseId: string | null
}) {
  return (
    <header
      ref={headerRef}
      className={`border-b border-brand-100 bg-white/90 backdrop-blur-sm flex items-center gap-2 px-3 py-2 flex-shrink-0 relative z-[60] ${chromeHidden ? 'hidden' : ''}`}
    >
      {/* Close — pause the timer before leaving so the session isn't left
          "running" in the background; reopening it later resumes paused,
          never silently counting the time spent away. */}
      <button
        onClick={onClose}
        className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors hover:bg-brand-50 text-gray-400 hover:text-gray-700"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Student info — name only on mobile, full on desktop */}
      <div className="flex-1 min-w-0 relative">
        <button
          onClick={onToggleProfile}
          className="flex items-center gap-1.5 min-w-0 max-w-full"
        >
          {/* Avatar initial */}
          <div
            className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg,#7C5CFC,#C084FC)' }}
          >
            {(studentName || 'ج').charAt(0).toUpperCase()}
          </div>
          <span className="text-gray-900 font-black text-sm truncate">
            <span className="sm:hidden">{(() => { const n = (studentName || 'جلسة').split(' ')[0]; return n.charAt(0).toUpperCase() + n.slice(1); })()}</span>
            <span className="hidden sm:inline">{studentName || 'جلسة تفاعلية'}</span>
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-300 flex-shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Badges — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
          {studentDiagnosis && (
            <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full font-bold">
              {DIAG_LABELS[studentDiagnosis] || studentDiagnosis}
            </span>
          )}
          {studentSeverity > 0 && (
            <span className="text-[10px] bg-surface-page text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
              {SEVERITY_LABELS[studentSeverity]}
            </span>
          )}
          {sessionCount > 0 && (
            <span className="text-[10px] bg-surface-page text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
              ج.{sessionCount} سابقة
            </span>
          )}
          {appointmentType && SESSION_TYPE_CFG[appointmentType] && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${SESSION_TYPE_CFG[appointmentType].color}`}>
              {SESSION_TYPE_CFG[appointmentType].isAssessment && <ClipboardList className="w-2.5 h-2.5" />}
              {SESSION_TYPE_CFG[appointmentType].label}
            </span>
          )}
        </div>

        {/* ── Quick Profile Card ── */}
        {profileOpen && (
          <div
            className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto z-[70] rounded-2xl p-4 w-[min(288px,calc(100vw-24px))] shadow-2xl bg-white border border-brand-100"
            dir="rtl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 font-black text-sm truncate">{studentName || '—'}</div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {studentAge} سنة • {DIAG_LABELS[studentDiagnosis] || studentDiagnosis || 'لا يوجد تشخيص'}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {studentSeverity > 0 && (
                    <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full font-bold">
                      {SEVERITY_LABELS[studentSeverity]}
                    </span>
                  )}
                  {sessionCount > 0 && (
                    <span className="text-[10px] text-gray-400 font-medium">{sessionCount} جلسة سابقة</span>
                  )}
                </div>
              </div>
            </div>

            {pastSessions.length > 0 && (
              <div className="mb-3">
                <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">آخر 3 جلسات</div>
                <div className="space-y-1.5">
                  {pastSessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-page rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.score}%`,
                            background: s.score >= 80 ? '#22C55E' : s.score >= 60 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-gray-600 text-[10px] font-black ltr-num w-8 text-left">{s.score}%</span>
                      <span className="text-gray-300 text-[9px] ltr-num flex-shrink-0">{s.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none') && (
              <div className="border-t border-brand-100 pt-3 mb-3">
                <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">صعوبات موثقة</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(profile.diagnosedDifficulties)
                    .filter(([, v]) => v !== 'none')
                    .map(([k, v]) => (
                      <span key={k} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        v === 'severe'   ? 'bg-red-50 text-red-600 border-red-200' :
                        v === 'moderate' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                           'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {DIFFICULTY_LABELS_AR[k as keyof typeof DIFFICULTY_LABELS_AR]}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}

            <div className={`${(profile && Object.entries(profile.diagnosedDifficulties).some(([, v]) => v !== 'none')) || pastSessions.length > 0 ? 'border-t border-brand-100 pt-3' : ''}`}>
              <div className="text-gray-400 text-[10px] font-black mb-1 uppercase tracking-wider">ملاحظات</div>
              {notes ? (
                <p className="text-gray-600 text-[10px] leading-relaxed line-clamp-3">{notes}</p>
              ) : (
                <p className="text-gray-300 text-[10px] italic">لا توجد ملاحظات بعد</p>
              )}
            </div>

            <button
              onClick={onCloseProfile}
              className="mt-3 w-full text-gray-400 hover:text-gray-600 text-[10px] font-bold transition-colors pt-2 border-t border-brand-100"
            >
              إغلاق ✕
            </button>
          </div>
        )}
      </div>

      {/* Session Timer */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0 border transition-colors duration-300 ${
          running ? 'bg-emerald-50 border-emerald-200' : 'bg-surface-page border-brand-100'
        }`}
      >
        <Clock className={`w-3.5 h-3.5 ${running ? 'text-emerald-600' : 'text-gray-300'}`} />
        <span className={`font-black text-base ltr-num ${running ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Paused indicator — only when the session had actually started before
          (elapsed time logged or exercises completed), so it's visually distinct
          from a fresh session that simply hasn't been started yet. Prevents the
          ambiguity of "is this paused, or just not started?" after a draft restore. */}
      {!running && (elapsed > 0 || results.length > 0) && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 border border-amber-200 bg-amber-50 animate-in fade-in duration-300"
          title="الجلسة متوقفة مؤقتًا — اضغط ابدأ للمتابعة"
        >
          <Pause className="w-3 h-3 text-amber-500" />
          <span className="text-amber-600 text-[10px] font-black hidden sm:inline">متوقفة مؤقتًا</span>
        </div>
      )}

      {/* Saved flash — brief confirmation that the local draft autosave just ran. */}
      {savedFlash && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 border border-sky-200 bg-sky-50 animate-in fade-in duration-300 text-sky-600">
          <Check className="w-3 h-3" />
          <span className="text-[10px] font-black hidden sm:inline">محفوظ</span>
        </div>
      )}

      {/* Average score — hidden on mobile */}
      {results.length > 0 && (
        <div className="hidden sm:block text-center flex-shrink-0">
          <div className="font-black text-brand-600 text-lg ltr-num">{avgScore}%</div>
          <div className="text-gray-400 text-[10px]">متوسط</div>
        </div>
      )}

      {/* Start */}
      {!running && (
        <button
          onClick={onStart}
          className="font-black text-white text-xs px-3 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#16A34A,#22C55E)', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}
        >
          ▶ ابدأ
        </button>
      )}

      {/* Kid status indicator — shows when kid is active or done */}
      {kidStatus && kidStatus.exerciseId === activeExerciseId && (
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 border animate-in fade-in duration-300 ${
            kidStatus.status === 'done'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
          title={kidStatus.status === 'done' ? 'الطفل أنهى التمرين' : 'الطفل يؤدي التمرين الآن'}
        >
          <span className="text-sm">{kidStatus.status === 'done' ? '✅' : '🧒'}</span>
          <span className="text-[10px] font-black hidden sm:inline">
            {kidStatus.status === 'done' ? 'أنهى التمرين' : 'يتفاعل الآن'}
          </span>
        </div>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        title={saveFailed ? 'فشل الحفظ — البيانات محفوظة محليًا مؤقتًا، اضغط لإعادة المحاولة' : undefined}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-black text-xs flex-shrink-0 transition-all active:scale-95 ${
          saveFailed ? 'bg-red-50 text-red-600 border border-red-200' :
          saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
          saving ? 'bg-brand-50 text-gray-400' : 'text-white'
        }`}
        style={!saveFailed && !saved && !saving
          ? { background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', boxShadow: '0 4px 16px rgba(124,92,252,0.35)' }
          : undefined
        }
      >
        <Save className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{saving ? '...' : saveFailed ? '⚠ فشل، أعد المحاولة' : saved ? '✓ محفوظ' : 'حفظ'}</span>
      </button>
    </header>
  )
}
