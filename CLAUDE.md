# CLAUDE.md — Amine Academy — سجل المشروع

> هذا الملف مرجع دائم لكل ما تم بناؤه وإصلاحه في المشروع.
> يُحدَّث بعد كل جلسة عمل كبيرة.

---

## 1. نظرة عامة على المشروع

**Amine Academy** — منصة علاج وتعليم متكاملة للأطفال ذوي الاحتياجات الخاصة (توحد، عسر قراءة، اضطراب تركيز، إلخ).

- **المستخدمون:** أخصائيون، أولياء أمور، أطفال
- **اللغة الرئيسية:** العربية (RTL)، مع دعم ثنائي اللغة AR/EN
- **البيئة:** Next.js 14 App Router، TypeScript، Tailwind CSS، Redis (upstash)، Resend (إيميل)
- **المستودع:** `aminehamdipro25-crypto/amine-academy`
- **الفرع الرئيسي:** `main` (كل الكود يُدفع مباشرة إليه)

---

## 2. هيكل المشروع

```
app/
├── page.tsx                    # Landing page (الصفحة الرئيسية)
├── dashboard/
│   ├── (admin)/                # لوحة تحكم الأخصائي
│   │   ├── clients/            # إدارة العملاء
│   │   ├── appointments/       # المواعيد
│   │   ├── messages/           # الرسائل
│   │   ├── payments/           # المدفوعات
│   │   ├── programs/           # البرامج الأسبوعية
│   │   ├── reports/            # التقارير السريرية
│   │   ├── analytics/          # التحليلات
│   │   ├── exercises/          # مكتبة التمارين
│   │   ├── learning-difficulties/
│   │   ├── settings/           # الإعدادات والأسعار
│   │   ├── specialist-toolkit/ # أدوات الأخصائي
│   │   └── staff/              # إدارة الموظفين
│   └── login/
├── parent/                     # بوابة أولياء الأمور
│   ├── (portal)/               # dashboard الوالدين
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
├── session/[id]/               # جلسة العلاج التفاعلية
├── register/                   # تسجيل أولياء الأمور
├── checkout/                   # الدفع
├── payment/                    # تأكيد الدفع
├── demo/                       # جولة تجريبية
├── blog/                       # المدونة
├── legal/                      # الصفحات القانونية
└── api/                        # جميع API routes

components/
├── session/exercises/          # 67 تمرين تفاعلي
├── session/                    # مكونات الجلسة
└── ...

lib/                            # مساعدات، أنواع، ثوابت
```

---

## 3. ما تم بناؤه — بالتفصيل

### 3.1 الصفحة الرئيسية (Landing Page)

- **بُني من الصفر** بتصميم متدرج فاتح (light gradient)
- أقسام: Hero، HowItWorks، Features، Pricing (QAR + TND)، Blog، Legal
- دعم ثنائي اللغة AR/EN لجميع الأقسام
- صفحة Demo Tour تفاعلية
- Logo مخصص (SVG دماغ)

### 3.2 منظومة المصادقة (Auth)

| الميزة | الحالة |
|---|---|
| تسجيل أولياء الأمور + تفعيل بالإيميل | ✅ |
| كود تفعيل الطالب (student access code) | ✅ |
| تسجيل دخول الأخصائي (Redis + HMAC session) | ✅ |
| نسيان كلمة المرور + إعادة التعيين | ✅ |
| إعادة تعيين كلمة المرور من لوحة الأخصائي | ✅ |
| انتهاء صلاحية الجلسة (timeout) | ✅ |
| تصلب ضد Brute Force (rate limiting) | ✅ |
| حماية جميع endpoints بالمصادقة | ✅ |

### 3.3 لوحة تحكم الأخصائي (Admin Dashboard)

جميع الصفحات أُعيد تصميمها بالكامل بنظام تصميم موحد (light theme + motion):

- **Clients** — قائمة العملاء، تفاصيل كل عميل، تعليق/حذف، انتحال هوية
- **Appointments** — إنشاء، تعديل، إلغاء مواعيد
- **Messages** — مراسلة أولياء الأمور + auto-refresh
- **Payments** — متابعة المدفوعات، حالة كل عميل
- **Programs** — بناء برنامج أسبوعي يدوياً أو بالذكاء الاصطناعي
- **Reports** — تقارير سريرية تفصيلية (ذكاء اصطناعي + بيانات حقيقية)
- **Analytics** — إحصاءات عامة (بدون PII)
- **Exercises** — مكتبة التمارين
- **Learning Difficulties** — اضطرابات التعلم
- **Settings** — الأسعار، الخصومات، تشخيص الإيميل، اختبار البريد
- **Specialist Toolkit** — أدوات سريرية إضافية
- **Staff** — إدارة الموظفين

