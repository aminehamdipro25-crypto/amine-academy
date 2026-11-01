'use client'
import { useEffect, useState } from 'react'
import { BellRing, CalendarPlus, Copy, FileSpreadsheet, RefreshCw, Send, ShieldOff } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { EVENING_CHECK_DEFAULT, INVOICE_TITLE_MAX, bidiRuns, buildPayment, parsePayment, type InvoiceInfo, type PaymentForm } from '@/lib/worklog'
import { useWorkLog } from './useWorkLog'
import { Field, Segmented, ghostBtn, inputCls, localToday, primaryBtn } from './ui'
import { notificationState, requestNotifications, showLessonNotification } from './notify'
import { downloadLedgerXlsx } from './exportXlsx'
import { GoogleCalendarSection, NotionSection, TelegramReminderStatus, useIntegrations } from './IntegrationsPanel'

/** Evening hours offered for the check of unmarked lessons. */
const EVENING_TIMES = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00']

const ZONES = ['Asia/Qatar', 'Africa/Tunis', 'Asia/Riyadh', 'Asia/Dubai', 'Africa/Cairo', 'Europe/Paris']

export default function SettingsView() {
  const { settings, saveSettings, data } = useWorkLog()
  const { toast } = useToast()
  const [perm, setPerm] = useState<string>('default')
  const [busy, setBusy] = useState(false)
  const [origin, setOrigin] = useState('')
  const integrations = useIntegrations()

  useEffect(() => { setPerm(notificationState()); setOrigin(window.location.origin) }, [])

  async function save(body: object, msg = 'حُفظ') {
    setBusy(true)
    try { await saveSettings(body); toast(msg) } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  const browserZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
  const zones = [...new Set([settings.timezone, browserZone, ...ZONES].filter(Boolean))]
  const feedUrl = settings.calendarToken ? `${origin}/api/worklog-calendar/${settings.calendarToken}.ics` : ''
  const webcal = feedUrl.replace(/^https?:/, 'webcal:')

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Reminders */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2"><BellRing className="w-5 h-5 text-brand-600" /><h3 className="font-black text-gray-900">التذكيرات</h3></div>
        <p className="text-xs text-gray-500 leading-relaxed">
          <b>(1)</b> إشعار في المتصفح — <b>فقط ما دامت لوحة التحكم مفتوحة</b>؛ إن أغلقتها أو أقفلت الهاتف لا يصل.
          <b> (2)</b> رسالة تيليغرام قبل كل حصة — <b>تصل والهاتف مقفل</b>، وهي التذكير الذي يُعتمد عليه.
          <b> (3)</b> تقويم الهاتف لرؤية كل الحصص في تقويمك.
          <b> (4)</b> ملخّص صباحي بحصص اليوم ومسارها.
        </p>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">1 · إشعارات هذا الجهاز</p>
          {perm === 'unsupported' ? <p className="text-xs text-gray-500">هذا المتصفح لا يدعم الإشعارات — استعمل تقويم الهاتف (2).</p>
            : perm === 'granted' ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-emerald-700">✓ مفعّلة على هذا الجهاز</span>
                <button onClick={() => showLessonNotification('تجربة تذكير', 'هكذا سيظهر التذكير قبل الحصة', 'test')} className={ghostBtn('text-xs')}>
                  <Send className="w-3.5 h-3.5" /> إشعار تجريبي
                </button>
              </div>
            ) : perm === 'denied' ? (
              <p className="text-xs text-rose-700">الإشعارات محجوبة لهذا الموقع — فعّلها من إعدادات المتصفح (رمز القفل بجانب العنوان)، ثم أعد تحميل الصفحة.</p>
            ) : (
              <button onClick={async () => { setPerm(await requestNotifications()) }} className={primaryBtn('text-xs')}>
                <BellRing className="w-4 h-4" /> تفعيل الإشعارات
              </button>
            )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="التذكير الافتراضي للحصص الجديدة">
              {id => (
                <select id={id} className={inputCls} disabled={busy} value={settings.defaultReminderMin === null ? 'none' : String(settings.defaultReminderMin)}
                  onChange={e => save({ defaultReminderMin: e.target.value === 'none' ? null : Number(e.target.value) })}>
                  <option value="none">بلا تذكير</option><option value="15">قبل 15 د</option><option value="30">قبل 30 د</option>
                  <option value="60">قبل ساعة</option><option value="120">قبل ساعتين</option><option value="1440">قبل يوم</option>
                </select>
              )}
            </Field>
            <Field label="مدة الحصة الافتراضية">
              {id => (
                <select id={id} className={inputCls} disabled={busy} value={settings.defaultDurationMin} onChange={e => save({ defaultDurationMin: Number(e.target.value) })}>
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} دقيقة</option>)}
                </select>
              )}
            </Field>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">2 · تذكير تيليغرام قبل كل حصة (يصل والهاتف مقفل)</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">في وقت التذكير المضبوط لكل حصة (الافتراضي أعلاه) تصلك رسالة من بوت المنصة: الطفل، الوقت، السعر، العنوان، رابط الطريق، والهاتف. فحص كل 5 دقائق، فقد تصل متأخرة بضع دقائق — لكن دائماً قبل بدء الحصة.</p>
          <TelegramReminderStatus status={integrations.status} />
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">3 · تقويم الهاتف (لرؤية الحصص في تقويمك)</p>
          {!settings.calendarToken ? (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">رابط سرّي يشترك فيه تقويم هاتفك (iPhone أو Google)، فتظهر كل حصة بعنوانها ورابط الطريق بجانب مواعيدك الأخرى، ويتحدّث تلقائياً. للتذكير نفسه اعتمد على تيليغرام (2): التقويمات المشترَك فيها لا ترنّ بثقة.</p>
              <button disabled={busy} onClick={() => save({ calendar: 'enable' }, 'أُنشئ رابط التقويم')} className={primaryBtn('text-xs')}>
                <CalendarPlus className="w-4 h-4" /> إنشاء رابط التقويم
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <input readOnly value={feedUrl} dir="ltr" className={`${inputCls} text-[11px] font-mono`} aria-label="رابط التقويم" onFocus={e => e.currentTarget.select()} />
                <button onClick={async () => { try { await navigator.clipboard.writeText(feedUrl); toast('نُسخ الرابط') } catch { toast('انسخ الرابط يدوياً', 'info') } }}
                  className={ghostBtn()} aria-label="نسخ"><Copy className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={webcal} className={primaryBtn('text-xs')}><CalendarPlus className="w-4 h-4" /> إضافة إلى تقويم هذا الجهاز</a>
                <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener noreferrer" className={ghostBtn('text-xs')}>Google Calendar</a>
              </div>
              <ul className="text-[11px] text-gray-500 space-y-1 leading-relaxed list-disc pr-4">
                <li><b>iPhone:</b> اضغط «إضافة إلى تقويم هذا الجهاز» ← اشتراك، واختر «تحديث تلقائي: كل ساعة». ليرنّ التقويم أيضاً أطفئ «إزالة التنبيهات» في صفحة الاشتراك.</li>
                <li><b>Android / Google:</b> افتح «Google Calendar» من الحاسوب ← إضافة تقويم ← من رابط. Google يحدّث الاشتراكات ببطء (عدة ساعات حتى يوم) <b>ويتجاهل تنبيهاتها</b> — فهو للعرض فقط.</li>
                <li><b>Notion Calendar:</b> الأسرع والأصح هو قسم «تقويم Google و Notion Calendar» أدناه — يكتب كل حصة فوراً بدل انتظار تحديث الاشتراك.</li>
                <li>الرابط يحوي أسماء العائلات وعناوينها: لا تشاركه. إن تسرّب، أنشئ رابطاً جديداً فيتوقف القديم فوراً.</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => save({ calendar: 'rotate' }, 'رابط جديد — أعد الاشتراك به')} className={ghostBtn('text-xs')}><RefreshCw className="w-3.5 h-3.5" /> رابط جديد</button>
                <button disabled={busy} onClick={() => save({ calendar: 'disable' }, 'أُوقف التقويم')} className={ghostBtn('text-xs text-rose-600')}><ShieldOff className="w-3.5 h-3.5" /> إيقاف</button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">3 · الملخّص الصباحي</p>
            <Segmented size="sm" value={settings.dailyDigest ? 'on' : 'off'} onChange={v => save({ dailyDigest: v === 'on' })}
              options={[{ value: 'on', label: 'مفعّل' }, { value: 'off', label: 'متوقف' }]} />
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">كل صباح (7:00 بتوقيت قطر): حصص اليوم بالترتيب، رابط الطريق لكل منزل، مسار اليوم كاملاً، والمستحقات، وكم يمكنك أن تصرف اليوم إن حدّدت ميزانية (مع الفئات التي اقتربت من سقفها). يصل عبر تيليغرام والبريد المضبوطين في المنصة. لا يُرسَل شيء في يوم بلا حصص ولا ميزانية.</p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">4 · الملخّص الأسبوعي</p>
            <Segmented size="sm" value={settings.weeklyDigest === false ? 'off' : 'on'} onChange={v => save({ weeklyDigest: v === 'on' })}
              options={[{ value: 'on', label: 'مفعّل' }, { value: 'off', label: 'متوقف' }]} />
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">كل أحد (7:15 بتوقيت قطر): الأسبوع الماضي بالأرقام (الحصص والساعات وقيمة العمل والمستلم والمصاريف)، الأسبوع القادم، ومن عليه مبالغ ومنذ متى. عبر تيليغرام والبريد.</p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">5 · التنبيه المسائي</p>
            <Segmented size="sm" value={settings.eveningCheckAt === null ? 'off' : 'on'} onChange={v => save({ eveningCheckAt: v === 'on' ? EVENING_CHECK_DEFAULT : null })}
              options={[{ value: 'on', label: 'مفعّل' }, { value: 'off', label: 'متوقف' }]} />
          </div>
          {settings.eveningCheckAt !== null && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="evening-at" className="text-xs font-bold text-gray-600">يُرسَل بعد الساعة</label>
              <select id="evening-at" disabled={busy} className={`${inputCls} max-w-[7rem] py-1.5`} value={settings.eveningCheckAt ?? EVENING_CHECK_DEFAULT}
                onChange={e => save({ eveningCheckAt: e.target.value }, 'حُفظ وقت التنبيه المسائي')}>
                {[...new Set([settings.eveningCheckAt ?? EVENING_CHECK_DEFAULT, ...EVENING_TIMES])].sort().map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <p className="text-[11px] text-gray-500 leading-relaxed">مرة واحدة في المساء: الحصص التي انتهت وما زالت «مجدولة» — من اليوم ومن أيام سابقة — بقيمتها، لأنها لا تدخل الدخل ولا المستحقات حتى تضغط «تمّت» أو «ألغيت». ومعها ما صرفته اليوم وما بقي من ميزانية الشهر. لا يُرسَل شيء إن كانت كل الحصص محدّدة. عبر تيليغرام والبريد؛ يصل في الوقت الذي تختاره ما دام فحص الخمس دقائق مضبوطاً في GitHub، وإلا فنحو 22:45 بتوقيت قطر.</p>
        </div>
      </section>

      {/* Google Calendar */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-black text-gray-900">📅 تقويم Google و Notion Calendar</h3>
        <GoogleCalendarSection status={integrations.status} reload={integrations.reload} />
      </section>

      {/* Notion */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-black text-gray-900">🗂️ نسخ الحصص إلى نوشن</h3>
        <NotionSection status={integrations.status} reload={integrations.reload} />
        {integrations.error && <p className="text-[11px] text-rose-700">{integrations.error}</p>}
      </section>

      {/* Messages to parents */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-black text-gray-900">✉️ رسائل أولياء الأمور وكشف الحساب</h3>
        <p className="text-xs text-gray-500 leading-relaxed">التذكير بالحصة، وكشف الحساب، وتجديد الباقة، وملخّص التقدّم — كلها تبدأ بـ«السلام عليكم ورحمة الله وبركاته، أسعد الله أوقاتكم» وتنتهي بعبارة شكر. اكتب هنا الاسم الذي تُوقَّع به الرسائل في آخرها، ويمكنك دائماً تعديل الرسالة في واتساب قبل إرسالها.</p>
        <p className="text-xs font-black text-gray-700">التوقيع — اسمك فقط كما يظهر في آخر الرسائل والكشف</p>
        <SenderInput value={settings.senderName ?? ''} busy={busy}
          onSave={v => save({ senderName: v }, v ? 'حُفظ التوقيع' : 'أُزيل التوقيع')} />
        <InvoiceInputs value={settings.invoice} busy={busy}
          onSave={v => save({ invoice: v }, 'حُفظت بيانات الكشف')} />
      </section>

      {/* Goal */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-black text-gray-900">🎯 الهدف الشهري</h3>
        <p className="text-xs text-gray-500 leading-relaxed">قيمة العمل التي تريد إنجازها كل شهر. في أعلى الدفتر ترى: المنجز + المجدول المتبقي = المتوقّع آخر الشهر، والفرق عن الهدف.</p>
        <GoalInput value={settings.monthlyGoal ?? null} currency={settings.currency} busy={busy}
          onSave={v => save({ monthlyGoal: v }, v ? 'حُفظ الهدف' : 'أُزيل الهدف')} />
      </section>

      {/* Export */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-emerald-600" /><h3 className="font-black text-gray-900">تصدير إلى Excel</h3></div>
        <p className="text-xs text-gray-500 leading-relaxed">ملف واحد فيه: ملخص الفترة، كل الحصص، الدفعات، المصاريف، وأرصدة العائلات. التواريخ والمبالغ أرقام حقيقية فيمكنك الفرز والجمع فيها. لفترة محدّدة استعمل الزر في «إحصائيات».</p>
        <button disabled={busy} className={primaryBtn('bg-emerald-600 hover:bg-emerald-700 text-xs')}
          onClick={async () => {
            const dates = [...data.lessons, ...data.payments, ...data.expenses].map(x => x.date).sort()
            const today = localToday()
            try { await downloadLedgerXlsx(data, dates[0] ?? today, dates.at(-1) ?? today, today); toast('نُزّل ملف Excel') }
            catch (e) { toast(`تعذّر إنشاء الملف: ${(e as Error).message}`, 'error') }
          }}>
          <FileSpreadsheet className="w-4 h-4" /> تصدير كل البيانات
        </button>
      </section>

      {/* General */}
      <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-black text-gray-900">عام</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-gray-700">العملة</span>
          <Segmented value={settings.currency} onChange={v => save({ currency: v })} options={[{ value: 'QAR', label: 'ريال قطري' }, { value: 'TND', label: 'دينار تونسي' }]} />
        </div>
        <Field label="المنطقة الزمنية (لتحديد «اليوم» في الملخّص الصباحي)">
          {id => (
            <select id={id} className={inputCls} disabled={busy} value={settings.timezone} onChange={e => save({ timezone: e.target.value })}>
              {zones.map(z => <option key={z} value={z}>{z}{z === browserZone ? ' (هذا الجهاز)' : ''}</option>)}
            </select>
          )}
        </Field>
        <p className="text-[11px] text-gray-400">تغيير العملة يغيّر الرمز المعروض فقط — المبالغ المسجّلة لا تُحوَّل.</p>
      </section>
    </div>
  )
}

function SenderInput({ value, busy, onSave }: { value: string; busy: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  useEffect(() => { setV(value) }, [value])
  return (
    <div className="flex items-center gap-2">
      <input className={`${inputCls} max-w-[16rem]`} aria-label="توقيع الرسائل" maxLength={60}
        value={v} onChange={e => setV(e.target.value)} placeholder="مثال: الأستاذ أمين" />
      <button disabled={busy || v.trim() === value} onClick={() => onSave(v.trim())} className={primaryBtn('text-xs')}>حفظ</button>
    </div>
  )
}

/** Title and phone in the statement's header; payment methods in its closing box (only when something is owed). */
function InvoiceInputs({ value, busy, onSave }: { value?: InvoiceInfo; busy: boolean; onSave: (v: InvoiceInfo | null) => void }) {
  const [title, setTitle] = useState(value?.title ?? '')
  const [phone, setPhone] = useState(value?.phone ?? '')
  const [pay, setPay] = useState(() => parsePayment(value?.payment))
  useEffect(() => { setTitle(value?.title ?? ''); setPhone(value?.phone ?? ''); setPay(parsePayment(value?.payment)) }, [value])
  const set = (k: keyof PaymentForm) => (v: string | boolean) => setPay(p => ({ ...p, [k]: v }))
  const payment = buildPayment(pay)
  const lines = payment ? payment.split('\n') : []
  const changed = title.trim() !== (value?.title ?? '') || phone.trim() !== (value?.phone ?? '') || payment !== (value?.payment ?? '')
  return (
    <div className="space-y-3 border-t border-gray-100 pt-3">
      <p className="text-xs text-gray-500 leading-relaxed">ما يظهر في <b>كشف الحساب PDF</b>: صفتك ورقمك تحت اسمك في رأسه، وطرق الدفع في آخره — <b>فقط حين يكون على العائلة مبلغ</b>، ومعها في رسالة واتساب. اترك فارغاً ما لا تستعمله.</p>
      <Field label="الصفة">
        {id => <input id={id} className={inputCls} maxLength={INVOICE_TITLE_MAX} value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: أخصائي نشاط بدني معدّل" />}
      </Field>
      <Field label="رقم هاتفك">
        {id => <input id={id} type="tel" inputMode="tel" dir="ltr" className={`${inputCls} max-w-[16rem]`} maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+974 5555 5555" />}
      </Field>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-3">
        <p className="text-xs font-black text-gray-700">طرق الدفع</p>
        <Field label="فوران — الرقم المسجّل">
          {id => <input id={id} type="tel" inputMode="tel" dir="ltr" className={`${inputCls} max-w-[16rem]`} maxLength={30} value={pay.fawran} onChange={e => set('fawran')(e.target.value)} placeholder="5555 5555" />}
        </Field>
        <Field label="تحويل بنكي — اسم البنك">
          {id => <input id={id} className={inputCls} maxLength={40} value={pay.bank} onChange={e => set('bank')(e.target.value)} placeholder="مثال: QNB" />}
        </Field>
        <Field label="رقم الحساب IBAN">
          {id => <input id={id} dir="ltr" className={inputCls} maxLength={40} autoCapitalize="characters" spellCheck={false} value={pay.iban}
            onChange={e => set('iban')(e.target.value.toUpperCase())} placeholder="QA00 XXXX 0000 0000 0000 0000 0000 0" />}
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={pay.cash} onChange={e => set('cash')(e.target.checked)} className="w-4 h-4 accent-brand-600" />
          نقداً عند الحصة
        </label>
        <Field label="طريقة أخرى (اختياري)">
          {id => <textarea id={id} rows={2} className={inputCls} maxLength={200} value={pay.other} onChange={e => set('other')(e.target.value)} placeholder="مثال: Ooredoo Money: 5555 5555" />}
        </Field>
        <p className="text-[11px] text-gray-400">انسخ رقم الحساب من تطبيق البنك كما هو — خطأ رقم واحد يرسل المال إلى غيرك.</p>
      </div>

      {lines.length > 0 && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-xs">
          <p className="font-black text-brand-700 mb-1">هكذا تظهر في الكشف:</p>
          {lines.map(l => (
            <p key={l} className="text-gray-800">• {bidiRuns(l).map((r, i) => <span key={i}>{i ? ' ' : ''}{r.ltr ? <bdi dir="ltr">{r.text}</bdi> : r.text}</span>)}</p>
          ))}
        </div>
      )}
      <button disabled={busy || !changed} className={primaryBtn('text-xs')}
        onClick={() => onSave(title.trim() || phone.trim() || payment ? { title: title.trim(), phone: phone.trim(), payment } : null)}>
        حفظ بيانات الكشف
      </button>
    </div>
  )
}

function GoalInput({ value, currency, busy, onSave }: {
  value: number | null; currency: 'QAR' | 'TND'; busy: boolean; onSave: (v: number | null) => void
}) {
  const [v, setV] = useState(value ? String(value) : '')
  useEffect(() => { setV(value ? String(value) : '') }, [value])
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={0} step="any" inputMode="decimal" className={`${inputCls} max-w-[10rem]`} aria-label="الهدف الشهري"
        value={v} onChange={e => setV(e.target.value)} placeholder="مثال: 6000" />
      <span className="text-xs text-gray-500">{currency === 'TND' ? 'د.ت' : 'ر.ق'}</span>
      <button disabled={busy} onClick={() => onSave(Number(v) > 0 ? Number(v) : null)} className={primaryBtn('text-xs')}>حفظ</button>
      {value ? <button disabled={busy} onClick={() => onSave(null)} className={ghostBtn('text-xs')}>إزالة</button> : null}
    </div>
  )
}
