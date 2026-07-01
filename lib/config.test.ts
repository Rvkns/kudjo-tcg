import { describe, expect, it } from 'vitest';
import { SOGLIA_PREZZO_PUBBLICO } from './config';

describe('SOGLIA_PREZZO_PUBBLICO', () => {
  it('is set to 1000 euro', () => {
    expect(SOGLIA_PREZZO_PUBBLICO).toBe(1000);
  });
});
