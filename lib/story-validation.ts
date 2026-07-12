import type { Story } from './types'

const MAX_PAGES = 20
const MAX_QUESTIONS = 10

// Shared sanity checks for both create and update — story content is
// specialist-authored (not user-generated at large), but a malformed record
// (empty pages, a question with no correct choice) would silently break the
// reader for every child, so validate shape before it ever reaches Redis.
// The `ok` boolean discriminant (rather than an optional-vs-required `error`
// field) is what lets TS actually narrow `.data` after `if (!result.ok)`.
export type SanitizeStoryResult =
  | { ok: true; data: Omit<Story, 'id' | 'createdAt' | 'order'> }
  | { ok: false; error: string }

export function sanitizeStoryInput(body: unknown): SanitizeStoryResult {
  const b = (body ?? {}) as Record<string, unknown>

  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 120) : ''
  if (!title) return { ok: false, error: 'عنوان القصة مطلوب' }

  const icon = typeof b.icon === 'string' && b.icon.trim() ? b.icon.trim().slice(0, 8) : '📖'
  const accent = typeof b.accent === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(b.accent) ? b.accent : '#6B46F0'
  const diff = ([1, 2, 3].includes(Number(b.diff)) ? Number(b.diff) : 1) as 1 | 2 | 3

  const pagesRaw = Array.isArray(b.pages) ? b.pages : []
  const pages = pagesRaw
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .slice(0, MAX_PAGES)
    .map(p => p.slice(0, 2000))
  if (pages.length === 0) return { ok: false, error: 'أضف صفحة واحدة على الأقل بنص' }

  const pageImagesRaw = Array.isArray(b.pageImages) ? b.pageImages : []
  const pageImages = pages.map((_, i) => {
    const v = pageImagesRaw[i]
    return typeof v === 'string' && v.startsWith('https://') ? v : null
  })

  const questionsRaw = Array.isArray(b.questions) ? b.questions : []
  const questions = questionsRaw.slice(0, MAX_QUESTIONS).map((q) => {
    const qq = (q ?? {}) as Record<string, unknown>
    const text = typeof qq.q === 'string' ? qq.q.trim().slice(0, 300) : ''
    const choicesRaw = Array.isArray(qq.choices) ? qq.choices : []
    const choices = choicesRaw
      .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
      .slice(0, 6)
      .map(c => c.slice(0, 150))
    const correct = Number.isInteger(qq.correct) ? Number(qq.correct) : 0
    return { q: text, choices, correct: Math.min(Math.max(correct, 0), Math.max(choices.length - 1, 0)) }
  }).filter(q => q.q && q.choices.length >= 2)

  return {
    ok: true,
    data: { title, icon, accent, diff, pages, pageImages, questions },
  }
}
