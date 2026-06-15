'use client'
import { useState } from 'react'
import { Brain, AlertCircle } from 'lucide-react'

interface AIPatternAnalysisProps {
  studentId: string
  studentName: string
  diagnosis: string
}

export default function AIPatternAnalysis({ studentId, studentName, diagnosis }: AIPatternAnalysisProps) {
  const [open, setOpen] = useState(false)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/admin/ai-analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          abcLog: [],
          sessionResults: [],
          sessionCount: 0,
          diagnosis,
          observations,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء التحليل')
      } else {
        setAnalysis(data.analysis)
      }
    } catch {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="font-black text-gray-900 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-purple-500" />
          تحليل أنماط الجلسات بالذكاء الاصطناعي
        </h2>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-50">
          <div className="pt-4">
            <p className="text-xs text-gray-500 mb-2">
              أدخل ملاحظات سلوكية من الجلسات الأخيرة (السلوكيات الملحوظة، المثيرات، ردود الفعل)
            </p>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={5}
              placeholder={`مثال: خلال جلسة ${studentName} لاحظت أن الطفل يُظهر اندفاعية عند تغيير النشاط فجأة. التمارين الحركية سارت بشكل جيد بينما تمارين الانتباه كانت صعبة. المزاج عام إيجابي في بداية الجلسة ثم تراجع بعد 20 دقيقة...`}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none resize-none"
              dir="rtl"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !observations.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                🧠 تحليل أنماط الجلسات بالذكاء الاصطناعي
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          {analysis && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-black text-purple-700">تحليل الذكاء الاصطناعي — {studentName} ({diagnosis})</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" dir="rtl">
                {analysis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
