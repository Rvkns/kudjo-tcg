import { z } from 'zod';
import { GiocoSchema } from './gioco';

export const SetSchema = z.object({
  id: z.string(),
  gioco: GiocoSchema,
  nome: z.string().min(1),
  codice_ufficiale: z.string().min(1),
  data_uscita: z.string().min(1),
  numero_carte_totali: z.number().int().positive(),
  fonte_esterna: z.string().optional(),
});

export type Set = z.infer<typeof SetSchema>;
