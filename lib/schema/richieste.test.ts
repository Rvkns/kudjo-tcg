import { describe, expect, it } from 'vitest';
import { PropostaVenditaSchema, RichiestaSchema } from './richieste';

describe('RichiestaSchema', () => {
  it('accepts a valid richiesta with item_riferimento', () => {
    const result = RichiestaSchema.parse({
      nome: 'Mario Rossi',
      contatto: 'mario@example.com',
      messaggio: 'Interessato a questa carta, è ancora disponibile?',
      item_riferimento: 'item_1',
      timestamp: '2026-07-01T10:00:00Z',
    });
    expect(result.item_riferimento).toBe('item_1');
  });

  it('accepts a richiesta without item_riferimento', () => {
    const result = RichiestaSchema.parse({
      nome: 'Giulia Bianchi',
      contatto: '+39 333 1234567',
      messaggio: 'Vorrei informazioni generali sulla collezione.',
      timestamp: '2026-07-01T11:00:00Z',
    });
    expect(result.item_riferimento).toBeUndefined();
  });

  it('rejects a missing nome', () => {
    expect(() =>
      RichiestaSchema.parse({
        contatto: 'mario@example.com',
        messaggio: 'Ciao',
        timestamp: '2026-07-01T10:00:00Z',
      }),
    ).toThrow();
  });
});

describe('PropostaVenditaSchema', () => {
  it('accepts a valid proposta di vendita', () => {
    const result = PropostaVenditaSchema.parse({
      nome: 'Luca Verdi',
      contatto: 'luca@example.com',
      gioco: 'pokemon',
      descrizione_carta: 'Charizard base set, condizioni buone, non gradata.',
      messaggio: 'Vorrei una valutazione.',
      timestamp: '2026-07-01T12:00:00Z',
    });
    expect(result.gioco).toBe('pokemon');
  });

  it('rejects an unknown gioco', () => {
    expect(() =>
      PropostaVenditaSchema.parse({
        nome: 'Luca Verdi',
        contatto: 'luca@example.com',
        gioco: 'magic',
        descrizione_carta: 'Una carta qualsiasi',
        messaggio: 'Ciao',
        timestamp: '2026-07-01T12:00:00Z',
      }),
    ).toThrow();
  });
});
