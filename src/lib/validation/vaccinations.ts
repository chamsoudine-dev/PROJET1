import { z } from 'zod';

export const typeVaccinSchema = z.enum([
  'BCG',
  'VPO',
  'PENTA',
  'PNEUMO',
  'ROTA',
  'VAR',
  'FIEVRE_JAUNE',
  'HPV',
  'COVID',
  'TETANOS',
  'AUTRE',
]);

export const vaccinationCreateSchema = z.object({
  patientId: z.number().int().positive(),
  vaccin: typeVaccinSchema,
  doseNumero: z.number().int().min(1).max(10),
  lotNumero: z.string().max(50).optional().nullable(),
  datePeremption: z.string().date().optional().nullable(),
  siteInjection: z.enum(['BRAS_GAUCHE', 'BRAS_DROIT', 'CUISSE']).optional(),
  reaction: z.string().max(200).optional().nullable(),
});

export type VaccinationCreateForm = z.infer<typeof vaccinationCreateSchema>;