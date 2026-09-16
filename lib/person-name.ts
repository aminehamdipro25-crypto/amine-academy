// Sanitising a person's name before it is stored.
//
// Names are the widest untrusted channel in the platform: a parent types them
// at public registration, and they then flow into AI-generated report and
// program prompts, into email templates and into the specialist's printed
// documents. The `diagnosis` field beside them was hardened against exactly
// this — its comment in the register route says so explicitly — while the names
// were left with a bare .trim(), no length cap and no filtering at all.
//
// Three things are removed, and nothing else, so that real Arabic, French and
// English names survive untouched:
//
//   1. Line breaks and control characters. A newline is how prompt injection
//      fakes a new instruction block inside what should be one short value.
//   2. Bidirectional overrides and zero-width characters. The override range
//      reorders the text AROUND it when rendered, so a name can visually
//      rewrite a line of a clinical report without changing any other
//      character.
//   3. Anything past a sane length.
//
// Letters, marks, spaces, hyphens, apostrophes and full stops all survive — an
// Arabic name with diacritics, "Jean-Pierre" and "O'Brien" are unaffected.

/** Long enough for any real name, short enough to be worthless as a payload. */
export const MAX_NAME_LENGTH = 60

// Control characters, zero-width joiners/marks, and the bidi override ranges.
const CONTROL_AND_BIDI = new RegExp(
  '[\\u0000-\\u001F\\u007F\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F]',
  'g',
)

export function sanitizePersonName(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(CONTROL_AND_BIDI, ' ')
    // Collapse the runs those removals leave behind, so a padded value cannot
    // masquerade as a short one.
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim()
}

/** True when the value survives sanitising as a usable name. */
export function isUsableName(input: unknown): boolean {
  return sanitizePersonName(input).length > 0
}
