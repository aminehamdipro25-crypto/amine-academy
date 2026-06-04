const ATTENTION_TYPES = [
  {
    type: 'الانتباه الانتقائي',
    en: 'Selective Attention',
    icon: '🎯',
    problem: 'الطفل ينجذب لكل محفز في البيئة — الصوت، الحركة، الألوان — ولا يستطيع تصفية غير المهم.',
    protocol: 'بروتوكول التشتيت المُتحكَّم به: نُدرّب الطفل على الانتباه لهدف واحد بينما توجد مشتتات مُتحكَّم بها تدريجياً.',
    steps: ['تمرين النجمة الواحدة (تتبع هدف في حقل بصري مزدحم)', 'لعبة "أين الصوت؟" مع ضوضاء خلفية متدرجة', 'برنامج تحصين التشتت (DIT) — 8 أسابيع'],
    improvement: '+65%',
    improvementLabel: 'في الأداء الأكاديمي',
    color: 'border-blue-200 bg-blue-50',
    tagColor: 'bg-blue-600',
    statColor: 'text-blue-700 bg-blue-100',
  },
  {
    type: 'الانتباه المستمر',
    en: 'Sustained Attention',
    icon: '⏱️',
    problem: 'الطفل يبدأ المهمة بحماس ثم ينقطع انتباهه بعد 3-5 دقائق — المعروف بـ "تأثير الحافة الزمنية" في ADHD.',
    protocol: 'تدريب CPT (Continuous Performance Test) بالحركة: مهام انتباه مستمر مقرونة بحركة جسدية تُبقي على إثارة الدوبامين.',
    steps: ['تمرين الساعة الحركية: أداء حركة معينة عند ظهور هدف معين', 'تقنية Pomodoro المعدّلة للأطفال (5 د تركيز + 2 د حركة)', 'تمارين الاسترخاء اليقظ بين المهام'],
    improvement: '+78%',
    improvementLabel: 'في مدة التركيز',
    color: 'border-purple-200 bg-purple-50',
    tagColor: 'bg-purple-600',
    statColor: 'text-purple-700 bg-purple-100',
  },
  {
    type: 'كبح التشتت',
    en: 'Distraction Inhibition',
    icon: '🛡️',
    problem: 'الفص الجبهي في ADHD لا يُفعّل "المرشّح" الذي يمنع المعلومات غير الضرورية من الوصول للوعي.',
    protocol: 'تدريب الكبح التنفيذي: تمارين مصممة لتقوية قشرة الفص الجبهي الأمامي عبر حركات تتطلب التوقف والتفكير.',
    steps: ['لعبة "أوقف الحركة": يجب على الطفل إيقاف نفسه عند إشارة مفاجئة', 'تمرين Go/No-Go مع حركة جسدية', 'بروتوكول مزامنة الإيقاع العصبي (Interactive Metronome)'],
    improvement: '52%',
    improvementLabel: 'انخفاض الاندفاعية',
    color: 'border-emerald-200 bg-emerald-50',
    tagColor: 'bg-emerald-600',
    statColor: 'text-emerald-700 bg-emerald-100',
  },
  {
    type: 'الانتباه التنفيذي',
    en: 'Executive Attention',
    icon: '🧩',
    problem: 'ضعف التخطيط، صعوبة تحديد الأولويات، وعجز عن إدارة مهام متعددة — هذا ما يُعيق الأداء المدرسي.',
    protocol: 'برنامج التدريب على الوظيفة التنفيذية: سلسلة من التمارين المتدرجة تُنمّي الذاكرة العاملة والتخطيط والمرونة المعرفية.',
    steps: ['تحدي التسلسل المعكوس (Cogmed-style)', 'برج المهام التنفيذية: تحليل المهمة الكبيرة', 'لعبة التبديل بين القواعد (Task-Switching)'],
    improvement: '35%',
    improvementLabel: 'تقليل أعراض ADHD (دراسة 2014)',
    color: 'border-amber-200 bg-amber-50',
    tagColor: 'bg-amber-600',
    statColor: 'text-amber-700 bg-amber-100',
  },
]

export default function AttentionSection() {
  return (
    <section className="py-24 bg-white" id="attention">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            التركيز والانتباه وكبح التشتت
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5">
            الانتباه ليس مشكلة إرادة —
            <span className="block text-brand-600">إنها مشكلة تدريب عصبي</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            دماغ ADHD لا يفتقر للذكاء — يفتقر لآلية التصفية الصحيحة.
            برامجنا تُعيد بناء هذه الآلية خلية عصبية في كل مرة.
          </p>
        </div>

        {/* Science banner */}
        <div className="bg-brand-950 rounded-3xl p-7 mb-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-white font-black text-xl mb-2">
              4 أنواع من الانتباه — 4 بروتوكولات مختلفة
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              الخطأ الشائع: معالجة كل مشاكل الانتباه بنفس الطريقة.
              الطفل الذي يعاني من ضعف الانتباه الانتقائي يحتاج تدريباً مختلفاً
              عن الذي يعاني من ضعف الانتباه المستمر. نحن ندرّب كل نوع على حدة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {['CPT مُعدَّل', 'Go/No-Go', 'DIT بروتوكول', 'Cogmed-style'].map(b => (
              <span key={b} className="text-center bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ATTENTION_TYPES.map((item) => (
            <div key={item.type} className={`rounded-3xl border-2 p-7 ${item.color}`}>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <span className={`text-white text-xs font-black px-2.5 py-1 rounded-full ${item.tagColor}`}>
                      {item.en}
                    </span>
                    <h3 className="font-black text-gray-900 text-lg mt-1">{item.type}</h3>
                  </div>
                </div>
                <div className={`text-center px-4 py-2 rounded-2xl ${item.statColor}`}>
                  <div className="text-2xl font-black ltr-num">{item.improvement}</div>
                  <div className="text-xs opacity-70 leading-tight mt-0.5 max-w-[80px]">{item.improvementLabel}</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">المشكلة</p>
                <p className="text-gray-700 text-sm leading-relaxed">{item.problem}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">البروتوكول</p>
                <p className="text-gray-700 text-sm leading-relaxed">{item.protocol}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">التمارين الأساسية</p>
                <ul className="space-y-1.5">
                  {item.steps.map(s => (
                    <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-gray-400 mt-0.5 flex-shrink-0">›</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center bg-gray-50 rounded-2xl p-6">
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
            <strong className="text-gray-900">ملاحظة علمية:</strong> جميع بروتوكولات الانتباه مُصممة لتُطبَّق عبر الحركة الجسدية،
            لأن الأبحاث تُثبت أن النشاط البدني يرفع مستوى الدوبامين والنورإبينفرين في الفص الجبهي بنسبة تصل إلى 200% —
            مما يجعل التمرين الجسدي أداةً علاجيةً للتركيز لا مجرد نشاط جانبي.
            <span className="text-brand-600 font-bold"> (Ratey, 2008 — Spark: The Revolutionary New Science of Exercise and the Brain)</span>
          </p>
        </div>

      </div>
    </section>
  )
}
