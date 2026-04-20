import { describe, it, expect } from 'vitest';

import { objectToApiQueryString, extractErrorMessage, isUnauthorizedError, isCancelledRequest } from './utils';

// ─── objectToApiQueryString ───────────────────────────────────────────────────

describe('objectToApiQueryString', () => {
  it('returns empty string for an empty object', () => {
    expect(objectToApiQueryString({})).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(objectToApiQueryString()).toBe('');
  });

  it('builds a query string from a simple object', () => {
    const result = objectToApiQueryString({ page: 1, limit: 20 });
    expect(result).toBe('?page=1&limit=20');
  });

  it('omits null values', () => {
    const result = objectToApiQueryString({ page: 1, filter: null });
    expect(result).not.toContain('filter');
    expect(result).toContain('page=1');
  });

  it('omits undefined values', () => {
    const result = objectToApiQueryString({ page: 1, sort: undefined });
    expect(result).not.toContain('sort');
  });

  it('omits empty string values', () => {
    const result = objectToApiQueryString({ search: '', page: 2 });
    expect(result).not.toContain('search');
    expect(result).toContain('page=2');
  });

  it('URL-encodes special characters in values', () => {
    const result = objectToApiQueryString({ symbol: 'BDT/USD' });
    expect(result).toContain(encodeURIComponent('BDT/USD'));
  });

  it('serialises nested objects as JSON strings', () => {
    const result = objectToApiQueryString({ filters: { status: 'active' } });
    expect(result).toContain(encodeURIComponent(JSON.stringify({ status: 'active' })));
  });
});

// ─── extractErrorMessage ──────────────────────────────────────────────────────

describe('extractErrorMessage', () => {
  it('extracts response.data.message from an axios-shaped error', () => {
    const error = { response: { data: { message: 'Forbidden' }, status: 403 } };
    expect(extractErrorMessage(error)).toBe('Forbidden');
  });

  it('extracts response.data.error.message when top-level message is absent', () => {
    const error = { response: { data: { error: { message: 'Token expired' } } } };
    expect(extractErrorMessage(error)).toBe('Token expired');
  });

  it('falls back to status code when data has no message', () => {
    const error = { response: { data: {}, status: 500 } };
    expect(extractErrorMessage(error)).toBe('Error with status code 500');
  });

  it('uses the Error message for a plain Error instance', () => {
    const msg = extractErrorMessage(new Error('Network timeout'));
    expect(msg).toContain('Network timeout');
  });

  it('returns a generic message for unknown error shapes', () => {
    expect(extractErrorMessage('unexpected string')).toBe('Something went wrong.');
    expect(extractErrorMessage(null)).toBe('Something went wrong.');
    expect(extractErrorMessage(undefined)).toBe('Something went wrong.');
  });
});

// ─── isUnauthorizedError ──────────────────────────────────────────────────────

describe('isUnauthorizedError', () => {
  it('returns true for a 401 response', () => {
    expect(isUnauthorizedError({ response: { status: 401 } })).toBe(true);
  });

  it('returns false for a 403 response', () => {
    expect(isUnauthorizedError({ response: { status: 403 } })).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isUnauthorizedError(new Error('fail'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUnauthorizedError(null)).toBe(false);
  });
});

// ─── isCancelledRequest ───────────────────────────────────────────────────────

describe('isCancelledRequest', () => {
  it('detects cancellation from the word "cancel" in the message', () => {
    expect(isCancelledRequest({ message: 'Request cancel' })).toBe(true);
  });

  it('detects the specific Investar cancellation sentinel', () => {
    expect(isCancelledRequest({ message: 'Cancelled unauthorized request' })).toBe(true);
  });

  it('returns false for a regular error message', () => {
    expect(isCancelledRequest({ message: 'Network Error' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isCancelledRequest(null)).toBe(false);
  });

  it('returns false for a plain Error with an unrelated message', () => {
    expect(isCancelledRequest(new Error('timeout'))).toBe(false);
  });
});
