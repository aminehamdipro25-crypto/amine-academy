'use client'
import { useState, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

type DecorType = 'forest' | 'water' | 'meadow' | 'school' | 'home' | 'stars'
interface SceneDef { skyTop: string; skyBot: string; ground: string; chars: string[]; decor: DecorType }
interface Question { q: string; choices: string[]; correct: number }
interface Story { id: string; title: string; icon: string; accent: string; diff: 1|2|3; pages: string[]; questions: Question[] }

// ─── SVG Decoration layers ────────────────────────────────────────────────────

function ForestDecor() {
  return (
    <g>
      <rect x="26" y="178" width="16" height="32" fill="#92400E" rx="3" />
      <ellipse cx="34" cy="155" rx="38" ry="48" fill="#166534" />
      <ellipse cx="34" cy="136" rx="30" ry="38" fill="#16A34A" />
      <ellipse cx="34" cy="120" rx="22" ry="28" fill="#22C55E" />
      <rect x="278" y="180" width="16" height="30" fill="#92400E" rx="3" />
      <ellipse cx="286" cy="158" rx="36" ry="44" fill="#15803D" />
      <ellipse cx="286" cy="140" rx="28" ry="36" fill="#16A34A" />
      <ellipse cx="286" cy="125" rx="20" ry="26" fill="#22C55E" />
      <ellipse cx="10" cy="212" rx="22" ry="16" fill="#15803D" />
      <ellipse cx="310" cy="212" rx="22" ry="16" fill="#166534" />
      <rect x="108" y="193" width="10" height="19" fill="#92400E" rx="2" />
      <ellipse cx="113" cy="180" rx="20" ry="24" fill="#16A34A" />
    </g>
  )
}

function WaterDecor({ ground }: { ground: string }) {
  return (
    <g>
      <path d="M0,190 Q40,176 80,190 Q120,204 160,190 Q200,176 240,190 Q280,204 320,190 L320,260 L0,260 Z" fill={ground} />
      <path d="M0,190 Q40,176 80,190 Q120,204 160,190 Q200,176 240,190 Q280,204 320,190" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
      <ellipse cx="70" cy="198" rx="26" ry="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <ellipse cx="250" cy="202" rx="20" ry="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <ellipse cx="60" cy="200" rx="13" ry="8" fill="#22C55E" opacity="0.7" />
      <ellipse cx="265" cy="197" rx="10" ry="6" fill="#22C55E" opacity="0.7" />
    </g>
  )
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      {[0,60,120,180,240,300].map((a, i) => {
        const r = (a * Math.PI) / 180
        return <circle key={i} cx={x + 7 * Math.cos(r)} cy={y + 7 * Math.sin(r)} r={5.5} fill={color} opacity={0.85} />
      })}
      <circle cx={x} cy={y} r={5} fill="#FDE68A" />
    </g>
  )
}

