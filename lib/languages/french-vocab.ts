import type { CEFRLevel } from './placement-fr'

// French vocabulary deck by CEFR level. Fed into the spaced-repetition reviewer.
export interface VocabCard { id: string; level: CEFRLevel; fr: string; ar: string; en: string }

export const FRENCH_VOCAB: VocabCard[] = [
  // A1
  { id: 'v_a1_1', level: 'A1', fr: 'bonjour', ar: 'مرحباً / صباح الخير', en: 'hello' },
  { id: 'v_a1_2', level: 'A1', fr: 'merci', ar: 'شكراً', en: 'thank you' },
  { id: 'v_a1_3', level: 'A1', fr: 'la maison', ar: 'المنزل', en: 'house' },
  { id: 'v_a1_4', level: 'A1', fr: 'l’eau', ar: 'الماء', en: 'water' },
  { id: 'v_a1_5', level: 'A1', fr: 'manger', ar: 'يأكل', en: 'to eat' },
  { id: 'v_a1_6', level: 'A1', fr: 'aujourd’hui', ar: 'اليوم', en: 'today' },
  { id: 'v_a1_7', level: 'A1', fr: 'l’ami / l’amie', ar: 'الصديق / الصديقة', en: 'friend' },
  { id: 'v_a1_8', level: 'A1', fr: 'le travail', ar: 'العمل', en: 'work' },
  // A2
  { id: 'v_a2_1', level: 'A2', fr: 'hier', ar: 'أمس', en: 'yesterday' },
  { id: 'v_a2_2', level: 'A2', fr: 'le voyage', ar: 'السفر / الرحلة', en: 'trip' },
  { id: 'v_a2_3', level: 'A2', fr: 'la santé', ar: 'الصحّة', en: 'health' },
  { id: 'v_a2_4', level: 'A2', fr: 'acheter', ar: 'يشتري', en: 'to buy' },
  { id: 'v_a2_5', level: 'A2', fr: 'le quartier', ar: 'الحيّ', en: 'neighbourhood' },
  { id: 'v_a2_6', level: 'A2', fr: 'content(e)', ar: 'سعيد', en: 'happy' },
  { id: 'v_a2_7', level: 'A2', fr: 'bientôt', ar: 'قريباً', en: 'soon' },
  // B1
  { id: 'v_b1_1', level: 'B1', fr: 'l’avis', ar: 'الرأي', en: 'opinion' },
  { id: 'v_b1_2', level: 'B1', fr: 'réussir', ar: 'ينجح', en: 'to succeed' },
  { id: 'v_b1_3', level: 'B1', fr: 'l’environnement', ar: 'البيئة', en: 'environment' },
  { id: 'v_b1_4', level: 'B1', fr: 'malgré', ar: 'رغم', en: 'despite' },
  { id: 'v_b1_5', level: 'B1', fr: 'le souvenir', ar: 'الذكرى', en: 'memory' },
  { id: 'v_b1_6', level: 'B1', fr: 'convaincre', ar: 'يقنع', en: 'to convince' },
  // B2
  { id: 'v_b2_1', level: 'B2', fr: 'l’enjeu', ar: 'الرهان / ما هو على المحكّ', en: 'stake / issue' },
  { id: 'v_b2_2', level: 'B2', fr: 'pertinent(e)', ar: 'وجيه / في محلّه', en: 'relevant' },
  { id: 'v_b2_3', level: 'B2', fr: 'la concurrence', ar: 'المنافسة', en: 'competition' },
  { id: 'v_b2_4', level: 'B2', fr: 'mettre en évidence', ar: 'يُبرز', en: 'to highlight' },
  { id: 'v_b2_5', level: 'B2', fr: 'toutefois', ar: 'ومع ذلك', en: 'however' },
  // C1
  { id: 'v_c1_1', level: 'C1', fr: 'susciter', ar: 'يثير / يُحدث', en: 'to provoke' },
  { id: 'v_c1_2', level: 'C1', fr: 'la nuance', ar: 'الفارق الدقيق', en: 'nuance' },
  { id: 'v_c1_3', level: 'C1', fr: 'incontournable', ar: 'لا مفرّ منه', en: 'unavoidable / essential' },
  { id: 'v_c1_4', level: 'C1', fr: 'entériner', ar: 'يُقرّ / يعتمد', en: 'to ratify' },
  // C2
  { id: 'v_c2_1', level: 'C2', fr: 'spécieux', ar: 'مُضلِّل رغم ظاهره الصحيح', en: 'specious' },
  { id: 'v_c2_2', level: 'C2', fr: 'l’implicite', ar: 'الضمني', en: 'the implicit' },
  { id: 'v_c2_3', level: 'C2', fr: 'éluder', ar: 'يتهرّب / يتجنّب', en: 'to evade' },
]

export function vocabForLevel(level: CEFRLevel): VocabCard[] {
  return FRENCH_VOCAB.filter(v => v.level === level)
}
