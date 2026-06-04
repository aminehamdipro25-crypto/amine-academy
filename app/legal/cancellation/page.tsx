import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'سياسة الإلغاء والاسترداد | أكاديمية أمين',
}

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-brand-900 text-white py-12 px-6 text-center">
        <Link href="/" className="inline-block text-white/70 hover:text-white text-sm mb-6 transition-colors">← العودة للرئيسية</Link>
        <h1 className="font-black text-3xl mb-2">سياسة الإلغاء والاسترداد</h1>
        <p className="text-white/70">آخر تحديث: يونيو 2026</p>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-800 text-sm leading-relaxed font-medium">
            نفهم أن الظروف تتغير. سياستنا مبنية على الشفافية الكاملة والعدل للطرفين.
          </p>
        </div>

        {[
          {
            title: 'إلغاء الجلسة الفردية',
            color: 'border-green-200',
            rows: [
              ['قبل 24 ساعة أو أكثر', 'مجاناً — يُضاف الرصيد للجلسة القادمة', 'text-green-700'],
              ['بين 2 و 24 ساعة', 'رسوم إدارية 25% من قيمة الجلسة', 'text-amber-700'],
              ['أقل من 2 ساعة أو عدم الحضور', 'تُخصَم الجلسة كاملة من الاشتراك', 'text-red-700'],
            ],
          },
          {
            title: 'إلغاء الاشتراك الشهري',
            color: 'border-purple-200',
            rows: [
              ['خلال أول 7 أيام (بدون جلسات)', 'استرداد كامل 100%', 'text-green-700'],
              ['خلال أول 7 أيام (بعد جلسة واحدة)', 'استرداد منقوص منه تكلفة الجلسة', 'text-amber-700'],
              ['بعد 7 أيام', 'لا استرداد للشهر الجاري — يستمر حتى نهايته', 'text-red-700'],
              ['الإلغاء للشهر القادم', 'في أي وقت قبل تاريخ التجديد', 'text-green-700'],
            ],
          },
        ].map(block => (
          <div key={block.title} className={`bg-white rounded-2xl border-2 ${block.color} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">{block.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {block.rows.map(([when, what, color]) => (
                <div key={when} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-sm text-gray-600 flex-1">{when}</span>
                  <span className={`text-sm font-bold flex-1 ${color}`}>{what}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-3">حالات الاسترداد الكامل التلقائي</h2>
          <ul className="space-y-2">
            {[
              'انقطاع تقني من جانب المنصة يمنع إجراء الجلسة',
              'غياب الأستاذ دون إشعار مسبق',
              'حالات طارئة موثّقة (مرض، وفاة في العائلة)',
              'خلل تقني مستمر لأكثر من 3 جلسات متتالية',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-3">كيفية طلب الاسترداد</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'تواصل معنا عبر واتساب أو البريد الإلكتروني' },
              { step: '2', text: 'أرسل رقم حسابك وسبب طلب الاسترداد' },
              { step: '3', text: 'سنرد خلال 24 ساعة عمل' },
              { step: '4', text: 'يُعالَج الاسترداد خلال 5-7 أيام عمل' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">{step}</div>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <a href="https://wa.me/97430653759" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors">
              واتساب
            </a>
            <a href="mailto:amine.hamdi.pro25@gmail.com"
              className="flex items-center justify-center gap-2 bg-brand-50 text-brand-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-100 transition-colors">
              البريد الإلكتروني
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