function MeadowDecor() {
  const flowers: [number, number, string][] = [
    [36,208,'#F472B6'],[62,215,'#FCD34D'],[92,210,'#60A5FA'],
    [248,208,'#FB923C'],[272,215,'#F472B6'],[298,210,'#A78BFA'],
  ]
  return (
    <g>
      {flowers.map(([x,y,c], i) => <Flower key={i} x={Number(x)} y={Number(y)} color={String(c)} />)}
      <path d="M28,222 L28,207 M33,222 L36,207 M23,222 L20,209" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M292,222 L292,207 M297,222 L300,207 M287,222 L284,209" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function SchoolDecor() {
  return (
    <g>
      <rect x="108" y="108" width="104" height="86" fill="#CBD5E1" rx="6" />
      <polygon points="103,112 160,74 217,112" fill="#94A3B8" />
      <rect x="143" y="162" width="34" height="32" fill="#64748B" rx="4" />
      <rect x="118" y="124" width="20" height="16" fill="#BAE6FD" rx="3" />
      <rect x="182" y="124" width="20" height="16" fill="#BAE6FD" rx="3" />
      <circle cx="160" cy="152" r="4" fill="#64748B" />
      <line x1="160" y1="74" x2="160" y2="50" stroke="#94A3B8" strokeWidth="2" />
      <rect x="160" y="50" width="22" height="13" fill="#F87171" rx="2" />
    </g>
  )
}

function HomeDecor() {
  return (
    <g>
      <rect x="112" y="132" width="96" height="66" fill="#FEF9C3" rx="6" />
      <polygon points="107,136 160,92 213,136" fill="#F97316" />
      <rect x="144" y="170" width="32" height="28" fill="#B45309" rx="4" />
      <rect x="120" y="147" width="20" height="16" fill="#BAE6FD" rx="3" />
      <rect x="180" y="147" width="20" height="16" fill="#BAE6FD" rx="3" />
      <rect x="178" y="104" width="13" height="20" fill="#D97706" rx="2" />
      <circle cx="184" cy="97" r="6" fill="#E2E8F0" opacity="0.75" />
      <circle cx="178" cy="91" r="4.5" fill="#E2E8F0" opacity="0.55" />
    </g>
  )
}

function StarsDecor() {
  const stars: [number,number,number][] = [[28,28,6],[82,16,5],[138,34,4],[196,18,6],[252,33,5],[292,20,4],[58,60,3],[270,62,3]]
  return (
    <g>
      {stars.map(([x,y,r], i) => {
        const pts = Array.from({length:10}, (_,j) => {
          const a = (j*Math.PI)/5 - Math.PI/2
          const rad = j%2===0 ? r : r*0.42
          return `${x + rad*Math.cos(a)},${y + rad*Math.sin(a)}`
        }).join(' ')
        return <polygon key={i} points={pts} fill="#FDE68A" opacity={0.9} />
      })}
      <text x="284" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="36">🌙</text>
    </g>
  )
}

function StoryIllustration({ scene }: { scene: SceneDef }) {
  const { skyTop, skyBot, ground, chars, decor } = scene
  const n = chars.length
  const positions = n===1 ? [{x:160,y:162}] : n===2 ? [{x:95,y:162},{x:225,y:162}] : [{x:72,y:158},{x:160,y:152},{x:248,y:158}]
  const fsize = n===1 ? 104 : n===2 ? 88 : 74

  return (
    <svg viewBox="0 0 320 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
      <defs>
        <linearGradient id="storysky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#storysky)" rx="20" />

      {decor === 'forest'  && <ForestDecor />}
      {decor === 'water'   && <WaterDecor ground={ground} />}
      {decor === 'meadow'  && <MeadowDecor />}
      {decor === 'school'  && <SchoolDecor />}
      {decor === 'home'    && <HomeDecor />}
      {decor === 'stars'   && <StarsDecor />}

      {decor !== 'water' && (
        <ellipse cx="160" cy="234" rx="186" ry="36" fill={ground} />
      )}

      {chars.map((ch, i) => (
        <text
          key={i}
          x={positions[i].x}
          y={positions[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fsize}
          style={i===0 ? {animation:'storyBounce 2.4s ease-in-out infinite'} : {}}
        >
          {ch}
        </text>
      ))}

      <style>{`
        @keyframes storyBounce {
          0%,100% { transform:translateY(0); }
          48% { transform:translateY(-12px); }
        }
      `}</style>
    </svg>
  )
}

// ─── Scene data ───────────────────────────────────────────────────────────────

const SCENES: Record<string, SceneDef[]> = {
  'lion-brave': [
    { skyTop:'#FDE68A', skyBot:'#FEF9C3', ground:'#22C55E', chars:['🦁'], decor:'forest' },
    { skyTop:'#BAE6FD', skyBot:'#E0F2FE', ground:'#4ADE80', chars:['🦁','🐇'], decor:'meadow' },
    { skyTop:'#FEF9C3', skyBot:'#FFFBEB', ground:'#6EE7B7', chars:['🦁','🐇','⭐'], decor:'meadow' },
  ],
  'rabbit-carrot': [
    { skyTop:'#86EFAC', skyBot:'#DCFCE7', ground:'#22C55E', chars:['🐇'], decor:'meadow' },
    { skyTop:'#BAE6FD', skyBot:'#E0F2FE', ground:'#34D399', chars:['🐇','💧'], decor:'meadow' },
    { skyTop:'#FEF9C3', skyBot:'#FFFDE7', ground:'#4ADE80', chars:['🐇','🥕'], decor:'meadow' },
  ],
  'little-duck': [
    { skyTop:'#7DD3FC', skyBot:'#BAE6FD', ground:'#38BDF8', chars:['🦆'], decor:'water' },
    { skyTop:'#FCA5A5', skyBot:'#FEE2E2', ground:'#4ADE80', chars:['🦆','😢'], decor:'meadow' },
    { skyTop:'#FDE68A', skyBot:'#FFFBEB', ground:'#6EE7B7', chars:['🦆','🤗'], decor:'meadow' },
  ],
  'bear-honey': [
    { skyTop:'#FEF3C7', skyBot:'#FFFBEB', ground:'#22C55E', chars:['🐻'], decor:'forest' },
    { skyTop:'#FDE68A', skyBot:'#FEF9C3', ground:'#22C55E', chars:['🐻','🍯'], decor:'forest' },
    { skyTop:'#DCFCE7', skyBot:'#F0FDF4', ground:'#4ADE80', chars:['🐻','🐝','💨'], decor:'forest' },
  ],
  'new-friend': [
    { skyTop:'#DBEAFE', skyBot:'#EFF6FF', ground:'#94A3B8', chars:['😟'], decor:'school' },
    { skyTop:'#DCFCE7', skyBot:'#F0FDF4', ground:'#4ADE80', chars:['👦','🌟'], decor:'meadow' },
    { skyTop:'#FEF9C3', skyBot:'#FFFBEB', ground:'#22C55E', chars:['⚽','😄'], decor:'meadow' },
    { skyTop:'#EDE9FE', skyBot:'#F5F3FF', ground:'#A78BFA', chars:['🤝','💛'], decor:'meadow' },
  ],
  'lost-key': [
    { skyTop:'#FEE2E2', skyBot:'#FFF1F2', ground:'#E2E8F0', chars:['🔑','😰'], decor:'home' },
    { skyTop:'#1E3A5F', skyBot:'#162942', ground:'#4C1D95', chars:['🧠','💭'], decor:'stars' },
    { skyTop:'#DBEAFE', skyBot:'#EFF6FF', ground:'#94A3B8', chars:['📚','🔑'], decor:'school' },
    { skyTop:'#DCFCE7', skyBot:'#F0FDF4', ground:'#4ADE80', chars:['😊','🏠'], decor:'home' },
  ],
  'bridge-team': [
    { skyTop:'#DBEAFE', skyBot:'#EFF6FF', ground:'#94A3B8', chars:['📋','✏️'], decor:'school' },
    { skyTop:'#FEE2E2', skyBot:'#FFF1F2', ground:'#4ADE80', chars:['💬','😤'], decor:'meadow' },
    { skyTop:'#FEF9C3', skyBot:'#FFFBEB', ground:'#34D399', chars:['💡','🤝'], decor:'meadow' },
    { skyTop:'#DCFCE7', skyBot:'#F0FDF4', ground:'#22C55E', chars:['🔨','⚙️'], decor:'meadow' },
    { skyTop:'#1E3A5F', skyBot:'#162942', ground:'#4C1D95', chars:['🏆','🎉'], decor:'stars' },
  ],
  'goal-journey': [
    { skyTop:'#7DD3FC', skyBot:'#BAE6FD', ground:'#38BDF8', chars:['🏊','😰'], decor:'water' },
    { skyTop:'#DCFCE7', skyBot:'#F0FDF4', ground:'#34D399', chars:['📅','💪'], decor:'meadow' },
    { skyTop:'#7DD3FC', skyBot:'#BAE6FD', ground:'#38BDF8', chars:['🏊','⬆️'], decor:'water' },
    { skyTop:'#DBEAFE', skyBot:'#EFF6FF', ground:'#4ADE80', chars:['🎽','😤'], decor:'meadow' },
    { skyTop:'#1E3A5F', skyBot:'#162942', ground:'#4C1D95', chars:['🥈','😊'], decor:'stars' },
  ],
}

// ─── Story content ────────────────────────────────────────────────────────────

const STORIES: Story[] = [
  {
    id:'lion-brave', title:'الأَسَدُ الطَّيِّب', icon:'🦁', accent:'#F59E0B', diff:1,
    pages:[
      'كانَ في الغابةِ أَسَدٌ كبيرٌ اسمُهُ سامي.\nكانَ قَلبُهُ طَيِّباً رَغمَ جِسمِهِ الضَّخم.',
      'رَأى سامي أَرنَباً صَغيراً يَبكي.\nسَأَلَهُ: ما بِكَ يا صَديقي؟',
      'أَمسَكَ سامي بيَدِ الأَرنَبِ وأَوصَلَهُ إلى أُمِّه.\nفَرِحَ الجَميعُ وابتَسَموا.',
    ],
    questions:[
      { q:'ما اسمُ الأَسَدِ في القِصَّة؟', choices:['نُور','سامي','كَريم'], correct:1 },
      { q:'لِماذا كانَ الأَرنَبُ يَبكي؟', choices:['كانَ جائِعاً','ضاعَ عَن أُمِّه','وَقَعَ وأَلِمَ'], correct:1 },
      { q:'ماذا فَعَلَ الأَسَدُ سامي؟', choices:['أَكَلَ الأَرنَب','أَوصَلَهُ إلى أُمِّه','تَرَكَهُ وَحدَه'], correct:1 },
    ],
  },
  {
    id:'rabbit-carrot', title:'الأَرنَبُ والجَزَر', icon:'🐇', accent:'#22C55E', diff:1,
    pages:[
      'كانَ هُناكَ أَرنَبٌ صَغيرٌ اسمُهُ بيبي.\nكانَ يُحِبُّ الجَزَرَ جِدّاً.',
      'زَرَعَ بيبي الجَزَرَ في حَديقَتِه.\nسَقاهُ كُلَّ يَومٍ بِعنايَة.',
      'نَضَجَ الجَزَرُ وأَصبَحَ كبيراً.\nقالَ بيبي: الصَّبرُ يُثمِر!',
    ],
    questions:[
      { q:'ما اسمُ الأَرنَبِ؟', choices:['بوبو','بيبي','فُفو'], correct:1 },
      { q:'ماذا زَرَعَ بيبي؟', choices:['التُّفّاح','الجَزَر','البَطِّيخ'], correct:1 },
      { q:'ما الدَّرسُ مِنَ القِصَّة؟', choices:['لا تأكُل الجَزَر','الصَّبرُ يُثمِر','الحَديقةُ صَعبة'], correct:1 },
    ],
  },
  {
    id:'little-duck', title:'البَطَّةُ الصَّغيرة', icon:'🦆', accent:'#38BDF8', diff:1,
    pages:[
      'تَعيشُ البَطَّةُ الصَّغيرةُ دودو بِجانِبِ البُحَيرة.\nتُحِبُّ السِّباحةَ كُلَّ يَوم.',
      'ذاتَ يَومٍ ابتَعَدَت دودو كثيراً.\nلَم تَجِد أُمَّها فَبَكَت.',
      'سَمِعَت الأُمُّ صَوتَها فَجاءَت مُسرِعةً.\nقالَت: لا تَبتَعِدي أَبَداً يا دودو!',
    ],
    questions:[
      { q:'أَينَ تَعيشُ دودو؟', choices:['في الجَبَل','بِجانِبِ البُحَيرة','في الغابة'], correct:1 },
      { q:'لِماذا بَكَت دودو؟', choices:['كانَت جائِعة','لَم تَجِد أُمَّها','سَقَطَت في الماء'], correct:1 },
      { q:'ما نَصيحةُ الأُمِّ؟', choices:['اسبَحي أَكثَر','كُلي جَيِّداً','لا تَبتَعِدي أَبَداً'], correct:2 },
    ],
  },
  {
    id:'bear-honey', title:'الدُّبُّ والعَسَل', icon:'🐻', accent:'#F59E0B', diff:1,
    pages:[
      'في الغابةِ دُبٌّ اسمُهُ بوبو.\nكانَ يُحِبُّ العَسَلَ أَكثَرَ مِن أَيِّ شَيء.',
      'رَأى بوبو خَليَّةَ نَحلٍ عَلى شَجَرةٍ عاليَة.\nمَدَّ يَدَهُ لِيَأخُذَ العَسَل.',
      'طارَ النَّحلُ نَحوَهُ غاضِباً!\nقالَ بوبو: العَقلُ أَحلى مِنَ العَسَل!',
    ],
    questions:[
      { q:'ما الَّذي يُحِبُّهُ بوبو؟', choices:['التُّفّاح','العَسَل','السَّمَك'], correct:1 },
      { q:'أَينَ كانَت الخَليَّة؟', choices:['عَلى الأَرض','في الماء','عَلى الشَّجَرة'], correct:2 },
      { q:'ما دَرسُ القِصَّة؟', choices:['النَّحلُ خَطير','العَقلُ أَحلى مِن العَسَل','لا تأكُل العَسَل'], correct:1 },
    ],
  },
  {
    id:'new-friend', title:'الصَّديقُ الجَديد', icon:'🤝', accent:'#8B5CF6', diff:2,
    pages:[
      'في أَوَّلِ يَومٍ بِالمَدرَسةِ الجَديدة\nجَلَسَ ياسِرُ وَحيداً في الفِناء.',
      'جاءَ طِفلٌ اسمُهُ نُور وابتَسَمَ.\nقالَ: أَتُريدُ أَن تَلعَبَ مَعَنا؟',
      'لَعِبا الكُرَةَ مَعاً وَضَحِكا كثيراً.\nأَصبَحا صَديقَينِ مُقَرَّبَين.',
      'قالَ ياسِر: الصَّداقةُ تَبدَأُ بِابتِسامةٍ واحِدة.',
    ],
    questions:[
      { q:'لِماذا جَلَسَ ياسِرُ وَحيداً؟', choices:['لِأَنَّهُ غاضِب','لَم يَعرِف أَحَداً','لِأَنَّهُ مَريض'], correct:1 },
      { q:'كَيفَ بَدَأَت الصَّداقة؟', choices:['بِالكُتُب','بِابتِسامةٍ ودَعوةٍ لِلعَّب','بِالطَّعام'], correct:1 },
      { q:'بِماذا تَبدَأُ الصَّداقة؟', choices:['بِالهَدايا','بِابتِسامةٍ واحِدة','بِالمالِ'], correct:1 },
    ],
  },
  {
    id:'lost-key', title:'المِفتاحُ الضَّائِع', icon:'🔑', accent:'#EF4444', diff:2,
    pages:[
      'وَصَلَت رانيا إلى البَيتِ وَبَحَثَت في حَقيبَتِها.\nالمِفتاحُ لَيسَ مَوجوداً!',
      'أَغمَضَت رانيا عَينَيها وَفَكَّرَت بِهُدوء.\nتَذَكَّرَت: ذَهَبتُ اليَومَ إلى المَكتَبة!',
      'ذَهَبَت إلى المَكتَبةِ بِسُرعة.\nوَجَدَت المِفتاحَ عَلى الطَّاوِلة!',
      'عَلَّقَت رانيا المِفتاحَ في مَكانٍ ثابِت.\nمِنَ الآنِ لِمِفتاحي مَكانٌ واحِدٌ فَقَط!',
    ],
    questions:[
      { q:'ما الَّذي فَقَدَتهُ رانيا؟', choices:['حَقيبَتَها','مِفتاحَها','كِتابَها'], correct:1 },
      { q:'أَينَ وَجَدَت المِفتاح؟', choices:['في الحَديقة','في المَكتَبة','في المَدرَسة'], correct:1 },
      { q:'ماذا فَعَلَت رانيا لِلمُستَقبَل؟', choices:['اشتَرَت مِفتاحاً جَديداً','عَلَّقَتهُ في مَكانٍ ثابِت','أَعطَتهُ لِأُمِّها'], correct:1 },
    ],
  },
  {
    id:'bridge-team', title:'الفَريقُ المُتَعاوِن', icon:'🏆', accent:'#14B8A6', diff:3,
    pages:[
      'طَلَبَ المُعَلِّمُ مِن ثَلاثةِ أَطفالٍ\nأَن يَبنوا جِسراً مِنَ الوَرَق.',
      'تَجادَلَ الأَطفالُ طَويلاً.\nكُلُّ واحِدٍ يُريدُ فِكرَتَهُ فَقَط.',
      'قالَت نُورة: كُلُّ واحِدٍ يَشرَحُ فِكرَتَهُ ثُمَّ نُصَوِّت.',
      'عَمِلَ الثَّلاثةُ مَعاً بِسُرعةٍ وَنَشاط.\nأَصبَحَ الجِسرُ جَميلاً وَمَتيناً.',
      'صَمَدَ الجِسرُ وَفازوا!\nالاستِماعُ أَقوى مِنَ الجِدال.',
    ],
    questions:[
      { q:'ما المُشكِلةُ الَّتي واجَهَت المَجموعة؟', choices:['نَقصُ المَوادّ','الخِلافُ عَلى التَّصميم','لَم يَفهَموا التَّعليمات'], correct:1 },
      { q:'كَيفَ حَلُّوا الخِلاف؟', choices:['القُرعة','كُلٌّ يَشرَحُ ثُمَّ يُصَوِّتون','طَلَبوا مُساعَدةَ المُعَلِّم'], correct:1 },
      { q:'ما الدَّرسُ الَّذي تَعَلَّمَهُ كَريم؟', choices:['الفَوزُ هُوَ كُلُّ شَيء','الاستِماعُ أَهَمُّ مِنَ الجِدال','العَمَلُ مُنفَرِداً أَفضَل'], correct:1 },
    ],
  },
  {
    id:'goal-journey', title:'خُطوةٌ كُلَّ يَوم', icon:'🌟', accent:'#6366F1', diff:3,
    pages:[
      'أَرادَ زِياد أَن يَسبَحَ في بُطولةِ المَدرَسة.\nلَكِنَّهُ كانَ يَتعَبُ بِسُرعة.',
      'وَضَعَ زِياد جَدوَلاً يَومِيّاً لِلتَّدريب.\nكُلَّ يَومٍ يَتَقَدَّمُ خُطوةً صَغيرة.',
      'في الأُسبوعِ الخامِسِ سَبَحَ دونَ أَن يَتَوَقَّف!\nالتَّقَدُّمُ يَحتاجُ وَقتاً وَصَبراً.',
      'جاءَ يَومُ البُطولة.\nأَخَذَ زِياد نَفَساً وَقالَ: أَنا مُستَعِدّ!',
      'جاءَ زِياد في المَركَزِ الثَّاني.\nالخُطُواتُ الصَّغيرةُ تَصنَعُ الفَرق!',
    ],
    questions:[
      { q:'ما نَصيحةُ المُدَرِّبِ لِزِياد؟', choices:['استَرِح أُسبوعاً','ابدَأ بِخُطوةٍ صَغيرةٍ كُلَّ يَوم','غَيِّر رِياضَتَك'], correct:1 },
      { q:'كَيفَ تَقَدَّمَ زِياد؟', choices:['بِسُرعةٍ كَبيرة','تَدريجِيّاً كُلَّ أُسبوع','بِدونِ تَدريب'], correct:1 },
      { q:'ما الدَّرسُ مِنَ القِصَّة؟', choices:['الفَوزُ الأَوَّلُ أَهَمُّ شَيء','الخُطُواتُ الصَّغيرةُ تَصنَعُ الفَرق','السِّباحةُ سَهلة'], correct:1 },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1 | 2 | 3
}

// ─── Choice button colors ─────────────────────────────────────────────────────

const CHOICE_COLORS = [
  { base:'#FFF7ED', border:'#FB923C', text:'#C2410C', badge:'#FB923C' },
  { base:'#EFF6FF', border:'#60A5FA', text:'#1D4ED8', badge:'#60A5FA' },
  { base:'#F0FDF4', border:'#4ADE80', text:'#15803D', badge:'#4ADE80' },
  { base:'#FDF4FF', border:'#C084FC', text:'#7E22CE', badge:'#C084FC' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function StoryReader({ onComplete, onCancel, studentAge, difficulty = 1 }: Props) {
  const startRef = useRef(Date.now())
  const doneRef  = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const available = STORIES.filter(s => {
    if (difficulty === 1 && studentAge < 9) return s.diff === 1
    if (difficulty <= 1) return s.diff === 1
    if (difficulty === 2) return s.diff <= 2
    return true
  })
  const story = available[Math.floor(Math.random() * available.length)] ?? STORIES[0]
  const scenes = SCENES[story.id] ?? []

  const [phase, setPhase]         = useState<'read'|'quiz'|'done'>('read')
  const [pageIdx, setPageIdx]     = useState(0)
  const [qIdx, setQIdx]           = useState(0)
  const [selected, setSelected]   = useState<number|null>(null)
  const [showFB, setShowFB]       = useState(false)
  const [correct, setCorrect]     = useState(0)
  const [animKey, setAnimKey]     = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cleanTimer = () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // No useEffect cleanup needed — timerRef is cancelled before each new assignment

  function nextPage() {
    cleanTimer()
    if (pageIdx < story.pages.length - 1) {
      setPageIdx(p => p + 1)
      setAnimKey(k => k + 1)
    } else {
      setPhase('quiz'); setQIdx(0); setAnimKey(k => k + 1)
    }
  }

  function prevPage() {
    cleanTimer()
    if (pageIdx > 0) { setPageIdx(p => p - 1); setAnimKey(k => k + 1) }
  }

  function handleChoice(idx: number) {
    if (selected !== null || showFB) return
    setSelected(idx)
    setShowFB(true)
    const nc = correct + (idx === story.questions[qIdx].correct ? 1 : 0)
    if (idx === story.questions[qIdx].correct) setCorrect(nc)

    timerRef.current = setTimeout(() => {
      setShowFB(false); setSelected(null)
      if (qIdx < story.questions.length - 1) {
        setQIdx(q => q + 1); setAnimKey(k => k + 1)
      } else {
        if (doneRef.current) return
        doneRef.current = true
        const score = Math.round((nc / story.questions.length) * 100)
        setPhase('done')
        timerRef.current = setTimeout(() => {
          onComplete({
            exerciseType: 'story-reader',
            exerciseLabelAr: 'مكتبة القصص',
            completedAt: new Date().toISOString(),
            score, accuracy: score,
            duration: Math.round((Date.now() - startRef.current) / 1000),
            errors: story.questions.length - nc,
            metadata: { storyId: story.id, storyTitle: story.title, pagesRead: story.pages.length, questionsCorrect: nc },
          })
        }, 2000)
      }
    }, 1400)
  }

  const currentScene = scenes[pageIdx]
  const totalPages   = story.pages.length
  const q            = phase === 'quiz' ? story.questions[qIdx] : null

  // ── DONE ──
  if (phase === 'done') {
    const score = Math.round((correct / story.questions.length) * 100)
    const stars = score >= 90 ? 3 : score >= 60 ? 2 : 1
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-8" dir="rtl">
        <div style={{fontSize:72, animation:'storyDoneBounce 0.6s ease-out'}}>
          {score >= 70 ? '🌟' : '📚'}
        </div>
        <div>
          <p className="font-black text-2xl mb-1" style={{color:'#1E293B'}}>
            {score >= 70 ? 'أَحسَنتَ! فَهِمتَ القِصَّة جَيِّداً 🎉' : 'لا بَأسَ، القِصَّةُ جَميلةٌ لِلمُراجَعة'}
          </p>
          <p className="text-gray-500 mt-1">{correct} مِن {story.questions.length} إِجاباتٍ صَحيحة</p>
        </div>
        <div className="flex gap-2 text-4xl">
          {[1,2,3].map(s => <span key={s} style={{opacity: s <= stars ? 1 : 0.2}}>⭐</span>)}
        </div>
        <div className="w-full max-w-xs rounded-full h-4 overflow-hidden" style={{background:'#E5E7EB'}}>
          <div className="h-4 rounded-full transition-all" style={{width:`${score}%`, background: score>=70 ? story.accent : '#F59E0B', transition:'width 1s ease-out'}} />
        </div>
        <style>{`@keyframes storyDoneBounce { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }`}</style>
      </div>
    )
  }

  // ── READ phase ──
  if (phase === 'read' && currentScene) {
    const lines = story.pages[pageIdx].split('\n')
    return (
      <div className="flex flex-col h-full" dir="rtl" style={{background:'#FAFAFA'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{story.icon}</span>
            <span className="font-black text-base" style={{color:'#1E293B'}}>{story.title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-sm font-bold px-3 py-1.5 rounded-xl transition-colors"
            style={{color:'#64748B', background:'#F1F5F9'}}
          >
            إِغلاق
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 px-4 pb-2 flex-shrink-0 justify-center">
          {story.pages.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === pageIdx ? 24 : 10,
                height: 10,
                background: i < pageIdx ? story.accent : i === pageIdx ? story.accent : '#E2E8F0',
                opacity: i > pageIdx ? 0.4 : 1,
              }}
            />
          ))}
        </div>

        {/* SVG Illustration — the centrepiece */}
        <div className="flex-1 min-h-0 px-3 pb-2" key={`scene-${animKey}`} style={{animation:'storySlide 0.3s ease-out'}}>
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-md">
            <StoryIllustration scene={currentScene} />
          </div>
        </div>

        {/* Story text */}
        <div
          className="mx-3 mb-2 px-4 py-3 rounded-2xl flex-shrink-0"
          style={{background:'#fff', border:`2.5px solid ${story.accent}33`, boxShadow:`0 2px 12px ${story.accent}18`}}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              className="text-center font-black leading-relaxed"
              style={{color:'#1E293B', fontSize:20, lineHeight:1.75, marginBottom: i < lines.length-1 ? 4 : 0}}
            >
              {line}
            </p>
          ))}
          <p className="text-center text-xs font-bold mt-1" style={{color:'#94A3B8'}}>صفحة {pageIdx+1} / {totalPages}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2.5 px-3 pb-4 flex-shrink-0">
          {pageIdx > 0 && (
            <button
              onClick={prevPage}
              className="flex-1 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{background:'#F1F5F9', border:'2px solid #E2E8F0', color:'#64748B'}}
            >
              ← السَّابِقة
            </button>
          )}
          <button
            onClick={nextPage}
            className="flex-1 py-3.5 rounded-2xl font-black text-base text-white transition-all active:scale-95"
            style={{background:story.accent, boxShadow:`0 4px 16px ${story.accent}55`}}
          >
            {pageIdx === totalPages - 1 ? '🎯 الأَسئِلة →' : 'التَّالِيَة →'}
          </button>
        </div>

        <style>{`
          @keyframes storySlide {
            from { opacity:0; transform:translateX(-16px); }
            to   { opacity:1; transform:translateX(0); }
          }
        `}</style>
      </div>
    )
  }

  // ── QUIZ phase ──
  if (phase === 'quiz' && q) {
    return (
      <div className="flex flex-col h-full" dir="rtl" style={{background:'#FAFAFA'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{story.icon}</span>
            <span className="font-black text-base" style={{color:'#1E293B'}}>{story.title}</span>
          </div>
          <button onClick={onCancel} className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{color:'#64748B',background:'#F1F5F9'}}>إِغلاق</button>
        </div>

        {/* Quiz progress */}
        <div className="flex gap-2 px-4 pb-3 flex-shrink-0 justify-center">
          {story.questions.map((_, i) => (
            <div key={i} className="rounded-full transition-all" style={{
              width: i === qIdx ? 24 : 10, height:10,
              background: i < qIdx ? '#22C55E' : i === qIdx ? story.accent : '#E2E8F0',
            }} />
          ))}
        </div>

        {/* Question */}
        <div
          className="mx-3 mb-3 px-5 py-4 rounded-2xl flex-shrink-0 text-center"
          key={`q-${animKey}`}
          style={{background:`${story.accent}12`, border:`2.5px solid ${story.accent}40`, animation:'storySlide 0.25s ease-out'}}
        >
          <p className="text-xs font-bold mb-1" style={{color:story.accent}}>
            سُؤالٌ {qIdx+1} مِن {story.questions.length}
          </p>
          <p className="font-black leading-snug" style={{color:'#1E293B', fontSize:20}}>{q.q}</p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2.5 px-3 pb-4 flex-1 justify-center" key={`choices-${animKey}`}>
          {q.choices.map((choice, i) => {
            const col = CHOICE_COLORS[i % CHOICE_COLORS.length]
            const isSelected = selected === i
            const isCorrect  = i === q.correct
            let bg     = col.base
            let border = col.border
            let color  = col.text
            if (showFB && isSelected && isCorrect)  { bg='#F0FFF4'; border='#22C55E'; color='#15803D' }
            else if (showFB && isSelected)           { bg='#FEF2F2'; border='#EF4444'; color='#B91C1C' }
            else if (showFB && isCorrect)            { bg='#F0FFF4'; border='#22C55E'; color='#15803D' }

            return (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                disabled={selected !== null}
                className="w-full text-right px-4 py-3.5 rounded-2xl font-bold transition-all active:scale-98 disabled:cursor-default flex items-center gap-3"
                style={{background:bg, border:`2.5px solid ${border}`, color, boxShadow:`0 2px 8px ${border}22`}}
              >
                <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm text-white" style={{background:col.badge}}>
                  {i+1}
                </span>
                <span className="flex-1">{choice}</span>
                {showFB && isCorrect   && <span className="text-xl">✅</span>}
                {showFB && isSelected && !isCorrect && <span className="text-xl">❌</span>}
              </button>
            )
          })}
        </div>

        <style>{`
          @keyframes storySlide {
            from { opacity:0; transform:translateX(-16px); }
            to   { opacity:1; transform:translateX(0); }
          }
        `}</style>
      </div>
    )
  }

  return null
}