### 3.4 منظومة الإيميل (Resend)

| الإيميل | متى يُرسل |
|---|---|
| تفعيل الحساب | عند التسجيل |
| إعادة تعيين كلمة المرور | عند الطلب |
| إشعار للأخصائي عند رسالة وارد | عند كل رسالة من ولي الأمر |
| إشعار لولي الأمر عند رد الأخصائي | عند كل رد |
| تأكيد الحجز للأخصائي | عند حجز موعد |
| تذكير 24 ساعة قبل الموعد | cron يومي |
| تذكير ~1 ساعة قبل الموعد | cron يومي |

### 3.5 منظومة الدفع

- اكتشاف العملة الجغرافي (QAR/TND)
- Checkout Page → FAWRAN / تحويل بنكي
- لوحة متابعة الدفع في الأدمن
- بيانات بنكية حقيقية

### 3.6 بوابة أولياء الأمور

- لوحة متابعة تقدم الطفل
- مراسلة الأخصائي
- عرض ملخص الجلسات (بدون تفاصيل سريرية حساسة)
- عرض البرامج والتقارير

### 3.7 جلسة العلاج التفاعلية — `/session/[id]`

أكثر جزء تطور في المشروع:

#### مكونات الجلسة المستخرجة:
- `SessionHeader` — الرأس مع معلومات الطالب
- `StudentTimerDisplay` — عداد الوقت
- `SessionToolbar` — شريط الأدوات (بطاقات، موقت، موسيقى)
- `SessionPhaseBar` — شريط تقدم المراحل
- 6 panels/modals مستخرجة

#### ميزات الجلسة:
- **مراحل قابلة للتعديل** — الأخصائي يحدد مدة كل مرحلة قبل البدء
- **محرك صعوبة تكيفي** — يرفع/يخفض صعوبة التمرين تلقائياً بناءً على الأداء
- **ذكاء جلسة حي** — توصيات في الوقت الفعلي للأخصائي
- **إخفاء Chrome تلقائي** — يختفي الرأس/الشريط عند بدء التمرين
- **زر إعادة التشغيل** — يعيد التمرين الحالي من البداية
- **تبديل حجم الشاشة** — صغير/كبير
- **لوح الرسم** مع إخفاء تلقائي عند التمرين
- **خريطة التقدم** (Duolingo-style) — نجوم تضيء بعد كل تمرين
- **احتفال نهاية الجلسة** مع الخريطة
- **حفظ تلقائي** مع flash "محفوظ"
- **تقرير نهاية الجلسة** سريري متكامل

### 3.8 التمارين التفاعلية — 67 تمرين

#### التمارين الرئيسية (مجموعات):
- **التركيز والانتباه:** TapTarget، SustainedAttention، FlashCount، NumberSearch، NBackTask، TargetTracking
- **الذاكرة:** MemoryCards، SequenceMemory، AuditoryMemory، AudioSequenceRepeat
- **اللغة والقراءة:** ReadingCards، SpellingBee، WordBuilder، LetterMatch، WordRecall، ListeningComprehension
- **الرياضيات:** MathFlash
- **التفكير المنطقي:** LogicSort، AnalogiesGame، PatternPuzzle، PatternMatch، IfThen
- **المشاعر والاجتماعي:** EmotionCards، EmotionMirror، EmotionVolume، MoodMeter، SocialProblemSolving، ConversationStarter، SensoryCheckIn
- **التوحد:** ChoiceBoard، FirstThenBoard، BehaviorContract، DirectionFollow، VisualSchedule، VisualMatch، ImitationMirror، SocialScenarios، CategorySort
- **الاسترخاء:** BreathingGuide، BalloonControl، CalmCorner، BodyScan، PhysicalExercise
- **اللعب:** SimonSays، ColorGrid، StroopTest، FingerGym، SequenceTap، FingerGym، SequenceTap
- **متفرقة:** VerbalFluency، PictureWordCards، WordBuilder، VisualMatch

