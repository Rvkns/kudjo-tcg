import { describe, expect, it } from 'vitest';
import { isRaritaValida, isTipoCartaValido } from './taxonomy';

describe('isTipoCartaValido', () => {
  it('accepts a known Pokémon card type', () => {
    expect(isTipoCartaValido('pokemon', 'Pokémon')).toBe(true);
  });

  it('accepts a known One Piece card type', () => {
    expect(isTipoCartaValido('one_piece', 'Leader')).toBe(true);
  });

  it('rejects an unknown card type', () => {
    expect(isTipoCartaValido('pokemon', 'Not A Real Type')).toBe(false);
  });
});

describe('isRaritaValida', () => {
  it('accepts a known Pokémon rarity', () => {
    expect(isRaritaValida('pokemon', 'Hyper Rare')).toBe(true);
  });

  it('accepts a known One Piece rarity', () => {
    expect(isRaritaValida('one_piece', 'SEC')).toBe(true);
  });

  it('rejects an unknown rarity', () => {
    expect(isRaritaValida('one_piece', 'Mythic')).toBe(false);
  });
});
