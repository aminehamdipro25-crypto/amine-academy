import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | أكاديمية أمين',
  description: 'سياسة خصوصية أكاديمية أمين الدولية — كيف نجمع بياناتك ونحمي خصوصيتك',
}

const sections = [
  {
    title: '1. ما البيانات التي نجمعها؟',
    items: [
      { label: 'بيانات ولي الأمر', detail: 'الاسم، البريد الإلكتروني، رقم الهاتف، البلد — لإدارة الحساب والتواصل.' },
      { label: 'بيانات الطفل', detail: 'الاسم، تاريخ الميلاد، التشخيص الطبي، الملف الحسي — لتخصيص البرنامج.' },
      { label: 'بيانات الجلسات', detail: 'سجلات الحضور، ملاحظات التقدم، تقييمات السلوك — لمتابعة التطور.' },
      { label: 'بيانات الاستخدام', detail: 'الصفحات المزارة، مدة الجلسة، الجهاز المستخدم — لتحسين المنصة.' },
    ],
  },
  {
    title: '2. كيف نستخدم بياناتك؟',
    items: [
      { label: 'تقديم الخدمة', detail: 'تشغيل المنصة، جدولة الجلسات، إرسال التقارير.' },
      { label: 'التواصل', detail: 'تأكيد المواعيد، التذكيرات، الإشعارات المهمة.' },
      { label: 'التحسين المستمر', detail: 'تحليل الاستخدام لتطوير المنصة والبرامج.' },
      { label: 'الالتزام القانوني', detail: 'الامتثال للمتطلبات القانونية في قطر وتونس.' },
    ],
  },
  {
    title: '3. حماية بيانات الأطفال',
    content: `نُولي حماية بيانات الأطفال الأولوية القصوى:

• لا نجمع بيانات من الأطفال مباشرةً — جميع البيانات تمر عبر ولي الأمر.
• لا تُستخدم صور أو تسجيلات الأطفال لأي غرض إعلاني.
• يمكن لولي الأمر طلب حذف جميع بيانات طفله في أي وقت.
• لا يُشارك أي تشخيص طبي مع أطراف ثالثة دون موافقة صريحة.`,
  },
  {
    title: '4. مشاركة البيانات',
    content: `نلتزم بعدم بيع أو تأجير بياناتك. قد نشارك بيانات محدودة في الحالات التالية:

• مزودو الخدمة التقنية (Upstash للتخزين) — فقط ما يلزم لتشغيل المنصة.
• خدمة البريد الإلكتروني (Gmail/Resend) — لإرسال الإشعارات.
• متطلبات قانونية — عند صدور أمر قضائي نافذ.`,
  },
  {
    title: '5. أمان البيانات',
    content: `• تُشفَّر جميع البيانات أثناء النقل (HTTPS/TLS).
• كلمات المرور مُخزَّنة بتشفير scrypt لا يمكن عكسه.
• الوصول للبيانات الحساسة مقيّد بصلاحيات صارمة.
• لا تُخزَّن بيانات الدفع على خوادمنا مباشرةً.`,
  },
  {
    title: '6. ملفات تعريف الارتباط (Cookies)',
    content: `نستخدم ملفات تعريف الارتباط للأغراض التالية:
• جلسة تسجيل الدخول (ضرورية للخدمة).
• تذكّر تفضيلاتك (العملة، اللغة).
• تحليلات الاستخدام عبر Google Analytics (مجهولة الهوية).

يمكنك تعطيل Cookies غير الضرورية من إعدادات متصفحك.`,
  },
  {
    title: '7. حقوقك',
    content: `كولي أمر مسجّل، تحق لك:
• حق الاطلاع على جميع بياناتك المحفوظة.
• حق التصحيح لأي بيانات غير دقيقة.
• حق الحذف الكامل ("الحق في النسيان").
• حق نقل البيانات بصيغة قابلة للقراءة.
• حق الاعتراض على استخدام بياناتك لأغراض التسويق.

لممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني.`,
  },
  {
    title: '8. مدة الاحتفاظ بالبيانات',
    content: `• بيانات الحساب: تُحفظ طوال فترة الاشتراك النشط + سنة واحدة.
• سجلات الجلسات والتقارير: 3 سنوات (قد يُطلبها في متابعة التطور الدراسي).
• بيانات الاستخدام: 12 شهراً.
• عند طلب الحذف: نُنهي جميع البيانات خلال 30 يوماً.`,
  },
  {
    title: '9. التواصل معنا',
    content: `لأي استفسار بشأن الخصوصية:
البريد الإلكتروني: amine.hamdi.pro25@gmail.com
واتساب: +974 3065 3759`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-brand-900 text-white py-12 px-6 text-center">
        <Link href="/" className="inline-block text-white/70 hover:text-white text-sm mb-6 transition-colors">← العودة للرئيسية</Link>
        <h1 className="font-black text-3xl mb-2">سياسة الخصوصية</h1>
        <p className="text-white/70">آخر تحديث: يونيو 2026</p>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
          <p className="text-green-800 text-sm leading-relaxed">
            <strong>التزامنا:</strong> خصوصية طفلك وعائلتك مقدّسة بالنسبة لنا. نجمع أقل ما يلزم، ونحميه بأعلى المعايير، ولا نبيعه أبداً.
          </p>
        </div>
        <div className="space-y-6">
          {sections.map(s => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 text-lg mb-3">{s.title}</h2>
              {'items' in s ? (
                <div className="space-y-3">
                  {s.items!.map(item => (
                    <div key={item.label} className="flex gap-3">
                      <span className="font-bold text-brand-700 text-sm flex-shrink-0 w-36">{item.label}</span>
                      <span className="text-gray-600 text-sm leading-relaxed">{item.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
