import { z } from 'zod';

export const TipoVarianteSchema = z.enum([
  'normale',
  'holo',
  'reverse_holo',
  '1st_edition',
  'shadowless',
  'alternate_art',
  'full_art',
  'parallel',
  'manga_art',
  'secret_rare',
  'promo',
]);
export type TipoVariante = z.infer<typeof TipoVarianteSchema>;

export const VariantSchema = z.object({
  id: z.string(),
  card_definition_id: z.string(),
  tipo_variante: TipoVarianteSchema,
  note: z.string().optional(),
});

export type Variant = z.infer<typeof VariantSchema>;
