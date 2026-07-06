import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/paths';

describe('path helpers', () => {
  it('prefixes absolute app paths with the configured base path', () => {
    expect(withBase('/companies/enemind/', '/interview/')).toBe('/interview/companies/enemind/');
    expect(withBase('/', '/interview/')).toBe('/interview/');
  });

  it('keeps external urls unchanged', () => {
    expect(withBase('https://example.com/page', '/interview/')).toBe('https://example.com/page');
  });

  it('does not prefix paths that already include the configured base path', () => {
    expect(withBase('/interview/companies/enemind/', '/interview/')).toBe('/interview/companies/enemind/');
  });
});
