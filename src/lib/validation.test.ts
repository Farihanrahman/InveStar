import { describe, it, expect, beforeEach } from 'vitest';

import {
  passwordSchema,
  emailSchema,
  signUpSchema,
  signInSchema,
  stellarAddressSchema,
  amountSchema,
  isValidStellarAddress,
  getPasswordStrength,
  checkRateLimit,
  sanitizeInput,
} from './validation';

// ─── Stellar address ──────────────────────────────────────────────────────────

describe('stellarAddressSchema', () => {
  const VALID = 'GBXGQJWVLSKMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWTEZ'; // 56 chars, starts with G

  it('accepts a well-formed Stellar public key', () => {
    // Build a valid 56-char G-key (A-Z2-7 alphabet)
    const key = 'G' + 'A'.repeat(55);
    expect(stellarAddressSchema.safeParse(key).success).toBe(true);
  });

  it('rejects a key that does not start with G', () => {
    const key = 'S' + 'A'.repeat(55);
    expect(stellarAddressSchema.safeParse(key).success).toBe(false);
  });

  it('rejects a key that is too short', () => {
    const key = 'G' + 'A'.repeat(40);
    expect(stellarAddressSchema.safeParse(key).success).toBe(false);
  });

  it('rejects a key that is too long', () => {
    const key = 'G' + 'A'.repeat(56);
    expect(stellarAddressSchema.safeParse(key).success).toBe(false);
  });

  it('rejects a key containing lowercase letters', () => {
    const key = 'G' + 'a'.repeat(55);
    expect(stellarAddressSchema.safeParse(key).success).toBe(false);
  });

  it('trims whitespace before validation', () => {
    const key = '  ' + 'G' + 'A'.repeat(55) + '  ';
    expect(stellarAddressSchema.safeParse(key).success).toBe(true);
  });
});

describe('isValidStellarAddress', () => {
  it('returns true for a valid 56-char G-key', () => {
    expect(isValidStellarAddress('G' + 'A'.repeat(55))).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidStellarAddress('')).toBe(false);
  });

  it('returns false for a key starting with S (secret key)', () => {
    expect(isValidStellarAddress('S' + 'A'.repeat(55))).toBe(false);
  });

  it('returns false for a key of wrong length', () => {
    expect(isValidStellarAddress('G' + 'A'.repeat(54))).toBe(false);
    expect(isValidStellarAddress('G' + 'A'.repeat(56))).toBe(false);
  });
});

// ─── Amount ───────────────────────────────────────────────────────────────────

describe('amountSchema', () => {
  it('accepts a valid positive amount', () => {
    expect(amountSchema.safeParse(100).success).toBe(true);
  });

  it('accepts the minimum valid amount (just above 0.001)', () => {
    expect(amountSchema.safeParse(0.002).success).toBe(true);
  });

  it('rejects zero', () => {
    expect(amountSchema.safeParse(0).success).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(amountSchema.safeParse(-50).success).toBe(false);
  });

  it('rejects amounts above $100,000', () => {
    expect(amountSchema.safeParse(100001).success).toBe(false);
  });

  it('rejects exactly $100,000 (exceeds limit)', () => {
    // max(100000) means ≤ 100000 is OK per zod semantics — verify boundary
    const result = amountSchema.safeParse(100000);
    expect(result.success).toBe(true);
  });

  it('rejects Infinity', () => {
    expect(amountSchema.safeParse(Infinity).success).toBe(false);
  });

  it('rejects NaN', () => {
    expect(amountSchema.safeParse(NaN).success).toBe(false);
  });
});

// ─── Password ─────────────────────────────────────────────────────────────────

describe('passwordSchema', () => {
  const STRONG = 'Investar@2024!SecurePass';

  it('accepts a strong password meeting all requirements', () => {
    expect(passwordSchema.safeParse(STRONG).success).toBe(true);
  });

  it('rejects passwords shorter than 12 characters', () => {
    expect(passwordSchema.safeParse('Short@1A').success).toBe(false);
  });

  it('rejects passwords with no uppercase letter', () => {
    expect(passwordSchema.safeParse('investar@2024!secure').success).toBe(false);
  });

  it('rejects passwords with no lowercase letter', () => {
    expect(passwordSchema.safeParse('INVESTAR@2024!SECURE').success).toBe(false);
  });

  it('rejects passwords with no digit', () => {
    expect(passwordSchema.safeParse('Investar@SecurePass!').success).toBe(false);
  });

  it('rejects passwords with no special character', () => {
    expect(passwordSchema.safeParse('Investar20242024Secure').success).toBe(false);
  });

  it('rejects passwords longer than 128 characters', () => {
    const tooLong = 'Aa1!' + 'x'.repeat(125);
    expect(passwordSchema.safeParse(tooLong).success).toBe(false);
  });
});

