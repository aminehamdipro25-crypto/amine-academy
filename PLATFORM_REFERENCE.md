# أكاديمية أمين — المرجع التقني الشامل
**Amine Academy — Complete Technical Reference**

> آخر تحديث: يونيو 2026 | المنصة مرفوعة على Vercel وتعمل بشكل كامل

---

## 1. نظرة عامة على المنصة

أكاديمية أمين هي منصة تعليمية علاجية رقمية موجهة للأطفال الذين يعانون من **ADHD** و**التوحد** في الفئات العمرية 5–22 سنة، تعمل في قطر وتونس. تقدم:

- جلسات تفاعلية مباشرة عبر الإنترنت (الأستاذ يشارك شاشته مع الطالب)
- تقييمات موحّدة معتمدة (APA/ABA/CBT/PEERS)
- ألعاب معرفية مخصصة حسب التشخيص
- تمارين جسدية منزلية للأهل
- تقارير أسبوعية تلقائية

---

## 2. المكدس التقني

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Upstash Redis (HTTP REST) |
| Auth | Web Crypto API (HMAC-SHA256 JWT يدوي) |
| Email | Nodemailer (Gmail) / Resend |
| Charts | Recharts 2.12 |
| Validation | Zod 4 |
| Deployment | Vercel (auto-deploy من main) |
| Video | Jitsi Meet (popup window) |
| AI | Anthropic Claude API (توليد التقارير والبرامج) |

---

## 3. متغيرات البيئة (Environment Variables)

> **تحذير أمني**: لا تُضاف هذه القيم أبداً إلى git

```
UPSTASH_REDIS_REST_URL=        # URL قاعدة البيانات
UPSTASH_REDIS_REST_TOKEN=      # رمز Upstash (بدون مسافات أو تنصيص)
AUTH_SECRET=                   # مفتاح توقيع JWT (عشوائي 32+ حرف)
ADMIN_PASSWORD=310325Dawama1993** # كلمة مرور الأستاذ أمين
GMAIL_USER=                    # البريد الإلكتروني Gmail
GMAIL_APP_PASSWORD=            # كلمة مرور التطبيق (ليست كلمة Gmail)
CRON_SECRET=                   # سر التحقق من مهام Cron
NEXT_PUBLIC_WHATSAPP_NUMBER=   # رقم واتساب للتواصل
ANTHROPIC_API_KEY=             # مفتاح Claude API
```

---

## 4. بنية المشروع

```
amine-academy/
├── app/
│   ├── page.tsx                          # الصفحة الرئيسية (Landing)
│   ├── layout.tsx                        # Layout عام
│   ├── register/                         # تسجيل أولياء الأمور
│   ├── demo/                             # تجربة مجانية
│   ├── checkout/                         # صفحة الدفع
│   ├── blog/                             # المدونة
│   ├── legal/                            # سياسة الخصوصية، الشروط، الإلغاء
│   │
│   ├── session/[id]/page.tsx             # ★ منصة الجلسة التفاعلية (الأستاذ)
│   │
│   ├── dashboard/(admin)/                # لوحة تحكم الأستاذ أمين
│   │   ├── page.tsx                      # الرئيسية
│   │   ├── clients/                      # قائمة العملاء + ملف كل عميل
│   │   ├── appointments/                 # إدارة المواعيد
│   │   ├── exercises/                    # مكتبة التمارين
│   │   ├── programs/                     # البرامج العلاجية
│   │   ├── reports/                      # التقارير
│   │   ├── messages/                     # الرسائل
│   │   ├── payments/                     # المدفوعات
│   │   ├── analytics/                    # الإحصاءات
│   │   ├── learning-difficulties/        # صعوبات التعلم
│   │   └── settings/                     # الإعدادات
│   │
│   ├── parent/(portal)/                  # بوابة أولياء الأمور
│   │   ├── dashboard/                    # الرئيسية
│   │   ├── children/                     # معلومات الأطفال
│   │   ├── appointments/                 # حجز وعرض المواعيد
│   │   ├── exercises/                    # مكتبة التمارين الجسدية
│   │   ├── progress/                     # ★ تطور الطفل (رسوم بيانية)
│   │   ├── reports/                      # تقارير الأستاذ
│   │   └── chat/                         # التواصل مع الأستاذ
│   │
│   ├── student/(portal)/                 # بوابة الطالب
│   │   ├── dashboard/
│   │   ├── exercises/
│   │   ├── achievements/
│   │   ├── schedule/
│   │   └── journal/
│   │
│   └── api/                              # كل endpoints الـ API
│
├── components/
│   ├── landing/                          # مكونات الصفحة الرئيسية
│   │   ├── HeroSection.tsx               # ★ Hero (Mightier-inspired)
│   │   ├── FeaturesSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── PlansSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── ...
│   ├── session/
│   │   ├── exercises/                    # 12 لعبة تفاعلية
│   │   └── assessments/                  # 2 مقياس تقييمي
│   ├── dashboard/                        # مكونات لوحة التحكم
│   └── shared/                           # مكونات مشتركة
│
└── lib/
    ├── types.ts                          # ★ كل الأنواع (Types)
    ├── db.ts                             # ★ كل دوال قاعدة البيانات
    ├── constants.ts                      # ★ ثوابت مشتركة
    ├── auth.ts                           # JWT + تحقق الجلسات
    ├── redis.ts                          # HTTP client لـ Upstash
    ├── mailer.ts                         # إرسال البريد + قوالب
    ├── game-mapping.ts                   # ترتيب الألعاب حسب التشخيص
    ├── achievements.ts                   # نظام الإنجازات
    ├── rateLimit.ts                      # Rate limiting
    ├── site-settings.ts                  # إعدادات الموقع
    ├── exercises-data.ts                 # بيانات التمارين
    ├── i18n.ts                           # الترجمة AR/EN
    └── password.ts                       # تشفير كلمات المرور
```