#### قواعد البيانات الموسّعة:
- LogicSort: 12 سؤال
- AnalogiesGame: 24 قياس
- SocialScenarios: سيناريوهات مفصّلة
- SpellingBee: 20 كلمة
- EmotionMirror: بنك موسّع
- StroopTest: ألوان موسّعة
- WordRecall: قوائم موسّعة
- CategorySort: فئات موسّعة

---

## 3.9 المزامنة اللحظية بين الأخصائي والطفل (المحور الأساسي — جلسة 13)

> جوهر المنصة: الأخصائي يُدير الجلسة على `/session/[id]` والطفل يدخل من بوابة الوالدين على `/session/[id]/kid`، ويتفاعلان مع **نفس** المحتوى لحظياً مع فيديو متبادل.

### البنية: "إيقاظ + Redis مصدر الحقيقة"
- **`lib/realtime-server.ts`** — نشر أحداث Pusher (server). كل تغيير يكتب في Redis (المصدر الدائم) ثم يُرسل نبضة إيقاظ صغيرة فقط؛ المستقبِل يُعيد جلب البيانات من الـ API المُصادَق. `SessionEvent`: `live | content | whiteboard | timer | noise | card | kid-status | presence | readiness | progress | reaction`.
- **`lib/realtime-client.ts`** — اشتراك Pusher (client)، اتصال واحد مُشترك لكل تبويب (ref-counted). `realtimeEnabled()`، `subscribeSession()`، `subscribeConnectionState()`.
- **التدهور الرشيق:** إن غابت مفاتيح Pusher، النشر no-op والعملاء يعملون بالتحديث الدوري (poll). المنصة تعمل بدون Pusher؛ إضافته ترفع اللحظية من ~1s إلى ~100ms بلا تغيير كود.
- **مفاتيح Pusher الستة في Vercel** (`NEXT_PUBLIC_*` تُبنى وقت البناء → تحتاج إعادة نشر). مؤشر عائم عند الأخصائي يُظهر «مباشر / تحديث دوري».

### الفيديو — Daily.co Prebuilt Iframe
- `components/session/DailyVideoCall.tsx` — انتقل من call-object إلى `DailyIframe.createFrame` (prebuilt) — أنهى نهائياً خطأ CSP لتحميل bundle من `*.dailywebrtc.net`. الكاميرا تعمل عبر `Permissions-Policy: camera=*` على `/session/*` + `allow=` على iframe.
- `lib/daily.ts`: `dailyRoomNameFor()` = `amine-${sha256(id).slice(0,24)}` — فكّ ربط طول اسم الغرفة عن طول الـ appointmentId (حدّ 41 حرف).
- `DraggableVideoPiP` — صندوق قابل للسحب؛ يبقى الاتصال حياً عند التصغير (لا يُهدم)، ويُحرّر `right/bottom` عند السحب حتى يتحرك فعلاً.

### تطابق المحتوى — بذرة عشوائية مشتركة
- **`lib/seeded-random.ts`** — PRNG حتمي (mulberry32): `createRng`, `shuffleWithRng`, `pickWithRng`, `randIntWithRng`, `randBoolWithRng`.
- **المشكلة الجذرية:** كل تمرين يُحمَّل كشجرتين React مستقلتين؛ أي `Math.random()` يُنتج محتوى مختلفاً على كل شاشة. **الحل:** الأخصائي يُنشئ `seed` واحداً لكل تمرين (يُحسب أثناء الرسم عبر ref محروس — لا useEffect، حتى يكون صحيحاً من أول render)، يُرسل عبر قناة `live`. حُوّلت **كل التمارين الـ63** لاستخدام البذرة → نفس البطاقات/الأسئلة/المواضع تماماً على الشاشتين.

### رؤية إجابات الطفل لحظياً (Live per-answer feedback)
- **`ExerciseProgressUpdate`** (`lib/types.ts`): `{ answered, total, correct, errors, lastCorrect? }`.
- مسار `/api/sessions/[id]/progress` (POST من الطفل مُخفَّف، GET للأخصائي، حدث `progress`، TTL قصير).
- **60 تمريناً** تستدعي `onProgress` عند كل إجابة (قيم مُحسبة مسبقاً nc/ne؛ tap-games مستمرة تستخدم refs و`total:0`). الـ19 المتبقية أدوات استرخاء/تقييم ذاتي (لا صح/خطأ).
- **لوحة عائمة عند الأخصائي** (مستقلة عن الرأس المُخفى): شريط تقدم + ✓/✗ + وميض آخر إجابة.

