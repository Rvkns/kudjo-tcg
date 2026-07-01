import { describe, expect, it } from 'vitest';
import { CardDefinitionSchema } from './card-definition';

describe('CardDefinitionSchema', () => {
  it('accepts a valid card definition', () => {
    const result = CardDefinitionSchema.parse({
      id: 'card_op10_119',
      set_id: 'set_op10',
      nome: 'Monkey D. Luffy',
      numero_raccolta: 'OP10-119',
      tipo_carta: 'Leader',
      rarita: 'L',
      lingua_stampa: 'en',
      fonte_esterna: 'optcgapi:OP10-119',
    });
    expect(result.nome).toBe('Monkey D. Luffy');
  });

  it('accepts a card definition without fonte_esterna', () => {
    const result = CardDefinitionSchema.parse({
      id: 'card_sv08_25',
      set_id: 'set_sv08',
      nome: 'Pikachu ex',
      numero_raccolta: '025/191',
      tipo_carta: 'Pokémon',
      rarita: 'Hyper Rare',
      lingua_stampa: 'it',
    });
    expect(result.fonte_esterna).toBeUndefined();
  });

  it('rejects an empty tipo_carta', () => {
    expect(() =>
      CardDefinitionSchema.parse({
        id: 'card_x',
        set_id: 'set_x',
        nome: 'X',
        numero_raccolta: '1/1',
        tipo_carta: '',
        rarita: 'Common',
        lingua_stampa: 'en',
      }),
    ).toThrow();
  });

  it('rejects a missing nome', () => {
    expect(() =>
      CardDefinitionSchema.parse({
        id: 'card_x',
        set_id: 'set_x',
        numero_raccolta: '1/1',
        tipo_carta: 'Pokémon',
        rarita: 'Common',
        lingua_stampa: 'en',
      }),
    ).toThrow();
  });
});