---

## 5. مخطط Redis (Key Scheme)

```
# المستخدمون
parent:{id}                    → Parent JSON
parents:index                  → [parent IDs]
parent:email:{email}           → parent ID
student:{id}                   → Student JSON
students:parent:{pid}          → [student IDs]

# المصادقة
sess:{sessionId}               → parent ID (TTL 7 days)
admin_sess:{token}             → '1' (TTL session)
activation:{email}             → code 6 أرقام (TTL 24h)
pwd_reset:{email}              → reset token (TTL 1h)

# التمارين والبرامج
exercise:{id}                  → Exercise JSON
exercises:index                → [exercise IDs]
program:{id}                   → Program JSON
program:student:{sid}          → current program ID
completed:{sid}:{YYYY-MM-DD}   → Set of exercise IDs (TTL 90d)
exercises:count:{sid}          → عداد التمارين الكلي

# المواعيد والجلسات
appointment:{id}               → Appointment JSON
appointments:parent:{pid}      → [appointment IDs]
appointments:index             → [all appointment IDs]
session-log:{appointmentId}    → SessionLog JSON (TTL 365d)
sessions:student:{sid}         → [appointmentIds] للطالب

# التقييم التشخيصي
assessment-profile:{sid}       → StudentAssessmentProfile JSON
assessments:student:{sid}      → [assessment result IDs]

# نتائج الألعاب (طولية)
game-result:{id}               → GameResult JSON (TTL 365d)
game-results:student:{sid}     → [game result IDs] (latest first)
game-results:session:{aid}     → [game result IDs] لكل موعد

# التقارير والرسائل
report:{id}                    → ProgressReport JSON
reports:student:{sid}          → [report IDs]
message:{id}                   → Message JSON (TTL 90d)
messages:thread:{parentId}     → [message IDs]
messages:unread:parent:{pid}   → عداد غير مقروء
messages:unread:admin:{pid}    → عداد غير مقروء للأستاذ
messages:threads:index         → [parentIds with threads]

# المدفوعات
payment:{id}                   → PendingPayment JSON (TTL 30d)
payments:index                 → [payment IDs]
payments:parent:{pid}          → [payment IDs]

# الإعدادات
rl:{key}                       → Rate limit counter
site:settings                  → SiteSettings JSON
```

---

## 6. الأنواع الرئيسية (lib/types.ts)

