'use client'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import { Languages, GraduationCap, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'

// Prominent landing block announcing the languages track, so the academy visibly
// teaches languages too (not only ADHD/autism therapy).
export default function LanguagesPromoSection() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const Fwd = rtl ? ArrowLeft : ArrowRight

  return (
    <section className="py-14 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden p-8 sm:p-12"
          style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, #7C5CFC 55%, ${PURPLE2} 100%)` }}>
          {/* glow */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0%, transparent 45%)' }} />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full mb-4 bg-white/15 text-white border border-white/25">
                <Sparkles className="w-3.5 h-3.5" /> {pickLang(lang, 'جديد', 'New', 'Nouveau')} · CEFR A1→C2
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}
              </h2>
              <p className="text-white/85 text-base sm:text-lg mt-3 leading-relaxed font-medium">
                {pickLang(lang,
                  'الأكاديمية توسّعت — تعلّم اللغات بمنهجيّة عالميّة مع أساتذة مختصّين، ومسار شخصي وفق الإطار الأوروبي المرجعي. نبدأ بالفرنسيّة.',
                  'The academy has grown — learn languages the world-class way with specialist teachers and a personalised CEFR path. Starting with French.',
                  'L’académie s’agrandit — apprenez les langues avec des professeurs spécialisés et un parcours CEFR personnalisé. Nous commençons par le français.')}
              </p>

              {/* flags */}
              <div className="flex items-center gap-2 mt-5 text-2xl">
                <span>🇫🇷</span>
                <span className="opacity-50 text-base font-bold text-white ms-1">{pickLang(lang, 'ولغات أخرى قريباً', 'more soon', 'et bientôt plus')} 🇬🇧 🇪🇸 🇩🇪 🇮🇹</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Link href="/languages" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white font-extrabold text-sm shadow-lg hover:scale-[1.03] transition" style={{ color: PURPLE }}>
                  <Languages className="w-4 h-4" /> {pickLang(lang, 'اكتشف أمين للّغات', 'Explore Amine Languages', 'Découvrir Amine Langues')} <Fwd className="w-4 h-4" />
                </Link>
                <Link href="/languages/placement" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/15 border border-white/30 text-white font-bold text-sm hover:bg-white/25 transition">
                  <GraduationCap className="w-4 h-4" /> {pickLang(lang, 'قيّم مستواك مجاناً', 'Test your level — free', 'Testez votre niveau')}
                </Link>
              </div>
            </div>

            {/* Visual card */}
            <div className="hidden md:block">
              <div className="rounded-3xl bg-white/95 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>🇫🇷</div>
                  <div>
                    <p className="font-black text-slate-800">{pickLang(lang, 'الفرنسيّة', 'French', 'Français')}</p>
                    <p className="text-xs text-slate-400">{pickLang(lang, 'من A1 إلى C2', 'From A1 to C2', 'De A1 à C2')}</p>
                  </div>
                  <span className="ms-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: PURPLE }}>{pickLang(lang, 'متاح', 'Live', 'Disponible')}</span>
                </div>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lv, i) => (
                  <div key={lv} className="flex items-center gap-3 py-1.5">
                    <span className="w-8 text-xs font-black" style={{ color: PURPLE }}>{lv}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${100 - i * 14}%`, background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
