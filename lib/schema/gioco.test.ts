import { describe, expect, it } from 'vitest';
import { GiocoSchema } from './gioco';

describe('GiocoSchema', () => {
  it('accepts pokemon', () => {
    expect(GiocoSchema.parse('pokemon')).toBe('pokemon');
  });

  it('accepts one_piece', () => {
    expect(GiocoSchema.parse('one_piece')).toBe('one_piece');
  });

  it('rejects an unknown game', () => {
    expect(() => GiocoSchema.parse('magic')).toThrow();
  });
});