### الكيانات الأساسية
| النوع | الوصف |
|-------|-------|
| `Parent` | ولي الأمر — بيانات الاشتراك والتواصل |
| `Student` | الطالب — التشخيص، مستوى الشدة، ملف حسي |
| `Appointment` | موعد — التاريخ، الوقت، النوع، رابط Jitsi |
| `Exercise` | تمرين جسدي — خطوات، أهداف، معدات |
| `Program` | برنامج علاجي أسبوعي |
| `ProgressReport` | تقرير دوري مع تقييمات سلوكية |
| `Message` | رسالة في خيط محادثة |
| `PendingPayment` | دفعة في انتظار تأكيد |

### منصة الجلسة
| النوع | الوصف |
|-------|-------|
| `SessionLog` | سجل جلسة كاملة (ملاحظات + نتائج + مدة) |
| `ExerciseResult` | نتيجة لعبة واحدة (درجة، دقة، مدة) |
| `SessionObservations` | تقييم 5 محاور: انتباه/تعاون/طاقة/مزاج/قلق |
| `AssessmentResult` | نتيجة مقياس تشخيصي (ADHD/صعوبات التعلم) |

### التقييم التشخيصي
| النوع | الوصف |
|-------|-------|
| `DifficultyLevel` | `'none' \| 'mild' \| 'moderate' \| 'severe'` |
| `StudentAssessmentProfile` | ملف تشخيصي شامل (8 محاور صعوبة) |

### التتبع الطولي (جديد)
| النوع | الوصف |
|-------|-------|
| `GameResult` | نتيجة لعبة واحدة مع timestamp (للتتبع عبر الزمن) |
| `WeeklyProgress` | ملخص أسبوعي (عدد ألعاب، دقائق، متوسط الدقة) |

---

## 7. API Routes الكاملة

### المصادقة
| Method | Route | الوصف |
|--------|-------|-------|
| POST | `/api/auth/register` | تسجيل ولي أمر جديد |
| POST | `/api/auth/client` | تسجيل دخول الوالد |
| POST | `/api/auth/client/logout` | تسجيل خروج |
| POST | `/api/auth/activate` | تفعيل الحساب برمز البريد |
| POST | `/api/auth/forgot-password` | طلب إعادة تعيين كلمة المرور |
| POST | `/api/auth/reset-password` | تنفيذ إعادة التعيين |
| POST | `/api/auth/admin` | تسجيل دخول الأستاذ |
| POST | `/api/auth/admin/logout` | تسجيل خروج الأستاذ |

### الأستاذ (Admin)
| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/api/admin/clients-list` | قائمة كل العملاء |
| GET/PATCH | `/api/admin/clients/[id]` | بيانات عميل + تعديل |
| GET | `/api/admin/clients/[id]/sessions` | كل جلسات عميل |
| GET/POST | `/api/admin/appointments` | المواعيد |
| GET/PATCH | `/api/admin/appointments/[id]` | موعد واحد |
| GET/POST | `/api/admin/assessment-profile/[studentId]` | ★ الملف التشخيصي (Zod validated) |
| GET | `/api/admin/sessions/student/[id]` | سجلات جلسات طالب |
| GET | `/api/admin/game-progress/[studentId]` | ★ تاريخ أداء الألعاب |
| GET/POST | `/api/admin/messages` | الرسائل |
| GET/POST | `/api/admin/reports` | التقارير |
| GET/POST | `/api/admin/programs` | البرامج |
| GET/POST | `/api/admin/payments` | المدفوعات |
| POST | `/api/admin/ai-generate-report-summary` | AI لتوليد ملخص تقرير |
| POST | `/api/admin/ai-generate-program` | AI لتوليد برنامج علاجي |
| POST | `/api/admin/seed-exercises` | بذر بيانات التمارين |
| GET/POST | `/api/admin/settings` | إعدادات الموقع |
| POST | `/api/admin/test-email` | اختبار البريد |
| POST | `/api/admin/impersonate/[parentId]` | انتحال هوية ولي أمر |

### الجلسة التفاعلية
| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/api/sessions/[appointmentId]` | قراءة سجل جلسة |
| POST | `/api/sessions/[appointmentId]` | ★ حفظ سجل جلسة |
| PATCH | `/api/sessions/[appointmentId]` | تحديث جزئي للسجل |
| POST | `/api/game-results` | ★ حفظ نتيجة لعبة واحدة |