### أدوات تحكم الأخصائي — انفجارات التشجيع
- مسار `/api/sessions/[id]/reaction` (POST للأخصائي فقط، `{type, id}` بـ nonce، TTL 60s، حدث `reaction`).
- شريط عائم (⭐🎉👏❤️👍🌈) يُطلق احتفال ملء الشاشة على جهاز الطفل (`KidReactionBurst`).

### تجربة الطفل
- **`lib/feedback-sound.ts`** — نغمات Web Audio موحّدة عبر كل التمارين (تُشغَّل من `onProgress` بلا لمس أي تمرين): نغمة صاعدة للصحيح، هادئة للخطأ (ليست جرس حاد — مهم لذوي الاحتياجات) + وميض حواف أخضر/أحمر (`KidAnswerGlow`).
- **`KidProgressMap`** — خارطة تقدم (Duolingo-style) تظهر بين التمارين: عقدة لكل تمرين مُنجز بنجومه (1-3 حسب النتيجة) + مجموع النجوم + عقدة «التالي» تنبض. محفوظة في localStorage (`kid-stars:{id}`) فتبقى بعد إعادة التحميل. تحل محل شاشة الانتظار الساكنة.
- **`KidReadinessScreen`** — الطفل يجيب تقييم الجاهزية بنفسه (وجوه/رموز)، يُزامَن حياً للأخصائي.

### الحضور والموثوقية
- `presence` — نبض ثنائي المفتاح (`session:presence:{specialist|kid}:{id}`، TTL 15s) → مؤشر «غادر الطفل» صادق.
- **إعادة محاولة رابط الفيديو** (kid) حتى ينجح (backoff مُقيَّد بـ10s) — فشل واحد كان يترك الطفل بلا فيديو كامل الجلسة.
- **إعادة مزامنة عند عودة الاتصال** (الطرفان) — عند إعادة اتصال Pusher تُعاد مزامنة كل القنوات فوراً بدل انتظار الـ poll.

---

## 4. إصلاحات الأخطاء الكبرى

### 4.1 React Strict Mode — Double-Fire (24 ملف)

**المشكلة:** React يستدعي setState updaters مرتين في Development mode، ما يسبب استدعاء `onComplete` مرتين وإرسال النتيجة مرتين للسيرفر.

**الحلول المطبّقة:**

| النمط | الوصف | الملفات |
|---|---|---|
| `timerRef` + cleanup | تتبع كل setTimeout وإلغاؤه عند unmount | 14 ملف |
| `doneRef` guard | ref يمنع double-fire في الـ updater | TargetTracking, VerbalFluency |
| `advanceRef` guard | نفسه لـ setInterval + setProgress | PhysicalExercise, BodyScan |
| `useMemo` shuffle | ثبات الخيارات بين re-renders | ReadingCards, SpellingBee, PatternPuzzle, IfThen |
| Pre-compute nc/ne | إصلاح stale closure قبل setState | IfThen, PatternPuzzle, LogicSort, ListeningComprehension, SpellingBee, SequenceTap |
| `lightTimerRef` | للـ nested timeout داخل setInterval | FingerGym |
| `timerIds[]` array | لتتبع setTimeouts متعددة | SequenceTap, SequenceMemory |

**الملفات المُصلحة (24):**
TargetTracking, PhysicalExercise, ReadingCards, LetterMatch, EmotionCards, EmotionVolume, IfThen, PatternPuzzle, PatternMatch, MoodMeter, WordBuilder, LogicSort, FingerGym, ListeningComprehension, VerbalFluency, SpellingBee, BodyScan, PictureWordCards, ImitationMirror, SensoryCheckIn, SequenceTap, SequenceMemory, VisualMatch, VisualSchedule

### 4.2 إصلاحات أمنية

| الخطأ | الإصلاح |
|---|---|
| passwordHash يُرسل للعميل | strip قبل إرسال بيانات Parent |
| PII في analytics endpoint | إزالة الحقول الحساسة |
| homework GET بدون auth | إضافة مصادقة admin |
| studentId غير مُعقَّم | sanitize في assessments POST |
| ثغرات في تسجيل/تسجيل دخول | إغلاق جميع الثغرات |
| IDOR في المواعيد | تحقق من ملكية الموعد |
| Redis failure يكسر الـ app | fault-tolerant sessions |

### 4.3 إصلاحات أخرى

