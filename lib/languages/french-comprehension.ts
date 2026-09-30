import type { CEFRLevel } from './placement-fr'

// Listening & reading comprehension — the two receptive skills, added on top of
// grammar/vocabulary. Listening items are spoken via the browser's French TTS;
// reading items show a short passage. Both are graded MCQs.
export interface CompItem {
  id: string
  level: CEFRLevel
  type: 'listening' | 'reading'
  text: string        // listening: the spoken sentence/dialogue · reading: the passage
  question: string    // in French
  options: string[]
  answer: number
  explain: string
}

export const FRENCH_COMPREHENSION: CompItem[] = [
  // ── Listening ──
  { id: 'l_a1_1', level: 'A1', type: 'listening', text: 'Bonjour ! Je m’appelle Léa. J’ai vingt ans et j’habite à Paris.', question: 'Où habite Léa ?', options: ['À Paris', 'À Lyon', 'À Nice', 'À Marseille'], answer: 0, explain: '« j’habite à Paris ».' },
  { id: 'l_a1_2', level: 'A1', type: 'listening', text: 'Le café coûte deux euros. Merci et bonne journée !', question: 'Combien coûte le café ?', options: ['2 euros', '10 euros', '5 euros', '1 euro'], answer: 0, explain: '« deux euros ».' },
  { id: 'l_a2_1', level: 'A2', type: 'listening', text: 'Hier, je suis allé au marché et j’ai acheté des fruits et du pain.', question: 'Qu’a-t-il acheté ?', options: ['Des fruits et du pain', 'Du lait', 'Des légumes', 'Du café'], answer: 0, explain: '« des fruits et du pain ».' },
  { id: 'l_a2_2', level: 'A2', type: 'listening', text: 'Demain, il va pleuvoir, alors prends ton parapluie !', question: 'Quel temps fera-t-il demain ?', options: ['Il va pleuvoir', 'Il fera chaud', 'Il neigera', 'Il fera beau'], answer: 0, explain: '« il va pleuvoir ».' },
  { id: 'l_b1_1', level: 'B1', type: 'listening', text: 'Je pense que le cinéma est plus intéressant que la télévision, car on découvre d’autres cultures.', question: 'Pourquoi préfère-t-il le cinéma ?', options: ['On découvre d’autres cultures', 'C’est moins cher', 'C’est plus court', 'C’est à la maison'], answer: 0, explain: '« on découvre d’autres cultures ».' },
  { id: 'l_b2_1', level: 'B2', type: 'listening', text: 'Bien que le projet soit ambitieux, l’équipe reste confiante grâce à son expérience.', question: 'Quelle est l’attitude de l’équipe ?', options: ['Confiante', 'Inquiète', 'Indifférente', 'Découragée'], answer: 0, explain: '« l’équipe reste confiante ».' },
  // ── Reading ──
  { id: 'r_a1_1', level: 'A1', type: 'reading', text: 'Marc est étudiant. Il aime le football et la musique. Le week-end, il joue avec ses amis.', question: 'Que fait Marc le week-end ?', options: ['Il joue avec ses amis', 'Il travaille', 'Il dort', 'Il voyage'], answer: 0, explain: '« il joue avec ses amis ».' },
  { id: 'r_a1_2', level: 'A1', type: 'reading', text: 'La boulangerie ouvre à sept heures du matin et ferme à huit heures du soir.', question: 'À quelle heure ferme la boulangerie ?', options: ['À 20h', 'À 7h', 'À 8h du matin', 'À midi'], answer: 0, explain: '« ferme à huit heures du soir » = 20h.' },
  { id: 'r_a2_1', level: 'A2', type: 'reading', text: 'Sofia a passé ses vacances en Italie. Elle a visité Rome et a mangé beaucoup de pizzas. Elle veut y retourner l’année prochaine.', question: 'Que veut faire Sofia l’année prochaine ?', options: ['Retourner en Italie', 'Aller en Espagne', 'Rester chez elle', 'Apprendre l’italien'], answer: 0, explain: '« elle veut y retourner ».' },
  { id: 'r_b1_1', level: 'B1', type: 'reading', text: 'De plus en plus de gens font du télétravail. Cela permet de gagner du temps de transport, mais certains se sentent isolés.', question: 'Quel est un inconvénient du télétravail ?', options: ['Le sentiment d’isolement', 'Perdre du temps', 'Trop de réunions', 'Le bruit'], answer: 0, explain: '« certains se sentent isolés ».' },
  { id: 'r_b2_1', level: 'B2', type: 'reading', text: 'La lecture stimule l’imagination et enrichit le vocabulaire. Toutefois, à l’ère du numérique, elle rivalise avec les écrans qui captent notre attention.', question: 'Selon le texte, à quoi la lecture est-elle confrontée ?', options: ['Aux écrans', 'Au manque de livres', 'Au prix élevé', 'À l’ennui'], answer: 0, explain: '« elle rivalise avec les écrans ».' },
  { id: 'r_c1_1', level: 'C1', type: 'reading', text: 'L’engouement pour les langues étrangères ne cesse de croître, porté par la mondialisation et par une quête d’ouverture culturelle qui transcende les frontières.', question: 'Qu’est-ce qui explique cet engouement ?', options: ['La mondialisation et l’ouverture culturelle', 'La baisse des prix', 'Les vacances', 'La télévision'], answer: 0, explain: '« porté par la mondialisation et… une quête d’ouverture ».' },
]

export function comprehensionFor(level: CEFRLevel, type: 'listening' | 'reading'): CompItem[] {
  return FRENCH_COMPREHENSION.filter(c => c.level === level && c.type === type)
}
