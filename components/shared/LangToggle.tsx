'use client'
import { useLang, type Lang } from '@/lib/i18n'

const NEXT_LANG: Record<Lang, Lang> = { ar: 'en', en: 'fr', fr: 'ar' }
const FLAG: Record<Lang, string> = { ar: '🇸🇦', en: '🇬🇧', fr: '🇫🇷' }
const LABEL: Record<Lang, string> = { ar: 'ع', en: 'EN', fr: 'FR' }
const TOOLTIP: Record<Lang, string> = {
  ar: 'التبديل للعربية',
  en: 'Switch to English',
  fr: 'Passer au français',
}

export default function LangToggle({ className = '', variant = 'dark' }: { className?: string; variant?: 'dark' | 'light' }) {
  const { lang, setLang } = useLang()
  const next = NEXT_LANG[lang]
  const colors = variant === 'light'
    ? 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    : 'border-white/30 text-white/80 hover:text-white hover:bg-white/10'
  return (
    <button
      onClick={() => setLang(next)}
      className={`flex items-center gap-1.5 border ${colors} text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${className}`}
      title={TOOLTIP[next]}
    >
      <span className="text-base leading-none">{FLAG[next]}</span>
      <span>{LABEL[next]}</span>
    </button>
  )
}
