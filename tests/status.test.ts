import { describe, expect, it } from 'vitest';
import { decodePartnerStatus } from '../src/features/status/statusGlossary';
import { buildTelegramLink, normalizePhoneDigits } from '../src/utils/phoneLinks';

describe('status glossary', () => {
  it('decodes beauty partner and sleeping starter', () => {
    const decoded = decodePartnerStatus('(+) S*');
    expect(decoded?.matches.map((m) => m.code).sort()).toEqual(['+', 'S*'].sort());
  });

  it('prefers S* over S', () => {
    const decoded = decodePartnerStatus('(S*)');
    expect(decoded?.matches.map((m) => m.code)).toEqual(['S*']);
  });

  it('returns null for empty status', () => {
    expect(decodePartnerStatus(null)).toBeNull();
    expect(decodePartnerStatus('')).toBeNull();
  });
});

describe('phone links', () => {
  it('normalizes russian mobile numbers', () => {
    expect(normalizePhoneDigits('8 (902) 943-08-08')).toBe('79029430808');
    expect(normalizePhoneDigits('+7 902 943 08 08')).toBe('79029430808');
  });

  it('builds telegram deep link', () => {
    expect(buildTelegramLink('79029430808')).toBe('https://t.me/+79029430808');
  });
});
