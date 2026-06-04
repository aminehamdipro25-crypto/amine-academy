import { Brain, Dumbbell, LineChart, Calendar, Shield, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
    title: 'تمارين نفسية متخصصة',
    desc: 'برامج علم النفس الرياضي المصممة خصيصاً لتحسين التركيز والتحكم في الاندفاعية وتنظيم المشاعر.',
  },
  {
    icon: Dumbbell,
    color: 'bg-blue-100 text-blue-600',
    title: 'رياضة معدلة (APA)',
    desc: 'تمارين حركية آمنة ومكيّفة حسب الفئة العمرية والتشخيص، تراعي الحساسية الحسية لكل طفل.',
  },
  {
    icon: LineChart,
    color: 'bg-green-100 text-green-600',
    title: 'تتبع التطور باليقين',
    desc: 'تقارير دورية ذكية تقيس تقدم طفلك في التركيز والتوازن والتنسيق الحركي والتفاعل الاجتماعي.',
  },
  {
    icon: Calendar,
    color: 'bg-orange-100 text-orange-600',
    title: 'جدولة مواعيد سهلة',
    desc: 'احجز جلسات المتابعة الفردية مع البروفيسور أمين من أي مكان في العالم.',
  },
  {
    icon: Shield,
    color: 'bg-teal-100 text-teal-600',
    title: 'أمان وخصوصية تامة',
    desc: 'بيانات أطفالك محمية بأعلى معايير الأمان الدولية (COPPA & GDPR compliant).',
  },
  {
    icon: MessageCircle,
    color: 'bg-rose-100 text-rose-600',
    title: 'تواصل مباشر ومستمر',
    desc: 'تواصل مع البروفيسور أمين عبر المنصة لمناقشة تطور طفلك وتعديل البرامج فورياً.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full">
            لماذا أكاديمية أمين؟
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
            منهجية علمية، نتائج حقيقية
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            كل برنامج مصمم بعناية من متخصص يجمع بين الرياضة المعدلة وعلم النفس لتحقيق أفضل نتائج.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title}
              className="card-hover bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-100">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
