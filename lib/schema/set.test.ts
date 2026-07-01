import { describe, expect, it } from 'vitest';
import { SetSchema } from './set';

describe('SetSchema', () => {
  it('accepts a valid set', () => {
    const result = SetSchema.parse({
      id: 'set_op10',
      gioco: 'one_piece',
      nome: 'Royal Blood',
      codice_ufficiale: 'OP-10',
      data_uscita: '2025-01-31',
      numero_carte_totali: 121,
      fonte_esterna: 'optcgapi:OP10',
    });
    expect(result.codice_ufficiale).toBe('OP-10');
  });

  it('accepts a set without fonte_esterna', () => {
    const result = SetSchema.parse({
      id: 'set_sv08',
      gioco: 'pokemon',
      nome: 'Surging Sparks',
      codice_ufficiale: 'SV08',
      data_uscita: '2024-11-08',
      numero_carte_totali: 191,
    });
    expect(result.fonte_esterna).toBeUndefined();
  });

  it('rejects an unknown gioco', () => {
    expect(() =>
      SetSchema.parse({
        id: 'set_x',
        gioco: 'magic',
        nome: 'X',
        codice_ufficiale: 'X-1',
        data_uscita: '2024-01-01',
        numero_carte_totali: 10,
      }),
    ).toThrow();
  });

  it('rejects a non-positive numero_carte_totali', () => {
    expect(() =>
      SetSchema.parse({
        id: 'set_x',
        gioco: 'pokemon',
        nome: 'X',
        codice_ufficiale: 'X-1',
        data_uscita: '2024-01-01',
        numero_carte_totali: 0,
      }),
    ).toThrow();
  });
});
