import { z } from 'zod';

export const CondizioneRawSchema = z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']);
export type CondizioneRaw = z.infer<typeof CondizioneRawSchema>;

export const StatoItemSchema = z.enum(['disponibile', 'riservata', 'venduta']);
export type StatoItem = z.infer<typeof StatoItemSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  variant_id: z.string(),
  condizione_raw: CondizioneRawSchema,
  gradata: z.boolean(),
  grading_company: z.enum(['PSA', 'CGC', 'BGS', 'AFA']).optional(),
  voto: z.string().optional(),
  foto: z.array(z.string()),
  prezzo: z.number().nonnegative(),
  stato: StatoItemSchema,
  nota_storia: z.string().optional(),
  data_inserimento: z.string().min(1),
});

export type Item = z.infer<typeof ItemSchema>;
