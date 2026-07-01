import { z } from 'zod';

export const GiocoSchema = z.enum(['pokemon', 'one_piece']);
export type Gioco = z.infer<typeof GiocoSchema>;
