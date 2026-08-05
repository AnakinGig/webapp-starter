const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lightweight client-side email check (server + better-auth do the real work). */
export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim())
}

export const PASSWORD_MIN_LENGTH = 12

/** The policy shown to users and enforced client-side on sign-up / password change. */
export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "At least one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "At least one number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: "At least one symbol",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

function getPasswordIssues(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.label,
  )
}

export function passwordMeetsPolicy(password: string): boolean {
  return getPasswordIssues(password).length === 0
}

export type PasswordStrength = {
  /** 0 = empty, 1 = weak, 2 = fair, 3 = strong, 4 = very strong */
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

/** Detect obvious weak patterns: 3+ repeated chars, or common sequences. */
function hasWeakPattern(password: string) {
  if (/(.)\1{2,}/.test(password)) return true
  const sequences = [
    "0123", "1234", "2345", "3456", "4567", "5678", "6789", "7890",
    "abcd", "bcde", "cdef", "qwer", "asdf", "zxcv", "password", "qwerty",
  ]
  return sequences.some((seq) => password.toLowerCase().includes(seq))
}

/**
 * ANSSI-style strength estimate: length is the primary driver, then character
 * variety, with common patterns penalized. (ANSSI "Recommandations de sécurité
 * relatives aux mots de passe", 2024: ≥12 chars minimum, longer for sensitive
 * accounts, no reused/common passwords.)
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" }

  const length = password.length
  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  const patterned = hasWeakPattern(password)

  if (length < PASSWORD_MIN_LENGTH) {
    return { score: 1, label: "Weak" }
  }
  if (classes < 4 || patterned) {
    return { score: 2, label: "Fair" }
  }
  if (length < 20) {
    return { score: 3, label: "Strong" }
  }
  return { score: 4, label: "Very strong" }
}
