import type { Gioco } from './gioco';

export const TIPO_CARTA_PER_GIOCO: Record<Gioco, readonly string[]> = {
  pokemon: [
    'Pokémon',
    'Trainer - Supporter',
    'Trainer - Item',
    'Trainer - Stadium',
    'Trainer - Tool',
    'Energy - Basic',
    'Energy - Special',
  ],
  one_piece: ['Leader', 'Character', 'Event', 'Stage', 'DON!!'],
};

export const RARITA_PER_GIOCO: Record<Gioco, readonly string[]> = {
  pokemon: [
    'Common',
    'Uncommon',
    'Rare',
    'Rare Holo',
    'Illustration Rare',
    'Special Illustration Rare',
    'ACE SPEC',
    'Hyper Rare',
    'Promo',
  ],
  one_piece: ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'SP'],
};

export function isTipoCartaValido(gioco: Gioco, tipoCarta: string): boolean {
  return TIPO_CARTA_PER_GIOCO[gioco].includes(tipoCarta);
}

export function isRaritaValida(gioco: Gioco, rarita: string): boolean {
  return RARITA_PER_GIOCO[gioco].includes(rarita);
}
