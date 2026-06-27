import nodemailer from 'nodemailer'
import { GAME_LABELS_AR } from './constants'

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

export function appointmentReminderEmail(
  parentName: string,
  when: 'today' | 'tomorrow',
  date: string,
  timeSlot: string,
  type: string,
  meetingUrl: string
): string {
  const typeAr: Record<string, string> = {
    assessment: 'جلسة تقييمية', followup: 'جلسة متابعة',
    emergency: 'استشارة طارئة', consultation: 'استشارة للوالدين',
    training: 'جلسة تدريبية مكثفة', review: 'مراجعة البرنامج',
  }
  const whenText = when === 'today' ? 'اليوم' : 'غداً'
  const whenEmoji = when === 'today' ? '🔔' : '📅'

  return wrap('#7C5CFC', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">${whenEmoji} تذكير بموعد جلستك ${whenText}</h2>
    <p style="color:#475569;line-height:1.8">السيد/ة ${parentName}، لديك جلسة مع الأستاذ أمين <strong>${whenText}</strong>.</p>

    <div style="background:#F3EEFF;border-right:4px solid #7C5CFC;padding:20px;border-radius:12px;margin:24px 0">
      <p style="margin:0 0 10px;color:#5A32D9;font-size:16px;font-weight:800">${typeAr[type] || type}</p>
      <p style="margin:0 0 6px;color:#374151">📅 التاريخ: <strong>${date}</strong></p>
      <p style="margin:0;color:#374151">⏰ الوقت: <strong style="direction:ltr;display:inline-block">${timeSlot}</strong></p>
    </div>

    <div style="background:#F0FFF4;border-right:4px solid #4ade80;padding:16px;border-radius:12px;margin:20px 0">
      <p style="margin:0 0 8px;color:#166534;font-weight:800;font-size:14px">📋 كيف تنضم للجلسة:</p>
      <ol style="margin:0;padding-right:20px;color:#374151;font-size:14px;line-height:2">
        <li>افتح بوابتك على <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.com'}/parent/appointments" style="color:#7C5CFC;font-weight:700">أكاديمية أمين</a></li>
        <li>اضغط زر <strong>"انضم الآن"</strong> الذي سيظهر أخضر اللون عند وقت الجلسة</li>
        <li>ستفتح المكالمة تلقائياً في المتصفح — <strong>لا حاجة لأي برنامج</strong></li>
      </ol>
    </div>

    <div style="text-align:center;margin:28px 0">
      <a href="${meetingUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C5CFC,#9A7BFD);color:white;text-decoration:none;font-size:16px;font-weight:800;padding:14px 36px;border-radius:14px;letter-spacing:0.3px">
        🎥 رابط الجلسة المباشر
      </a>
      <p style="color:#9CA3AF;font-size:12px;margin:10px 0 0">يمكن فتحه من المتصفح مباشرة بدون أي تحميل</p>
    </div>

    <div style="background:#FFFBEB;border-right:4px solid #F59E0B;padding:12px 16px;border-radius:8px">
      <p style="margin:0;color:#92400E;font-size:13px">⚠️ يُرجى الانضمام قبل الموعد بـ 5 دقائق وتجهيز الطفل في مكان هادئ.</p>
    </div>
  `)
}

function escHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function newMessageAdminEmail(senderName: string, preview: string): string {
  return wrap('#7C5CFC', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">💬 رسالة جديدة من ${escHtml(senderName)}</h2>
    <div style="background:#F3EEFF;border-right:4px solid #7C5CFC;padding:16px;border-radius:8px;margin:16px 0">
      <p style="margin:0;color:#374151;line-height:1.8;white-space:pre-wrap">${escHtml(preview)}</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.com'}/dashboard/messages"
        style="display:inline-block;background:#7C5CFC;color:white;text-decoration:none;font-size:15px;font-weight:700;padding:12px 32px;border-radius:12px">
        فتح المحادثة
      </a>
    </div>
  `)
}

