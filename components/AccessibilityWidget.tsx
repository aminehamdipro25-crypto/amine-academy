'use client'
import { useState } from 'react'
import { Accessibility, X } from 'lucide-react'
import { useAccessibility } from '@/lib/accessibility'

const OPTIONS = [
  { key: 'reducedMotion', label: 'تقليل الحركة والتأثيرات', icon: '🎞️' },
  { key: 'dyslexiaFont',  label: 'خط أسهل في القراءة (عسر القراءة)', icon: '🔤' },
  { key: 'highContrast',  label: 'تباين عالي للألوان', icon: '🌓' },
] as const

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const { reducedMotion, dyslexiaFont, highContrast, setPref } = useAccessibility()
  const values = { reducedMotion, dyslexiaFont, highContrast }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="إعدادات إمكانية الوصول"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all"
      >
        {open ? <X className="w-5 h-5" /> : <Accessibility className="w-6 h-6" />}
      </button>

      {open && (
        <div
          dir="rtl"
          className="fixed bottom-20 right-6 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 a11y-panel"
        >
          <h3 className="font-black text-gray-900 text-sm mb-3">إمكانية الوصول</h3>
          <div className="flex flex-col gap-2">
            {OPTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setPref(key, !values[key])}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-right transition-colors"
                style={values[key]
                  ? { background: '#EEF2FF', color: '#4338CA', border: '1.5px solid #C7D2FE' }
                  : { background: '#F9FAFB', color: '#374151', border: '1.5px solid #F3F4F6' }}
              >
                <span className="text-base">{icon}</span>
                <span className="flex-1">{label}</span>
                <span
                  className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                  style={{ background: values[key] ? '#4F46E5' : '#D1D5DB' }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ right: values[key] ? 2 : 18 }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
