// Sanitising the public chatbot's input.
//
// Extracted from the route so it can be tested: this is the only thing standing
// between an anonymous visitor and the academy's paid model. The route capped
// the number of messages but not their size, so a single request could carry
// megabytes to a billed API. The rate limit does not help — twenty unbounded
// requests an hour is still a bill.
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Roughly a long paragraph. Anything beyond it is not a question. */
export const MAX_MESSAGE_CHARS = 1000
export const MAX_MESSAGES = 10

/**
 * Returns the messages to send, or null when the payload should be refused.
 *
 * Refuses rather than repairs an unexpected role: the Anthropic API accepts
 * only 'user' and 'assistant', so anything else would spend a request before
 * failing — and a caller sending 'system' is trying something, not mistyping.
 */
export function sanitizeChatMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null
  if (input.length === 0 || input.length > MAX_MESSAGES) return null

  const out: ChatMessage[] = []
  for (const raw of input) {
    const m = raw as Partial<ChatMessage> | null
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null
    const content = typeof m.content === 'string' ? m.content.trim() : ''
    if (!content) return null
    out.push({ role: m.role, content: content.slice(0, MAX_MESSAGE_CHARS) })
  }
  return out
}
