import { z } from 'zod';

export const mouvementStockSchema = z.object({
  medicamentId: z.number().int().positive(),
  lotNumero: z.string().min(1, 'Le numéro de lot est requis'),
  datePeremption: z.string().date(),
  quantite: z.number().int().positive(),
  fournisseur: z.string().max(100).optional().nullable(),
  prixUnitaire: z.number().min(0).optional().nullable(),
  motif: z.string().min(1, 'Le motif est requis').max(100),
  referenceId: z.number().int().positive().optional().nullable(),
});

export type MouvementStockForm = z.infer<typeof mouvementStockSchema>;