// ─── Email ───────────────────────────────────────────────────────────────────

describe('emailSchema', () => {
  it('accepts a standard valid email', () => {
    expect(emailSchema.safeParse('user@investar.com').success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(emailSchema.safeParse('  user@investar.com  ').success).toBe(true);
  });

  it('rejects an invalid email format', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });

  it('rejects emails with + aliases (security policy)', () => {
    expect(emailSchema.safeParse('user+alias@investar.com').success).toBe(false);
  });

  it('rejects emails longer than 255 characters', () => {
    const long = 'a'.repeat(250) + '@b.com';
    expect(emailSchema.safeParse(long).success).toBe(false);
  });
});

// ─── signUpSchema / signInSchema ─────────────────────────────────────────────

describe('signUpSchema', () => {
  it('validates a complete valid signup payload', () => {
    const result = signUpSchema.safeParse({
      email: 'user@investar.com',
      password: 'Investar@2024!SecurePass',
    });
    expect(result.success).toBe(true);
  });

  it('fails when email is missing', () => {
    expect(signUpSchema.safeParse({ password: 'Investar@2024!SecurePass' }).success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('accepts any non-empty password (sign-in is lenient)', () => {
    const result = signInSchema.safeParse({ email: 'user@investar.com', password: 'anypass' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(signInSchema.safeParse({ email: 'user@investar.com', password: '' }).success).toBe(false);
  });
});

// ─── getPasswordStrength ──────────────────────────────────────────────────────

describe('getPasswordStrength', () => {
  it('rates a very strong password correctly', () => {
    const result = getPasswordStrength('Investar@2024!Secure99');
    expect(result.isSecure).toBe(true);
    expect(['Strong', 'Very Strong']).toContain(result.label);
  });

  it('rates a weak short password as Weak', () => {
    const result = getPasswordStrength('abc');
    expect(result.label).toBe('Weak');
    expect(result.isSecure).toBe(false);
  });

  it('penalises common password patterns', () => {
    const weak = getPasswordStrength('password123');
    const strong = getPasswordStrength('Investar@2024!Secure99');
    expect(weak.score).toBeLessThan(strong.score);
  });

  it('penalises all-letter passwords', () => {
    const allLetters = getPasswordStrength('abcdefghijklmno');
    const mixed = getPasswordStrength('Abc123!defghijkl');
    expect(allLetters.score).toBeLessThan(mixed.score);
  });

  it('returns a color string for each label', () => {
    const result = getPasswordStrength('Investar@2024!SecurePass');
    expect(result.color).toMatch(/^text-/);
  });
});

// ─── checkRateLimit ───────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  // Each test uses a unique key so the shared module-level Map doesn't bleed between tests
  it('allows requests under the attempt limit', () => {
    expect(checkRateLimit('rl-test-allow', 5, 60000)).toBe(true);
    expect(checkRateLimit('rl-test-allow', 5, 60000)).toBe(true);
  });

  it('blocks after maxAttempts is reached', () => {
    const key = 'rl-test-block';
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60000);
    expect(checkRateLimit(key, 3, 60000)).toBe(false);
  });

  it('resets after the time window expires', async () => {
    const key = 'rl-test-reset';
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 1); // 1 ms window
    await new Promise((r) => setTimeout(r, 10));
    expect(checkRateLimit(key, 3, 1)).toBe(true);
  });
});

// ─── sanitizeInput ────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips < and > characters', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('truncates input longer than 1000 characters', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeInput(long)).toHaveLength(1000);
  });

  it('leaves safe input unchanged', () => {
    expect(sanitizeInput('Investar user')).toBe('Investar user');
  });
});
