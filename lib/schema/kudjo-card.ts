import { z } from 'zod';

export const KudjoCardRaritaSchema = z.enum(['comune', 'non_comune', 'raro']);
export type KudjoCardRarita = z.infer<typeof KudjoCardRaritaSchema>;

export const KudjoCardElementoSchema = z.enum([
  'fuoco',
  'acqua',
  'terra',
  'ombra',
  'fulmine',
  'ghiaccio',
  'drago',
  'luce',
]);
export type KudjoCardElemento = z.infer<typeof KudjoCardElementoSchema>;

export const KudjoCardSchema = z.object({
  id: z.string(),
  numero: z.number().int().min(1).max(55),
  nome: z.string().min(1),
  elemento: KudjoCardElementoSchema,
  rarita: KudjoCardRaritaSchema,
  descrizione: z.string().min(1),
  potere: z.number().int().min(10).max(120),
});

export type KudjoCard = z.infer<typeof KudjoCardSchema>;

// A card instance found in the user's collection (may be duplicated)
export const KudjoCardInstanceSchema = z.object({
  cardId: z.string(),
  foundAt: z.string(), // ISO date string
  packTier: z.string(), // 'bronze' | 'silver' | 'gold' | 'platinum'
});
export type KudjoCardInstance = z.infer<typeof KudjoCardInstanceSchema>;

// A pending (unopened) pack in the user's inventory
export const KudjoPendingPackSchema = z.object({
  tier: z.string(),
  quantity: z.number().int().positive(),
});
export type KudjoPendingPack = z.infer<typeof KudjoPendingPackSchema>;