### بوابة الوالد
| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/api/parent/me` | بيانات الوالد + أطفاله |
| GET | `/api/parent/reports` | تقارير الأطفال |
| GET | `/api/parent/game-progress` | ★ تطور الألعاب للأطفال |
| GET | `/api/parent/children/[id]/program` | برنامج طفل |

### عام
| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/api/exercises` | مكتبة التمارين (مفلترة) |
| GET/POST | `/api/appointments` | حجز موعد |
| GET | `/api/appointments/[id]` | موعد واحد |
| GET/POST | `/api/assessments` | التقييمات التشخيصية |
| GET/POST | `/api/learning-difficulties` | ملف صعوبات التعلم |
| GET/POST | `/api/messages` | رسائل الوالد |
| GET | `/api/students/[id]` | بيانات طالب |
| GET | `/api/public/settings` | إعدادات عامة (عدد أيام العرض) |
| GET | `/api/geo` | تحديد البلد |
| GET | `/api/health` | فحص صحة الخادم |

### المهام التلقائية (Cron)
| Schedule | Route | الوصف |
|----------|-------|-------|
| كل يوم 00:00 | `/api/cron/check-subscriptions` | تحديث الاشتراكات المنتهية |
| كل يوم 09:00 | `/api/cron/send-reminder` | تذكير المواعيد |
| كل أحد 08:00 | `/api/cron/weekly-report` | ★ تقرير أسبوعي لكل الأولياء |

---

## 8. الألعاب التفاعلية (12 لعبة)

كل لعبة موجودة في `components/session/exercises/` وتتلقى `difficulty: 1|2|3` وتُرجع `ExerciseResult`.

| اللعبة | الملف | المحاور المستهدفة |
|--------|-------|------------------|
| مطابقة البطاقات | `MemoryCards.tsx` | الذاكرة، الانتباه |
| تذكر التسلسل | `SequenceMemory.tsx` | الذاكرة، سرعة المعالجة |
| ذاكرة N-Back | `NBackTask.tsx` | الذاكرة، الانتباه |
| تذكر الكلمات | `WordRecall.tsx` | الذاكرة، عسر القراءة |
| مطابقة الحروف | `LetterMatch.tsx` | عسر القراءة، عسر الحساب |
| تمارين التنفس | `BreathingGuide.tsx` | الاندفاعية |
| التناسق الحركي | `TapTarget.tsx` | التناسق الحركي، سرعة المعالجة |
| سايمون يقول | `SimonSays.tsx` | التواصل الاجتماعي، الانتباه |
| سرعة رد الفعل | `ReactionGame.tsx` | سرعة المعالجة، الانتباه |
| ستروب | `StroopTest.tsx` | الاندفاعية، الانتباه |
| توقف أو اكمل | `StopSignal.tsx` | الاندفاعية |
| التعرف على المشاعر | `EmotionCards.tsx` | التواصل الاجتماعي |

### ترتيب الألعاب التلقائي (`lib/game-mapping.ts`)
الدالة `rankGamesForStudent(profile)` ترتب الألعاب تنازلياً حسب مجموع درجات الخطورة للمحاور التي تستهدفها كل لعبة:
- `none=0`, `mild=1`, `moderate=3`, `severe=5`
- أعلى 3 ألعاب تحمل علامة ★ في الشريط الجانبي للجلسة

---

## 9. مقاييس التقييم (2 مقياس)

| المقياس | الملف | الوصف |
|---------|-------|-------|
| مقياس ADHD | `ADHDScale.tsx` | تقييم الانتباه والاندفاعية — بروتوكول DSM-5 |
| صعوبات التعلم | `LearningDifficultiesScale.tsx` | عسر القراءة/الحساب/الكتابة |

---

## 10. الملف التشخيصي للطالب (`StudentAssessmentProfile`)

8 محاور يضبطها الأستاذ من لوحة التحكم لكل طالب:

