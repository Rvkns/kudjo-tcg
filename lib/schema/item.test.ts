import { describe, expect, it } from 'vitest';
import { ItemSchema } from './item';

describe('ItemSchema', () => {
  it('accepts a valid graded item', () => {
    const result = ItemSchema.parse({
      id: 'item_1',
      variant_id: 'var_1',
      condizione_raw: 'NM',
      gradata: true,
      grading_company: 'PSA',
      voto: '9.5',
      foto: ['https://cdn.example.com/item_1_front.jpg'],
      prezzo: 450,
      stato: 'disponibile',
      nota_storia: 'Pull diretto da booster box',
      data_inserimento: '2026-07-01',
    });
    expect(result.stato).toBe('disponibile');
  });

  it('accepts a minimal ungraded item', () => {
    const result = ItemSchema.parse({
      id: 'item_2',
      variant_id: 'var_2',
      condizione_raw: 'LP',
      gradata: false,
      foto: [],
      prezzo: 0,
      stato: 'venduta',
      data_inserimento: '2026-06-15',
    });
    expect(result.gradata).toBe(false);
  });

  it('rejects an unknown condizione_raw', () => {
    expect(() =>
      ItemSchema.parse({
        id: 'item_3',
        variant_id: 'var_1',
        condizione_raw: 'MINT',
        gradata: false,
        foto: [],
        prezzo: 10,
        stato: 'disponibile',
        data_inserimento: '2026-07-01',
      }),
    ).toThrow();
  });

  it('rejects a negative prezzo', () => {
    expect(() =>
      ItemSchema.parse({
        id: 'item_4',
        variant_id: 'var_1',
        condizione_raw: 'NM',
        gradata: false,
        foto: [],
        prezzo: -5,
        stato: 'disponibile',
        data_inserimento: '2026-07-01',
      }),
    ).toThrow();
  });
});
