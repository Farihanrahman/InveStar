import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getApiBaseUrl, getApiUrl, APP_ID, OMS_API_VERSION, getLocalTimeZone } from './constants';

// Override key used by getApiBaseUrl to bypass env vars in tests
const OVERRIDE_KEY = 'OMS_API_BASE_URL_OVERRIDE';
const TEST_BASE = 'test-api.example.com';

// ─── getApiBaseUrl ────────────────────────────────────────────────────────────

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    // Pin a known base so tests are independent of VITE_OMS_API_BASE_URL in .env
    localStorage.setItem(OVERRIDE_KEY, TEST_BASE);
  });

  it('returns a URL starting with https://', () => {
    expect(getApiBaseUrl()).toMatch(/^https:\/\//);
  });

  it('uses the localStorage override value', () => {
    expect(getApiBaseUrl()).toBe(`https://${TEST_BASE}`);
  });

  it('does not double-prefix https:// when override already starts with https', () => {
    localStorage.setItem(OVERRIDE_KEY, `https://${TEST_BASE}`);
    expect(getApiBaseUrl()).toBe(`https://${TEST_BASE}`);
  });

  it('ignores whitespace-only overrides and falls back', () => {
    localStorage.setItem(OVERRIDE_KEY, '   ');
    // Falls back to env or localhost — either way it should be a valid https URL
    expect(getApiBaseUrl()).toMatch(/^https:\/\/.+/);
  });

  it('trims whitespace from override values', () => {
    localStorage.setItem(OVERRIDE_KEY, `  ${TEST_BASE}  `);
    expect(getApiBaseUrl()).toBe(`https://${TEST_BASE}`);
  });
});

// ─── getApiUrl ────────────────────────────────────────────────────────────────

describe('getApiUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(OVERRIDE_KEY, TEST_BASE);
  });

  it('appends /api/v1 for default service', () => {
    expect(getApiUrl('default')).toBe(`https://${TEST_BASE}/api/v1`);
  });

  it('appends /api for oms service', () => {
    expect(getApiUrl('oms')).toBe(`https://${TEST_BASE}/api`);
  });

  it('appends /api for itch service', () => {
    expect(getApiUrl('itch')).toBe(`https://${TEST_BASE}/api`);
  });

  it('uses default service when called with no argument', () => {
    expect(getApiUrl()).toBe(`https://${TEST_BASE}/api/v1`);
  });

  it('always returns a non-empty string', () => {
    expect(typeof getApiUrl()).toBe('string');
    expect(getApiUrl().length).toBeGreaterThan(0);
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('APP_ID', () => {
  it('is a non-empty string', () => {
    expect(typeof APP_ID).toBe('string');
    expect(APP_ID.length).toBeGreaterThan(0);
  });

  it('defaults to InvestarOMS when no env override is present', () => {
    // In test env VITE_OMS_APP_ID is not set, so we get the fallback
    expect(APP_ID).toBe('InvestarOMS');
  });
});

describe('OMS_API_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof OMS_API_VERSION).toBe('string');
    expect(OMS_API_VERSION.length).toBeGreaterThan(0);
  });

  it('defaults to v1 when no env override is present', () => {
    expect(OMS_API_VERSION).toBe('v1');
  });
});

// ─── getLocalTimeZone ─────────────────────────────────────────────────────────

describe('getLocalTimeZone', () => {
  it('returns a non-empty string', () => {
    const tz = getLocalTimeZone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('returns UTC as fallback when Intl.DateTimeFormat throws', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementationOnce(() => {
      throw new Error('Intl not available');
    });
    expect(getLocalTimeZone()).toBe('UTC');
    vi.restoreAllMocks();
  });
});
