import { z } from 'zod';

export const cpnCreateSchema = z.object({
  patientId: z.number().int().positive(),
  numeroCpn: z.number().int().min(1).max(8),
  ageGestationnel: z.number().int().min(1).max(42).optional().nullable(),
  taille: z.number().min(30).max(100).optional().nullable(), // cm
  poids: z.number().min(2).max(200).optional().nullable(), // kg
  tensionArterielle: z.string().max(20).optional().nullable(),
  hb: z.number().min(0).max(20).optional().nullable(), // g/dL
  vihTest: z.boolean().optional(),
  vihResultat: z.enum(['POSITIF', 'NEGATIF']).optional().nullable(),
  paluTest: z.boolean().optional(),
  paluResultat: z.enum(['POSITIF', 'NEGATIF']).optional().nullable(),
  tetanosDoses: z.number().int().min(0).default(0),
  ferAcideFolique: z.boolean().default(false),
  mildiose: z.boolean().default(false),
  observations: z.string().max(2000).optional().nullable(),
});

export const accouchementCreateSchema = z.object({
  patientId: z.number().int().positive(),
  typeAccouchement: z.enum(['VOIE_BASSE', 'CESARIENNE', 'INSTRUMENTAL']),
  issueMere: z.enum(['VIVANTE', 'DECEDEE', 'TRANSFEREE']),
  issueEnfant: z.enum(['VIVANT', 'MORT_NE', 'DECEDE', 'TRANSFERE']),
  poidsEnfant: z.number().min(500).max(5000).optional().nullable(), // g
  apgar1min: z.number().int().min(0).max(10).optional().nullable(),
  apgar5min: z.number().int().min(0).max(10).optional().nullable(),
  complicationMere: z.string().max(500).optional().nullable(),
  complicationEnfant: z.string().max(500).optional().nullable(),
});

export type CpnCreateForm = z.infer<typeof cpnCreateSchema>;
export type AccouchementCreateForm = z.infer<typeof accouchementCreateSchema>;