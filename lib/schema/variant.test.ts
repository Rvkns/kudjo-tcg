import { describe, expect, it } from 'vitest';
import { VariantSchema } from './variant';

describe('VariantSchema', () => {
  it('accepts a valid variant', () => {
    const result = VariantSchema.parse({
      id: 'var_1',
      card_definition_id: 'card_sv08_25',
      tipo_variante: 'alternate_art',
      note: 'Confezione booster box esclusiva',
    });
    expect(result.tipo_variante).toBe('alternate_art');
  });

  it('accepts a variant without note', () => {
    const result = VariantSchema.parse({
      id: 'var_2',
      card_definition_id: 'card_op10_119',
      tipo_variante: 'normale',
    });
    expect(result.note).toBeUndefined();
  });

  it('rejects an unknown tipo_variante', () => {
    expect(() =>
      VariantSchema.parse({
        id: 'var_3',
        card_definition_id: 'card_x',
        tipo_variante: 'ultra_rare_sparkly',
      }),
    ).toThrow();
  });
});
