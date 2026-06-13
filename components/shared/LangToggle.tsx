'use client'
import { useLang } from '@/lib/i18n'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className={`flex items-center gap-1.5 border border-white/30 text-white/80 hover:text-white hover:bg-white/10 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${className}`}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <span className="text-base leading-none">{lang === 'ar' ? '🇬🇧' : '🇸🇦'}</span>
      <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  )
}
