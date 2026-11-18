import { z } from 'zod';

export const motifConsultationSchema = z.enum([
  'MALADIE',
  'VACCINATION',
  'CPN',
  'ACCOUCHEMENT',
  'CPON',
  'NUTRITION',
  'PLANNING_FAMILIAL',
  'AUTRE',
]);

export const evolutionSchema = z.enum([
  'GUERISON',
  'AMELIORATION',
  'STATIONNAIRE',
  'AGGRAVATION',
  'DECES',
  'REFERENCE',
]);

export const consultationCreateSchema = z.object({
  patientId: z.number().int().positive(),
  motif: motifConsultationSchema,
  cim10Code: z.string().max(10).optional().nullable(),
  cim10Libelle: z.string().max(200).optional().nullable(),
  diagnosticSecondaire: z.array(z.string()).optional(),
  traitement: z.array(
    z.object({
      dci: z.string().min(1),
      dose: z.string(),
      duree: z.string(),
      frequence: z.string(),
    })
  ).optional(),
  evolution: evolutionSchema.optional(),
  refererVersId: z.number().int().positive().optional().nullable(),
  observations: z.string().max(2000).optional().nullable(),
});

export type ConsultationCreateForm = z.infer<typeof consultationCreateSchema>;