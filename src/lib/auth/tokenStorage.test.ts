import { describe, it, expect, beforeEach } from 'vitest';

import {
  setOmsToken,
  getOmsToken,
  removeOmsToken,
  hasOmsToken,
  setOmsUser,
  getOmsUser,
  setAuthProvider,
  getAuthProvider,
  type OmsUser,
} from './tokenStorage';

beforeEach(() => {
  localStorage.clear();
});

// ─── Token ────────────────────────────────────────────────────────────────────

describe('OMS token storage', () => {
  it('stores and retrieves a token', () => {
    setOmsToken('tok_abc123');
    expect(getOmsToken()).toBe('tok_abc123');
  });

  it('returns null when no token is stored', () => {
    expect(getOmsToken()).toBeNull();
  });

  it('hasOmsToken returns true after storing a token', () => {
    setOmsToken('tok_xyz');
    expect(hasOmsToken()).toBe(true);
  });

  it('hasOmsToken returns false when no token is stored', () => {
    expect(hasOmsToken()).toBe(false);
  });

  it('removeOmsToken clears the token', () => {
    setOmsToken('tok_to_remove');
    removeOmsToken();
    expect(getOmsToken()).toBeNull();
    expect(hasOmsToken()).toBe(false);
  });

  it('removeOmsToken also clears user data and auth provider', () => {
    setOmsToken('tok');
    setOmsUser({ id: '1', email: 'u@a.com' });
    setAuthProvider('oms');

    removeOmsToken();

    expect(getOmsUser()).toBeNull();
    expect(getAuthProvider()).toBeNull();
  });

  it('overwriting a token stores the new value', () => {
    setOmsToken('tok_first');
    setOmsToken('tok_second');
    expect(getOmsToken()).toBe('tok_second');
  });
});

// ─── User data ────────────────────────────────────────────────────────────────

describe('OMS user storage', () => {
  const user: OmsUser = { id: '42', email: 'trader@investar.com', role: 'user' };

  it('stores and retrieves user data', () => {
    setOmsUser(user);
    expect(getOmsUser()).toEqual(user);
  });

  it('returns null when no user is stored', () => {
    expect(getOmsUser()).toBeNull();
  });

  it('returns null when stored value is malformed JSON', () => {
    localStorage.setItem('oms_user_data', '{broken json');
    expect(getOmsUser()).toBeNull();
  });

  it('preserves extra fields on the user object', () => {
    const extended: OmsUser = { id: '1', email: 'a@b.com', company_id: 7, is_active: 1 };
    setOmsUser(extended);
    expect(getOmsUser()).toMatchObject({ company_id: 7, is_active: 1 });
  });
});

// ─── Auth provider ────────────────────────────────────────────────────────────

describe('auth provider storage', () => {
  it('stores and retrieves "oms" provider', () => {
    setAuthProvider('oms');
    expect(getAuthProvider()).toBe('oms');
  });

  it('stores and retrieves "google" provider', () => {
    setAuthProvider('google');
    expect(getAuthProvider()).toBe('google');
  });

  it('returns null when no provider is stored', () => {
    expect(getAuthProvider()).toBeNull();
  });

  it('overwrites the previous provider', () => {
    setAuthProvider('oms');
    setAuthProvider('google');
    expect(getAuthProvider()).toBe('google');
  });
});
