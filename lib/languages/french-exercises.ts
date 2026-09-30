import type { CEFRLevel } from './placement-fr'

// Auto-gradable French practice items, grouped by CEFR level. The answer key
// stays server-side; the learner earns XP for correct answers. `explain` gives
// a short pedagogical note shown after answering.
export interface Exercise {
  id: string
  level: CEFRLevel
  skill: string
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export const FRENCH_EXERCISES: Exercise[] = [
  // A1
  { id: 'e_a1_1', level: 'A1', skill: 'grammaire', prompt: 'Tu ___ étudiant ?', options: ['es', 'est', 'suis', 'sont'], answer: 0, explain: '« tu » → es (verbe être).' },
  { id: 'e_a1_2', level: 'A1', skill: 'vocabulaire', prompt: 'Le matin, je bois un ___.', options: ['café', 'chaise', 'livre', 'stylo'], answer: 0, explain: 'On boit un café.' },
  { id: 'e_a1_3', level: 'A1', skill: 'grammaire', prompt: 'Ce sont ___ amis.', options: ['mes', 'mon', 'ma', 'le'], answer: 0, explain: 'Pluriel → « mes ».' },
  { id: 'e_a1_4', level: 'A1', skill: 'conjugaison', prompt: 'Vous ___ où ?', options: ['habitez', 'habite', 'habites', 'habitent'], answer: 0, explain: '« vous » → habitez.' },
  { id: 'e_a1_5', level: 'A1', skill: 'nombres', prompt: '« 15 » s’écrit :', options: ['quinze', 'cinq', 'cinquante', 'quatorze'], answer: 0, explain: '15 = quinze.' },
  // A2
  { id: 'e_a2_1', level: 'A2', skill: 'conjugaison', prompt: 'Hier, elle ___ un film.', options: ['a regardé', 'regarde', 'regardera', 'regarder'], answer: 0, explain: 'Passé composé : a regardé.' },
  { id: 'e_a2_2', level: 'A2', skill: 'grammaire', prompt: 'Je vais ___ boulangerie.', options: ['à la', 'au', 'aux', 'le'], answer: 0, explain: 'à + la (féminin) = à la.' },
  { id: 'e_a2_3', level: 'A2', skill: 'vocabulaire', prompt: 'J’ai mal à la ___.', options: ['tête', 'table', 'ville', 'porte'], answer: 0, explain: 'Avoir mal à la tête.' },
  { id: 'e_a2_4', level: 'A2', skill: 'grammaire', prompt: 'Il fait froid, ___ un manteau !', options: ['mets', 'met', 'mettre', 'mis'], answer: 0, explain: 'Impératif (tu) : mets.' },
  { id: 'e_a2_5', level: 'A2', skill: 'conjugaison', prompt: 'Demain, nous ___ partir.', options: ['allons', 'allez', 'vont', 'va'], answer: 0, explain: 'Futur proche : nous allons.' },
  // B1
  { id: 'e_b1_1', level: 'B1', skill: 'conjugaison', prompt: 'Si j’étais riche, je ___ le monde.', options: ['voyagerais', 'voyage', 'voyagerai', 'voyageais'], answer: 0, explain: 'Conditionnel après « si + imparfait ».' },
  { id: 'e_b1_2', level: 'B1', skill: 'grammaire', prompt: 'Le film ___ j’ai parlé est génial.', options: ['dont', 'que', 'où', 'qui'], answer: 0, explain: '« parler de » → dont.' },
  { id: 'e_b1_3', level: 'B1', skill: 'grammaire', prompt: 'Il faut que tu ___ patient.', options: ['sois', 'es', 'seras', 'étais'], answer: 0, explain: 'Subjonctif : que tu sois.' },
  { id: 'e_b1_4', level: 'B1', skill: 'vocabulaire', prompt: 'Elle a ___ son examen avec brio.', options: ['réussi', 'raté', 'oublié', 'perdu'], answer: 0, explain: 'Réussir = succeed.' },
  { id: 'e_b1_5', level: 'B1', skill: 'conjugaison', prompt: 'Quand j’étais petit, je ___ au parc.', options: ['jouais', 'ai joué', 'jouerai', 'joue'], answer: 0, explain: 'Habitude au passé : imparfait.' },
  // B2
  { id: 'e_b2_1', level: 'B2', skill: 'grammaire', prompt: 'Bien qu’il ___ tard, il a fini.', options: ['soit', 'est', 'était', 'sera'], answer: 0, explain: '« bien que » → subjonctif.' },
  { id: 'e_b2_2', level: 'B2', skill: 'grammaire', prompt: 'La maison ___ les volets sont bleus.', options: ['dont', 'que', 'où', 'qui'], answer: 0, explain: 'Possession → dont.' },
  { id: 'e_b2_3', level: 'B2', skill: 'vocabulaire', prompt: 'Son discours était ___ : personne n’a compris.', options: ['confus', 'clair', 'limpide', 'précis'], answer: 0, explain: 'Confus = unclear.' },
  { id: 'e_b2_4', level: 'B2', skill: 'conjugaison', prompt: 'Dès qu’il ___ fini, il partira.', options: ['aura', 'a', 'avait', 'aurait'], answer: 0, explain: 'Futur antérieur : aura fini.' },
  { id: 'e_b2_5', level: 'B2', skill: 'grammaire', prompt: 'Ce livre a été ___ par un grand auteur.', options: ['écrit', 'écrire', 'écrivant', 'écris'], answer: 0, explain: 'Voix passive : a été écrit.' },
  // C1
  { id: 'e_c1_1', level: 'C1', skill: 'vocabulaire', prompt: 'Il a défendu son idée ___.', options: ['avec conviction', 'à contrecœur', 'par hasard', 'sans le vouloir'], answer: 0, explain: 'Avec conviction = firmly.' },
  { id: 'e_c1_2', level: 'C1', skill: 'grammaire', prompt: '___ que soient les difficultés, il persévère.', options: ['Quelles', 'Quel', 'Quels', 'Que'], answer: 0, explain: 'Accord : difficultés (f. pl.) → Quelles.' },
  { id: 'e_c1_3', level: 'C1', skill: 'vocabulaire', prompt: 'Cette décision risque de ___ des tensions.', options: ['susciter', 'apaiser', 'éviter', 'ignorer'], answer: 0, explain: 'Susciter = to provoke.' },
  // C2
  { id: 'e_c2_1', level: 'C2', skill: 'vocabulaire', prompt: 'Un raisonnement ___ semble juste mais est trompeur.', options: ['spécieux', 'rigoureux', 'limpide', 'probant'], answer: 0, explain: 'Spécieux = plausible but false.' },
  { id: 'e_c2_2', level: 'C2', skill: 'expression', prompt: '« Tirer son épingle du jeu » signifie :', options: ['se sortir habilement d’une situation', 'perdre au jeu', 'coudre un habit', 'abandonner'], answer: 0, explain: 'Idiome : s’en sortir habilement.' },
]

export function exercisesForLevel(level: CEFRLevel): Exercise[] {
  return FRENCH_EXERCISES.filter(e => e.level === level)
}
