import { describe, expect, it } from 'vitest';
import {
  validateDatabase,
  getItemById,
  queryItems,
} from './mock-db';

describe('mock-db', () => {
  it('passes strict schema validation for all mock data entries', () => {
    expect(validateDatabase()).toBe(true);
  });

  it('can retrieve a populated item by ID', () => {
    const item = getItemById('item_p_charizard_psa10');
    expect(item).not.toBeNull();
    expect(item?.card.nome).toBe('Charizard ex');
    expect(item?.set.nome).toBe('Scarlet & Violet - 151');
    expect(item?.variant.tipo_variante).toBe('alternate_art');
  });

  it('returns null for non-existent item IDs', () => {
    const item = getItemById('non_existent');
    expect(item).toBeNull();
  });

  it('can filter items by game type (pokemon or one_piece)', () => {
    const pokemonItems = queryItems({ gioco: 'pokemon' });
    const onePieceItems = queryItems({ gioco: 'one_piece' });

    expect(pokemonItems.length).toBeGreaterThan(0);
    expect(onePieceItems.length).toBeGreaterThan(0);

    // Verify all returned items match the game filter
    pokemonItems.forEach(i => expect(i.set.gioco).toBe('pokemon'));
    onePieceItems.forEach(i => expect(i.set.gioco).toBe('one_piece'));
  });

  it('can search items by name', () => {
    const results = queryItems({ search: 'Charizard' });
    expect(results.length).toBe(1);
    expect(results[0].card.nome).toBe('Charizard ex');
  });

  it('correctly sorts items by price ascending and descending', () => {
    const asc = queryItems({ sortBy: 'price_asc' });
    const desc = queryItems({ sortBy: 'price_desc' });

    expect(asc[0].item.prezzo).toBeLessThanOrEqual(asc[asc.length - 1].item.prezzo);
    expect(desc[0].item.prezzo).toBeGreaterThanOrEqual(desc[desc.length - 1].item.prezzo);
  });
});
