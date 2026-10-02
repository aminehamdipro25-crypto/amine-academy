'use client'
import { useState } from 'react'
import { Compass, Wand2 } from 'lucide-react'
import BehavioralCompass from '@/components/dashboard/BehavioralCompass'
import BehavioralToolGenerator from '@/components/dashboard/BehavioralToolGenerator'

type Mode = 'compass' | 'generator'

export default function BehavioralHub() {
  const [mode, setMode] = useState<Mode>('compass')
  return (
    <div className="space-y-5">
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2 print:hidden" dir="rtl">
        <button onClick={() => setMode('compass')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black border transition ${mode === 'compass' ? 'bg-brand-500 text-white border-brand-500 shadow-brand-sm' : 'bg-white text-slate-500 border-slate-200'}`}>
          <Compass className="w-4 h-4" /> البوصلة الجاهزة
        </button>
        <button onClick={() => setMode('generator')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black border transition ${mode === 'generator' ? 'bg-brand-500 text-white border-brand-500 shadow-brand-sm' : 'bg-white text-slate-500 border-slate-200'}`}>
          <Wand2 className="w-4 h-4" /> مولّد الأدوات
        </button>
      </div>
      {mode === 'compass' ? <BehavioralCompass /> : <BehavioralToolGenerator />}
    </div>
  )
}