- مؤقت الجلسة كان يُضاعف الوقت عند إعادة الفتح → إصلاح
- NBackTask كان يتجمّد بعد أول جولة → إصلاح (ITI timer كان يلغي نفسه)
- SequenceMemory: ألوان، أرقام، حساب score، feedback → إصلاح شامل
- حفظ الجلسات والتقييمات (data loss صامت) → إصلاح
- مقاطع فيديو طويلة جداً (library) → استبدال بمقاطع ≤30 ثانية

### 4.4 إصلاحات جلسة 13 (المزامنة اللحظية)

| الخطأ | السبب الجذري | الإصلاح |
|---|---|---|
| التمارين مختلفة بين الشاشتين | البذرة تُضبط في useEffect بعد mount فيلتقط الأخصائي بذرة قديمة | حساب البذرة أثناء الرسم عبر ref محروس |
| إعادة التمرين لا تصل للطفل | fetchLive يتفاعل مع تغيّر exerciseId فقط، والإعادة تُبقيه | المراقبة على `(exerciseId + seed)` |
| إجابة الطفل لا تظهر للأخصائي | المؤشر داخل الرأس الذي يُخفى عند التمرين | مؤشر عائم دائم الظهور |
| الكاميرا لا تتحرك | السحب يضبط left دون تحرير right | تحرير `right/bottom` عند السحب |
| الفيديو "شبه محجوب" | PiP يهدم مكالمة Daily عند كل تصغير | إبقاء الاتصال حياً (إخفاء CSS فقط) |
| صناديق الفيديو تُغطّى بشريط المتصفح | كلها في الزاوية السفلى اليسرى (مكان شريط كاميرا المتصفح) | نقلها للزاوية العلوية اليمنى |
| المواعيد الجديدة لا تظهر في "القادمة" | "قادمة" = أي `scheduled` بلا فحص تاريخ، مرتبة من الأقدم، والبقعة تعرض 3 فقط | "قادمة" = مستقبلية فعلاً (تاريخ+وقت ≥ الآن)، الأقرب أولاً، والمتأخرة في قائمة منفصلة |

---

## 5. أمان المشروع — الحالة الراهنة

- ✅ جميع API endpoints محمية بمصادقة
- ✅ لا PII يُرسل لصفحات العميل
- ✅ passwordHash لا يُغادر السيرفر
- ✅ Rate limiting على تسجيل الدخول
- ✅ HMAC-signed sessions (Redis fault-tolerant)
- ✅ IDOR checks على المواعيد والبيانات
- ✅ sanitize على جميع المدخلات الخارجية

---

## 6. قواعد العمل الثابتة (Standing Rules)

> هذه القواعد مُفعَّلة دائماً في كل جلسة:

1. **كل تغيير يُدفع مباشرة على `main`** — لا يوجد PR إلا بطلب صريح
2. **لا تسأل قبل الدمج** — نفّذ وادفع مباشرة
3. **أرفق نصيحة مع كل تغيير** — توصية أو تحذير أو اقتراح
4. **لا تعرض أبداً** قيم `.env.local`، `AUTH_SECRET`، أي token
5. **لا تخترع URLs أو Video IDs** — استخدم فقط ما يوفره المستخدم
6. **TypeScript صفر أخطاء** — `npx tsc --noEmit` قبل كل commit
7. **هذا كود إنتاجي حقيقي** يُستخدم مع أطفال في جلسات علاج

---

## 7. Stack التقني

| التقنية | الاستخدام |
|---|---|
| Next.js 14 (App Router) | Framework الأساسي |
| TypeScript | كل الكود |
| Tailwind CSS | التصميم |
| Redis (Upstash) | جلسات المصادقة، حالة الجلسة اللحظية، التخزين المؤقت |
| Resend | إرسال الإيميلات |
| Daily.co (Prebuilt Iframe) | مكالمات الفيديو المتبادلة في الجلسة |
| Pusher (pusher / pusher-js) | المزامنة اللحظية (إيقاظ + Redis مصدر الحقيقة) |
| Web Audio API | نغمات التغذية الراجعة + توليد الموسيقى/الضوضاء |
| Web Speech API | TTS في التمارين |
| React useRef/useMemo | ثبات الحالة والبذور في التمارين |

---

## 8. هيكل التمرين — النمط الصحيح

كل تمرين يجب أن يتبع هذا النمط:

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import type { ExerciseResult, ExerciseProgressUpdate } from '@/lib/types'
import { createRng, shuffleWithRng } from '@/lib/seeded-random'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
  seed?: number                                        // بذرة مشتركة → نفس المحتوى على الشاشتين
  onProgress?: (p: ExerciseProgressUpdate) => void     // تغذية راجعة لحظية للأخصائي/الطفل
}

