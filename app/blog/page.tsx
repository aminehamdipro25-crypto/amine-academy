import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'مقالات ونصائح | أكاديمية أمين — ADHD والتوحد',
  description: 'مقالات علمية باللغة العربية عن ADHD وطيف التوحد — نصائح عملية للأهل وأحدث أبحاث تعديل السلوك والرياضة المعدلة',
}

const ARTICLES = [
  {
    slug: 'adhd-dopamine-exercise',
    title: 'لماذا الحركة هي أقوى دواء لـ ADHD؟',
    subtitle: 'العلم وراء تأثير التمرين على الدوبامين في الفص الجبهي',
    tag: 'علوم ADHD',
    tagColor: 'bg-blue-100 text-blue-700',
    readTime: '5 دقائق',
    date: 'مايو 2026',
    excerpt: 'يكشف بحث Ratey 2008 (Spark) أن التمرين الجسدي يرفع الدوبامين والنورإبينفرين في الفص الجبهي بنسبة 200% — وهو ما يجعله أداةً علاجيةً حقيقية للتركيز لا مجرد نشاط جانبي. إليك كيف نُطبّق هذا علمياً في كل جلسة.',
    icon: '🧠',
  },
  {
    slug: 'zone-of-regulation-guide',
    title: 'دليل الأهل لـ Zone of Regulation',
    subtitle: 'كيف تُعلّم طفلك التعرف على مشاعره وتنظيمها',
    tag: 'تعديل السلوك',
    tagColor: 'bg-emerald-100 text-emerald-700',
    readTime: '7 دقائق',
    date: 'مايو 2026',
    excerpt: 'نظام المناطق الأربع لـ Kuypers (2011) من أكثر الأدوات العلمية فاعلية لمساعدة الأطفال على التعرف على حالتهم الانفعالية — الأزرق (هادئ)، الأخضر (مستعد)، الأصفر (متنبه)، الأحمر (مفعم). تعلم كيف تُطبّقه في البيت اليوم.',
    icon: '🌈',
  },
  {
    slug: 'adhd-homework-strategies',
    title: '5 استراتيجيات علمية لإنهاء الواجبات مع طفل ADHD',
    subtitle: 'لا صراخ، لا دموع — فقط أدوات من علم النفس',
    tag: 'نصائح الأهل',
    tagColor: 'bg-amber-100 text-amber-700',
    readTime: '6 دقائق',
    date: 'أبريل 2026',
    excerpt: 'الخطأ الأكبر هو مطالبة الطفل بالجلوس ساعة متواصلة للمذاكرة. دماغ ADHD يحتاج نظام Pomodoro معدّل: 10 دقائق تركيز + 3 دقائق حركة. تعرّف على الاستراتيجيات الخمس التي تحوّل الواجب من معركة إلى روتين.',
    icon: '📚',
  },
  {
    slug: 'autism-sensory-toolkit',
    title: 'العدة الحسية للطفل التوحدي — 12 أداة عملية',
    subtitle: 'ما هو البروفيل الحسي وكيف تبني بيئة مناسبة لطفلك',
    tag: 'طيف التوحد',
    tagColor: 'bg-purple-100 text-purple-700',
    readTime: '8 دقائق',
    date: 'أبريل 2026',
    excerpt: 'نظرية التكامل الحسي لـ Jean Ayres تُوضّح أن كثيراً من سلوكيات الطفل التوحدي هي محاولات للتنظيم الذاتي. إليك 12 أداة تساعد على تحقيق هذا التنظيم في المنزل والمدرسة.',
    icon: '🌊',
  },
  {
    slug: 'peers-social-skills',
    title: 'PEERS: الطريقة العلمية لتعليم المهارات الاجتماعية',
    subtitle: 'برنامج University of California المعتمد عالمياً لـ ADHD والتوحد',
    tag: 'مهارات اجتماعية',
    tagColor: 'bg-pink-100 text-pink-700',
    readTime: '5 دقائق',
    date: 'مارس 2026',
    excerpt: 'دراسة Laugeson 2014 أثبتت أن PEERS يُحسّن المهارات الاجتماعية بنسبة 88% — الأعلى بين كل البرامج المُختبَرة. تعرّف على أهم مبادئه التي نُطبّقها في أكاديمية أمين.',
    icon: '🤝',
  },
  {
    slug: 'adhd-sleep-routine',
    title: 'ADHD والنوم: لماذا ينام طفلك متأخراً؟',
    subtitle: 'العلاقة بين الدوبامين وإيقاع الساعة البيولوجية',
    tag: 'نوم وروتين',
    tagColor: 'bg-indigo-100 text-indigo-700',
    readTime: '5 دقائق',
    date: 'مارس 2026',
    excerpt: '75% من أطفال ADHD يعانون من صعوبة النوم — وهي ليست عناداً بل فيزيولوجيا. تأخر إفراز الميلاتونين مرتبط مباشرة بالجهاز الدوباميني. اكتشف بروتوكول النوم الذي يُطبّقه الأستاذ أمين.',
    icon: '🌙',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-brand-900 text-white py-14 px-6 text-center">
        <Link href="/" className="inline-block text-white/70 hover:text-white text-sm mb-6 transition-colors">← الرئيسية</Link>
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-4 text-sm">
          📚 مقالات علمية باللغة العربية
        </div>
        <h1 className="font-black text-4xl text-white mb-3">موارد ADHD والتوحد</h1>
        <p className="text-white/70 max-w-xl mx-auto text-lg">
          مقالات علمية موثّقة للأهل والمختصين — مبنية على أحدث أبحاث علم الأعصاب والسلوك
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Featured */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm mb-8">
          <div className="bg-gradient-to-l from-brand-600 to-brand-800 p-6 text-white">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">مقال مميز</span>
            <h2 className="font-black text-2xl mt-3 mb-2">{ARTICLES[0].title}</h2>
            <p className="text-white/80 text-sm">{ARTICLES[0].excerpt}</p>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{ARTICLES[0].date}</span>
              <span>•</span>
              <span>{ARTICLES[0].readTime} قراءة</span>
            </div>
            <span className="text-brand-600 font-bold text-sm hover:underline cursor-pointer">اقرأ المقال ←</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ARTICLES.slice(1).map(a => (
            <div key={a.slug} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.tagColor}`}>{a.tag}</span>
                  <span className="text-3xl">{a.icon}</span>
                </div>
                <h3 className="font-black text-gray-900 text-lg leading-tight mb-2">{a.title}</h3>
                <p className="text-gray-500 text-xs mb-3">{a.subtitle}</p>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{a.excerpt}</p>
              </div>
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{a.date}</span>
                  <span>•</span>
                  <span>{a.readTime}</span>
                </div>
                <span className="text-brand-600 text-xs font-bold">اقرأ ←</span>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 bg-brand-950 rounded-3xl p-8 text-center text-white">
          <h2 className="font-black text-2xl mb-3">اشترك في النشرة العلمية</h2>
          <p className="text-white/70 mb-6 text-sm">مقال واحد كل أسبوع — مبني على أبحاث وقابل للتطبيق فوراً</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              dir="rtl"
            />
            <button className="bg-brand-500 hover:bg-brand-400 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors">
              اشترك
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
