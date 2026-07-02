import Link from 'next/link'
import { CheckCircle, MessageCircle, Mail } from 'lucide-react'

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-brand-50 to-white flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-3">تم التسجيل بنجاح! 🎉</h1>
        <p className="text-gray-600 leading-relaxed mb-8">
          شكراً لانضمامك إلى أكاديمية أمين الدولية. أكمل الدفع الآن لتفعيل اشتراكك والحصول على برنامجك المخصص.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-right space-y-4">
          <h2 className="font-black text-gray-900 text-center mb-4">الخطوات التالية</h2>
          {[
            { step: '1', text: 'أكمل الدفع عبر الزر أدناه — اختر الخطة وطريقة الدفع المناسبة', icon: CheckCircle },
            { step: '2', text: 'فعّل حسابك — رمز التفعيل وصلك على بريدك الإلكتروني', icon: Mail },
            { step: '3', text: 'بعد تأكيد الدفع يبدأ الأستاذ أمين في تحديد موعد الجلسة الأولى', icon: MessageCircle },
          ].map(({ step, text, icon: Icon }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">
                {step}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Link href="/checkout"
            className="flex-1 bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 transition-colors text-center text-sm flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            أكمل الدفع الآن
          </Link>
          <Link href="/activate"
            className="flex-1 border-2 border-brand-200 text-brand-700 font-bold py-3 px-4 rounded-xl hover:bg-brand-50 transition-colors text-center text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            تفعيل الحساب فقط
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '97430653759'}?text=${encodeURIComponent('مرحباً الأستاذ أمين، أنا سجّلت للتو في أكاديمية أمين وأنتظر تفعيل اشتراكي.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            تواصل على واتساب
          </a>
          <Link href="/"
            className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-center text-sm">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
