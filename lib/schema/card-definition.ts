import { z } from 'zod';

export const CardDefinitionSchema = z.object({
  id: z.string(),
  set_id: z.string(),
  nome: z.string().min(1),
  numero_raccolta: z.string().min(1),
  tipo_carta: z.string().min(1),
  rarita: z.string().min(1),
  lingua_stampa: z.string().min(1),
  fonte_esterna: z.string().optional(),
});

export type CardDefinition = z.infer<typeof CardDefinitionSchema>;