| المحور | المفتاح |
|--------|---------|
| الانتباه وتشتت التركيز | `attentionDeficit` |
| الاندفاعية | `impulsivity` |
| الذاكرة العاملة | `workingMemory` |
| سرعة المعالجة | `processingSpeed` |
| عسر القراءة | `dyslexia` |
| عسر الحساب | `dyscalculia` |
| التواصل الاجتماعي | `socialCognition` |
| التناسق الحركي | `motorCoordination` |

كل محور له 4 مستويات: `none / mild / moderate / severe`

---

## 11. منصة الجلسة التفاعلية (`/session/[id]`)

أداة العمل الرئيسية للأستاذ أمين — تُفتح بنافذة كاملة أثناء الجلسة.

### الميزات
| الميزة | الوصف |
|--------|-------|
| **Jitsi Popup** | نافذة مقابلة صغيرة (480×380) في زاوية الشاشة — الأستاذ يشارك نافذة الجلسة |
| **وضع الطفل** | شبكة ألعاب كبيرة ومبسطة موجهة للطفل مباشرة |
| **وضع التركيز** | ★ يخفي الشريط الجانبي + لوحة ألعاب عائمة صغيرة |
| **الصوت التفاعلي** | ★ Web Audio API: دينغ عند الإنجاز، فانفار عند الحفظ، نبضة عند البدء |
| **توست الإنجاز** | ★ يظهر تلقائياً: 🏆 لـ 95%+، ⭐ لـ 80%+، 👍 لـ 60%+ |
| **عداد الاستخدام** | كم مرة لُعبت كل لعبة في الجلسات السابقة |
| **ترتيب ذكي** | الألعاب مرتبة تلقائياً حسب الملف التشخيصي |
| **حفظ فوري** | كل لعبة تُحفظ في `/api/game-results` فور انتهائها |
| **مؤقت الجلسة** | عداد تصاعدي يبدأ عند أول لعبة |
| **تبويبات** | تمارين / تقييم / سجل الجلسة |
| **ملاحظات** | حقل نص للأستاذ يُحفظ مع السجل |
| **مؤشر نوع الجلسة** | شارة ملونة: تقييمية/متابعة/طارئة/استشارة/تدريبية/مراجعة |

### تدفق الجلسة
```
1. فتح /session/[appointmentId]
2. تحميل تلقائي: بيانات الموعد + بيانات الطالب + الملف التشخيصي + سجل الجلسات السابقة
3. ضبط مستوى الصعوبة (1/2/3) حسب شدة الحالة
4. اختياري: فتح Jitsi للمقابلة المرئية
5. اختياري: وضع الطفل أو وضع التركيز
6. تشغيل الألعاب → كل لعبة تُحفظ فوراً
7. التقييمات (ADHD / صعوبات التعلم) إذا كانت جلسة تقييمية
8. حفظ سجل الجلسة الكامل
```

---

## 12. صفحة التطور للوالد (`/parent/progress`)

### تبويب أداء الألعاب
- **منحنى الأداء الأسبوعي**: LineChart يعرض متوسط الدرجة (0-100) أسبوعياً
- **النشاط الأسبوعي**: BarChart يعرض عدد الألعاب ودقائق التدريب
- **أداء كل لعبة**: أشرطة ملونة (أخضر/أصفر/أحمر) مع عداد عدد المرات

### تبويب تقارير الأستاذ
- متوسط التقييم السلوكي (5 محاور)
- تطور النقاط عبر الزمن
- آخر تقرير بملاحظات الأستاذ والملخص الذكي

---

## 13. نظام الأمان

### المصادقة
- **JWT يدوي** بـ HMAC-SHA256 عبر Web Crypto API (لا تعتمد على Node.js crypto)
- **Admin**: كوكي `admin_token` — يتحقق منه `verifyAdminSession(token)`
- **Parent**: كوكي `parent_token` — يتحقق منه `verifyToken(token)`
- **جميع routes** تستخدم `export const runtime = 'nodejs'` (لأن `cookies()` تحتاج Node runtime)

### Headers الأمنية (next.config.mjs)
```
Content-Security-Policy    → frame-src: Jitsi فقط | script-src: self+inline
Strict-Transport-Security  → max-age=63072000 (2 سنة)
X-Frame-Options            → SAMEORIGIN
X-Content-Type-Options     → nosniff
Referrer-Policy            → strict-origin-when-cross-origin
Permissions-Policy         → camera/microphone/geolocation/payment = ()
X-Children-Privacy         → COPPA-compliant
```