export default function MyExercise({ onComplete, onCancel, difficulty = 1, seed, onProgress }: Props) {
  // ✅ RNG حتمي من البذرة المشتركة — بدل Math.random المستقل
  const rng      = useRef(createRng(seed ?? Date.now())).current
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ✅ إلغاء التايمر عند unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // ✅ shuffle حتمي (نفس الترتيب على الجهازين)
  const choices = shuffleWithRng(rng, rawChoices)

  function handleAnswer(answer: string) {
    // ✅ pre-compute قبل setState لتجنب stale closure
    const nc = correct + (isCorrect ? 1 : 0)
    const ne = errors  + (isCorrect ? 0 : 1)
    if (isCorrect) setCorrect(nc)
    else           setErrors(ne)

    // ✅ بثّ التقدم اللحظي (قيم مُحسبة مسبقاً، لا state قديم)
    onProgress?.({ answered: idx + 1, total, correct: nc, errors: ne, lastCorrect: isCorrect })

    // ✅ تتبع التايمر
    timerRef.current = setTimeout(() => {
      if (isLastQuestion) {
        onComplete({ score: Math.round((nc / total) * 100), errors: ne, ... })
      }
    }, 1000)
  }
}
```

> **ملاحظة:** لا تستخدم `Math.random()` في التمارين إطلاقاً — استخدم `rng()` أو مساعدات `lib/seeded-random.ts` حتى يبقى المحتوى متطابقاً بين شاشة الأخصائي والطفل.

---

## 9. سجل الجلسات

| الجلسة | ما تم |
|---|---|
| الأولى | بناء الهيكل الأساسي، Auth، Landing Page |
| الثانية | Admin Dashboard كامل، Payment، Parent Portal |
| الثالثة | Session Platform، تمارين أساسية |
| الرابعة | تصميم Landing بالكامل، Bilingual |
| الخامسة | إصلاح أمني شامل، إيميلات، مراسلة |
| السادسة | Session UX: إخفاء Chrome، إعادة تشغيل، خريطة تقدم |
| السابعة | ProgressMap (Duolingo)، adaptive difficulty، session intelligence |
| الثامنة | إصلاحات بنية التمارين، عسر القراءة، SensoryCheckIn |
| التاسعة | توسيع محتوى التمارين، NumberSearch، تحرير مدة المراحل |
| العاشرة | إعادة تصميم Readiness Screen، Light Theme للجلسة |
| الحادية عشرة | استخراج مكونات session/page.tsx (6 مراحل refactor) |
| الثانية عشرة | إصلاح React Strict Mode bugs في 24 تمرين |
| الثالثة عشرة | **المزامنة اللحظية الكاملة:** Pusher (إيقاظ + Redis)، Daily prebuilt iframe، بذرة عشوائية مشتركة عبر 63 تمرين، رؤية إجابات الطفل لحظياً (60 تمرين + لوحة أخصائي)، انفجارات التشجيع، خارطة تقدم الطفل + نجوم + تغذية راجعة صوتية موحّدة، تقييم جاهزية يجيبه الطفل، تقوية الموثوقية (إعادة محاولة الفيديو + إعادة مزامنة عند الاتصال)، إصلاح المواعيد القادمة |
| الرابعة عشرة | **حلقة المصداقية (تقييم → خطة → تقرير):** تقارير مبنية على بيانات اللعب الفعلية + مقياس تحسّن قابل للقياس، **شارة تحسّن موثّقة** («+X٪ دقّة») في الوثيقة المطبوعة للوالد، **خطة مقترحة قائمة على قواعد** من التقييم الأول (`lib/assessment-plan.ts`: عدد حصص/أسبوع + عدد أسابيع + مسار المجالات المستهدفة مرتّباً + موعد إعادة تقييم) تُحسب في الخادم وتُعرض للوالد والأخصائي وتُغذّي مولّد البرنامج بالـAI (كل التوصيات بدل 3)، endpoint أدمن لعرض تقييمات الوالد للأخصائي. **ملاحظة صريحة:** التقييم أداة فرز جيدة البناء لكنه ليس أداة معيارية مُصدَّقة (رفع المصداقية العلمية فعلاً يتطلب تبنّي بنود SNAP-IV/Vanderbilt) |
