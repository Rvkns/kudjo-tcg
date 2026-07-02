import { z } from 'zod';
import { GiocoSchema } from './gioco';

export const RichiestaSchema = z.object({
  nome: z.string().min(1),
  contatto: z.string().min(1),
  messaggio: z.string().min(1),
  item_riferimento: z.string().optional(),
  timestamp: z.string().min(1),
});

export type Richiesta = z.infer<typeof RichiestaSchema>;

export const PropostaVenditaSchema = z.object({
  nome: z.string().min(1),
  contatto: z.string().min(1),
  gioco: GiocoSchema,
  descrizione_carta: z.string().min(1),
  messaggio: z.string().min(1),
  foto: z.string().optional(),
  timestamp: z.string().min(1),
});

export type PropostaVendita = z.infer<typeof PropostaVenditaSchema>;
