export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createPendingPayment } from '@/lib/db'
import { getSiteSettings } from '@/lib/site-settings'
import { sendEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'
import { verifyToken } from '@/lib/auth'
import type { PaymentMethod } from '@/lib/types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  fawran:           'فوران (FAWRAN)',
  bank_transfer_qa: 'تحويل بنكي — قطر',
  bank_transfer_tn: 'تحويل بنكي — تونس',
  whatsapp:         'واتساب',
}

const PLAN_LABELS: Record<string, string> = {
  session: 'حصة مفردة',
  weekly:  'الباقة الأسبوعية',
  monthly: 'الباقة الشهرية',
  basic:    'الأساسي',
  standard: 'المتقدم',
  premium:  'المتميز',
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, currency, guestName, guestEmail, guestPhone, method } = body

    // Never trust a client-supplied parentId — derive it from the parent's own
    // session, if any, so a payment can't be linked to someone else's account.
    const cookieStore = await cookies()
    const sessionPayload = await verifyToken(cookieStore.get('parent_token')?.value)
    const parentId = sessionPayload?.role === 'parent' ? sessionPayload.id : undefined

    // Validate required fields
    if (!plan || !currency || !guestName || !guestEmail || !guestPhone || !method) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (!['session', 'weekly', 'monthly', 'basic', 'standard', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'الخطة غير صالحة' }, { status: 400 })
    }
    if (!['QAR', 'TND'].includes(currency)) {
      return NextResponse.json({ error: 'العملة غير صالحة' }, { status: 400 })
    }
    if (!['fawran', 'bank_transfer_qa', 'bank_transfer_tn', 'whatsapp'].includes(method)) {
      return NextResponse.json({ error: 'طريقة الدفع غير صالحة' }, { status: 400 })
    }

    // Fetch current prices and apply discount
    const settings = await getSiteSettings()
    const priceMap: Record<string, { QAR: number; TND: number }> = {
      session: settings.prices.session,
      weekly:  settings.prices.weekly,
      monthly: settings.prices.monthly,
      basic:   settings.prices.session,
      standard:settings.prices.weekly,
      premium: settings.prices.monthly,
    }
    const basePrice = (priceMap[plan] ?? settings.prices.session)[currency as 'QAR' | 'TND']
    const discountPct = settings.discountPct ?? 0
    const amount = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice

    // Create payment record
    const payment = await createPendingPayment({
      parentId: parentId || undefined,
      guestName,
      guestEmail,
      guestPhone,
      plan,
      currency,
      amount,
      method,
      status: 'pending',
    })

    const currencyLabel = currency === 'QAR' ? 'ر.ق' : 'د.ت'
    const planLabel = PLAN_LABELS[plan] ?? plan
    const methodLabel = METHOD_LABELS[method as PaymentMethod] ?? method

    // Send confirmation email to client
    try {
      await sendEmail({
        to: guestEmail,
        subject: `تأكيد طلب الاشتراك — أكاديمية أمين | ${payment.referenceCode}`,
        html: `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>* { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; box-sizing: border-box; } body { margin: 0; padding: 20px; background: #f0f4ff; direction: rtl; }</style>
</head>
<body>
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:#4650e3;padding:32px 24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:800">🌟 أكاديمية أمين الدولية</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">للرياضة المعدلة وعلم النفس • ADHD & Autism</p>
  </div>
  <div style="padding:32px 24px">
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">مرحباً ${esc(guestName)}! 🎉</h2>
    <p style="color:#475569;line-height:1.8">شكراً لاهتمامك بالاشتراك في أكاديمية أمين الدولية. تم استلام طلبك بنجاح وسيتم مراجعته من قِبل فريقنا.</p>
    <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <p style="color:#64748b;margin:0 0 8px;font-size:14px">رمز المرجع الخاص بك</p>
      <p style="color:#4650e3;font-size:28px;font-weight:900;letter-spacing:4px;margin:0;direction:ltr">${payment.referenceCode}</p>
      <p style="color:#94a3b8;font-size:12px;margin:8px 0 0">احتفظ بهذا الرمز للمتابعة</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 0;color:#64748b;font-size:14px">الخطة</td>
        <td style="padding:10px 0;color:#1e293b;font-weight:700;text-align:left">${planLabel}</td>
      </tr>
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 0;color:#64748b;font-size:14px">المبلغ</td>
        <td style="padding:10px 0;color:#1e293b;font-weight:700;text-align:left">${amount} ${currencyLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:14px">طريقة الدفع</td>
        <td style="padding:10px 0;color:#1e293b;font-weight:700;text-align:left">${methodLabel}</td>
      </tr>
    </table>
    <div style="background:#fef9ec;border-right:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin:24px 0">
      <p style="margin:0;color:#92400e;font-size:13px">⚠️ بعد إتمام الدفع، يرجى إرسال إثبات الدفع مع رمز المرجع <strong>${payment.referenceCode}</strong> عبر واتساب أو البريد الإلكتروني.</p>
    </div>
    <p style="color:#64748b;font-size:14px">سيتم تفعيل اشتراكك خلال 24 ساعة من استلام الدفع. للتواصل: <strong>${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}</strong></p>
  </div>
  <div style="background:#f0f4ff;padding:16px 24px;text-align:center">
    <p style="color:#6b7280;font-size:12px;margin:0">Amine Academy — أكاديمية أمين الدولية</p>
  </div>
</div>
</body></html>`,
      })
    } catch (e) {
      console.warn('[payments/create] client email failed:', (e as Error).message)
    }

    // Send notification email to admin
    try {
      const adminEmail = process.env.GMAIL_USER
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `طلب اشتراك جديد — ${guestName} | ${payment.referenceCode}`,
          html: `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>* { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; box-sizing: border-box; } body { margin: 0; padding: 20px; background: #f0f4ff; direction: rtl; }</style>
</head>
<body>
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:#1e293b;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:18px;font-weight:800">🔔 طلب اشتراك جديد</h1>
  </div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">الاسم</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${esc(guestName)}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">البريد</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${esc(guestEmail)}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">الهاتف</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${esc(guestPhone)}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">الخطة</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${planLabel}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">المبلغ</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${amount} ${currencyLabel}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:14px">طريقة الدفع</td><td style="padding:8px 0;color:#1e293b;font-weight:700">${methodLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:14px">رمز المرجع</td><td style="padding:8px 0;color:#4650e3;font-weight:900;font-size:16px">${payment.referenceCode}</td></tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/payments" style="display:inline-block;background:#4650e3;color:white;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px">إدارة المدفوعات</a>
    </div>
  </div>
</div>
</body></html>`,
        })
      }
    } catch (e) {
      console.warn('[payments/create] admin email failed:', (e as Error).message)
    }

    // Telegram notification (non-blocking)
    tg(
      `💳 <b>طلب دفع جديد!</b>\n\n` +
      `👤 ${tgEsc(guestName)}\n` +
      `📧 ${tgEsc(guestEmail)}\n` +
      `📱 ${tgEsc(guestPhone)}\n` +
      `📦 الخطة: ${tgEsc(planLabel)}\n` +
      `💰 المبلغ: ${amount} ${tgEsc(currencyLabel)}\n` +
      `🏦 طريقة الدفع: ${tgEsc(methodLabel)}\n` +
      `🔑 المرجع: <code>${tgEsc(payment.referenceCode)}</code>\n` +
      `🕐 ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Qatar' })}`
    ).catch(() => {})

    return NextResponse.json({
      ok: true,
      referenceCode: payment.referenceCode,
      paymentId: payment.id,
    })
  } catch (e) {
    console.error('[payments/create]', e)
    return NextResponse.json({ error: 'حدث خطأ، يرجى المحاولة مجدداً' }, { status: 500 })
  }
}