export function newMessageParentEmail(specialistName: string, preview: string): string {
  return wrap('#5b6ef2', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px">💬 رسالة جديدة من ${escHtml(specialistName)}</h2>
    <div style="background:#f0f4ff;border-right:4px solid #5b6ef2;padding:16px;border-radius:8px;margin:16px 0">
      <p style="margin:0;color:#374151;line-height:1.8;white-space:pre-wrap">${escHtml(preview)}</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.com'}/parent/chat"
        style="display:inline-block;background:#5b6ef2;color:white;text-decoration:none;font-size:15px;font-weight:700;padding:12px 32px;border-radius:12px">
        فتح المحادثة
      </a>
    </div>
  `)
}

export function weeklyProgressEmail(
  parentName: string,
  studentProgress: Array<{
    student: { firstName: string; lastName: string; diagnosis: string }
    history: { totalPlays: number; totalMinutes: number; byWeek: { week: string; gamesPlayed: number; avgScore: number }[]; byGame: Record<string, { plays: number; avgScore: number }> }
  }>
): string {
  const studentsHtml = studentProgress.map(({ student, history }) => {
    const thisWeek = history.byWeek[history.byWeek.length - 1]
    const lastWeek = history.byWeek[history.byWeek.length - 2]
    const improvement = thisWeek && lastWeek
      ? thisWeek.avgScore - lastWeek.avgScore
      : 0
    const topGames = Object.entries(history.byGame)
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, 3)

    const bestGame = Object.entries(history.byGame)
      .sort((a, b) => b[1].avgScore - a[1].avgScore)[0]

    let highlight: string | null = null
    if (bestGame && bestGame[1].avgScore >= 70 && bestGame[1].plays >= 2) {
      highlight = `🌟 نقطة قوة ${student.firstName}: <strong>${GAME_LABELS_AR[bestGame[0]] ?? bestGame[0]}</strong> بمتوسط ${bestGame[1].avgScore}% على مدى ${bestGame[1].plays} محاولة!`
    } else if (improvement > 0) {
      highlight = `📈 تحسّن أداء ${student.firstName} بنسبة ${improvement}% هذا الأسبوع — استمروا بهذا الزخم!`
    } else if (thisWeek?.gamesPlayed) {
      highlight = `💪 لعب ${student.firstName} ${thisWeek.gamesPlayed} تمرين هذا الأسبوع — الاستمرارية هي الأهم!`
    }

    return `
      <div style="background:#f8faff;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0">
        <h3 style="color:#1e293b;margin:0 0 12px;font-size:16px;font-weight:800">
          ${student.firstName} ${student.lastName}
          <span style="font-size:12px;color:#64748b;font-weight:400;margin-right:8px">${student.diagnosis}</span>
        </h3>
        ${highlight ? `
        <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:10px;padding:12px 16px;margin-bottom:16px">
          <p style="margin:0;color:#92400e;font-size:14px;font-weight:700">${highlight}</p>
        </div>` : ''}
        <div style="display:flex;gap:16px;margin-bottom:16px">
          <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #e2e8f0">
            <div style="font-size:24px;font-weight:900;color:#5b6ef2">${thisWeek?.gamesPlayed ?? 0}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">لعبة هذا الأسبوع</div>
          </div>
          <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #e2e8f0">
            <div style="font-size:24px;font-weight:900;color:${improvement >= 0 ? '#16a34a' : '#dc2626'}">${improvement >= 0 ? '+' : ''}${improvement}%</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">تحسن الأداء</div>
          </div>
          <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #e2e8f0">
            <div style="font-size:24px;font-weight:900;color:#d97706">${history.totalMinutes}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">دقيقة إجمالي</div>
          </div>
        </div>
        ${topGames.length > 0 ? `
        <div>
          <p style="color:#64748b;font-size:12px;font-weight:700;margin:0 0 8px">الألعاب الأكثر ممارسة:</p>
          ${topGames.map(([gameId, data]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:white;border-radius:6px;margin-bottom:4px;border:1px solid #e2e8f0">
              <span style="color:#334155;font-size:13px">${GAME_LABELS_AR[gameId] ?? gameId}</span>
              <span style="color:#5b6ef2;font-size:12px;font-weight:700">${data.avgScore}% متوسط • ${data.plays} مرة</span>
            </div>
          `).join('')}
        </div>` : '<p style="color:#94a3b8;font-size:13px">لا يوجد نشاط هذا الأسبوع</p>'}
      </div>
    `
  }).join('')

  return wrap('#5b6ef2', `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px">تقرير الأسبوع — ${parentName} 📊</h2>
    <p style="color:#475569;font-size:14px;margin:0 0 20px">إليك ملخص نشاط طفلك خلال الأسبوع الماضي في أكاديمية أمين:</p>
    ${studentsHtml}
    <div style="background:#f0fdf4;border-right:4px solid #4ade80;padding:12px 16px;border-radius:8px;margin-top:20px">
      <p style="margin:0;color:#166534;font-size:13px">💡 <strong>نصيحة الأسبوع:</strong> الاستمرارية هي مفتاح التطور — حاول ممارسة تمرين واحد يومياً مع طفلك.</p>
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:16px">
      لمشاهدة التفاصيل الكاملة،
      <a href="${process.env.NEXTAUTH_URL || 'https://amine-academy.com'}/parent/progress" style="color:#5b6ef2;font-weight:700">افتح لوحة التطور</a>
    </p>
  `)
}