### التحقق من البيانات
- **Zod** على كل POST يصل من خارج الموقع
- تنظيف `studentId` بـ regex قبل استخدامه كمفتاح Redis: `.replace(/[^a-zA-Z0-9-_]/g, '')`
- Rate limiting على `/api/auth/*` عبر `lib/rateLimit.ts`

---

## 14. البريد الإلكتروني (`lib/mailer.ts`)

| القالب | الدالة | متى يُرسل |
|--------|--------|-----------|
| ترحيب + رمز التفعيل | `welcomeParentEmail()` | عند التسجيل |
| تأكيد الموعد | `appointmentConfirmEmail()` | بعد حجز موعد |
| إعادة تعيين كلمة المرور | `resetPasswordEmail()` | عند طلب الاستعادة |
| التقرير الأسبوعي | `weeklyProgressEmail()` | كل أحد 8 صباحاً |

---

## 15. التقارير الأسبوعية التلقائية

**Trigger**: كل أحد 08:00 UTC — Vercel يستدعي `/api/cron/weekly-report`

**المنطق**:
1. تحميل كل الأولياء النشطين (`subscriptionStatus === 'active'`)
2. لكل والد: تحميل أطفاله + تاريخ ألعابهم
3. إذا كان هناك نشاط خلال الأسبوع → إرسال بريد
4. البريد يحتوي: عدد الألعاب، متوسط الأداء، فارق التحسن مقارنة الأسبوع الماضي، أكثر 3 ألعاب مُمارسة

---

## 16. نظام الإنجازات

تُمنح تلقائياً عند إكمال التمارين المنزلية (`lib/achievements.ts`):

| الإنجاز | الشرط | المستوى |
|---------|-------|---------|
| البداية الرائعة 🌟 | أول تمرين | برونز |
| عشرة تمارين 💪 | 10 تمارين | برونز |
| خمسون تمريناً 🏆 | 50 تمرين | فضة |
| 3 أيام متتالية 🔥 | streak 3 | برونز |
| أسبوع كامل ⚡ | streak 7 | فضة |
| شهر كامل 👑 | streak 30 | ذهب |
| 100 نقطة 💯 | 100 نقطة | برونز |
| 500 نقطة 🎯 | 500 نقطة | فضة |
| 1000 نقطة 🚀 | 1000 نقطة | ذهب |

---

## 17. ثنائية اللغة (`lib/i18n.ts`)

الموقع يدعم **العربية** و**الإنجليزية** — `LangToggle` في الـ navbar يبدّل بينهما.

المقاطع المترجمة: الـ Hero، الخطط، الميزات، الـ nav، وحدات العد التنازلي.

---

## 18. ما يجب فعله لاحقاً (Roadmap)

### أولوية عالية
- [ ] تكامل بوابة دفع حقيقية (Fawran / CIB)
- [ ] إشعارات Push للمواعيد (PWA)
- [ ] تصدير تقارير PDF للأولياء
- [ ] لوحة إحصاءات للأستاذ (معدل التحسن عبر الطلاب)

### أولوية متوسطة
- [ ] تطبيق موبايل (React Native أو PWA كاملة)
- [ ] نظام اشتراك Stripe/Paddle لتحصيل تلقائي
- [ ] محتوى مرئي (فيديوهات للتمارين)
- [ ] خوارزمية تكيفية: رفع مستوى الصعوبة تلقائياً حسب الأداء

### أولوية منخفضة
- [ ] بوابة معلمين المدارس (School Portal)
- [ ] تقارير مقارنة بين الطلاب (anonymized)
- [ ] Webhooks لإشعار أدوات خارجية

---

## 19. الفروع ودورة النشر

```
main → Vercel (auto-deploy)
```

- كل push إلى `main` ينشر تلقائياً على Vercel
- لا يوجد staging بيئة منفصلة حالياً
- مفتاح النشر: متغيرات البيئة مُضافة في Vercel Dashboard

---

*هذا الملف مرجع حي — يجب تحديثه مع كل ميزة جديدة تُضاف للمنصة.*
