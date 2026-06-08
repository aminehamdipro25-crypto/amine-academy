import nodemailer from 'nodemailer'

let _transport: nodemailer.Transporter | null = null

function getGmailTransport(): nodemailer.Transporter {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return _transport
}

interface SendEmailOpts {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    await getGmailTransport().sendMail({
      from: `"أكاديمية أمين" <${process.env.GMAIL_USER}>`,
      to, subject, html, text,
    })
    return { provider: 'gmail' }
  }
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'Amine Academy <noreply@amine-academy.com>', to: [to], subject, html }),
    })
    return { provider: 'resend' }
  }
  throw new Error('No email provider configured')
}

// ── Email Templates ───────────────────────────────────────────

function wrap(color: string, content: string): string {
  return `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>
  * { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; box-sizing: border-box; }
  body { margin: 0; padding: 20px; background: #f0f4ff; direction: rtl; }
</style></head>
<body>
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:${color};padding:32px 24px;text-align:center">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800">🌟 أكاديمية أمين الدولية</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">للرياضة المعدلة وعلم النفس • ADHD & Autism</p>
    </div>
    <div style="padding:32px 24px">${content}</div>
    <div style="background:#f0f4ff;padding:16px 24px;text-align:center">
      <p style="color:#6b7280;font-size:12px;margin:0">Amine Academy — أكاديمية أمين الدولية</p>
    </div>
  </div>
</body></html>`
}

export function welcomeParentEmail(parentName: string, activationCode: string): string {
  return wrap('#5b6ef2', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">مرحباً ${parentName}! 🎉</h2>
    <p style="color:#475569;line-height:1.8">شكراً لتسجيلك في أكاديمية أمين الدولية. نحن هنا لدعم طفلك في رحلته نحو التطور.</p>
    <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <p style="color:#64748b;margin:0 0 8px;font-size:14px">رمز التفعيل الخاص بك</p>
      <p style="color:#5b6ef2;font-size:36px;font-weight:900;letter-spacing:8px;margin:0;direction:ltr">${activationCode}</p>
      <p style="color:#94a3b8;font-size:12px;margin:8px 0 0">صالح لمدة 24 ساعة</p>
    </div>
    <p style="color:#64748b;font-size:14px">إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>
  `)
}

export function appointmentConfirmEmail(parentName: string, date: string, time: string): string {
  return wrap('#4ade80', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">تم تأكيد موعدك ✅</h2>
    <p style="color:#475569;line-height:1.8">السيد/ة ${parentName}، تم تأكيد موعد المتابعة مع الأستاذ أمين.</p>
    <div style="background:#f0fdf4;border-right:4px solid #4ade80;padding:16px;border-radius:8px;margin:24px 0">
      <p style="margin:0;color:#166534">📅 التاريخ: ${date}</p>
      <p style="margin:8px 0 0;color:#166534">⏰ الوقت: ${time}</p>
    </div>
    <p style="color:#64748b;font-size:14px">سيتواصل معك الأستاذ أمين قبل 30 دقيقة من الموعد.</p>
  `)
}

export function resetPasswordEmail(resetUrl: string): string {
  return wrap('#5b6ef2', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">إعادة تعيين كلمة المرور 🔐</h2>
    <p style="color:#475569;line-height:1.8">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في أكاديمية أمين الدولية.</p>
    <p style="color:#475569;line-height:1.8">انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${resetUrl}"
        style="display:inline-block;background:#5b6ef2;color:white;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.5px">
        إعادة تعيين كلمة المرور
      </a>
    </div>
    <div style="background:#fef9ec;border-right:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin:24px 0">
      <p style="margin:0;color:#92400e;font-size:13px">⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
    </div>
    <p style="color:#64748b;font-size:13px">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان — حسابك بخير.</p>
  `)
}
