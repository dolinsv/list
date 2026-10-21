/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  clearBrowserReportTraces,
  FORBIDDEN_STORAGE_KEYS_PREFIX,
} from '../src/utils/clearSession';

describe('privacy', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('does not write report payloads to web storage', () => {
    clearBrowserReportTraces();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      expect(key?.startsWith(FORBIDDEN_STORAGE_KEYS_PREFIX)).not.toBe(true);
    }
  });

  it('strips query and hash that could leak identifiers from URL', () => {
    const replaceState = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/list/',
        search: '?partner=100&name=Root',
        hash: '#card-100',
      },
    });
    Object.defineProperty(window, 'history', {
      configurable: true,
      value: { replaceState },
    });

    clearBrowserReportTraces();
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/list/',
    );
  });
});
