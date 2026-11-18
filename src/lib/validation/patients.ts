import { z } from 'zod';

export const sexeSchema = z.enum(['M', 'F']);

export const patientCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom doit contenir moins de 100 caractères'),
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom doit contenir moins de 100 caractères'),
  dateNaissance: z.string().date().optional().nullable(),
  ageEstime: z.number().int().min(0).max(120).optional().nullable(),
  sexe: sexeSchema,
  village: z.string().max(100).optional().nullable(),
  quartier: z.string().max(100).optional().nullable(),
  telephone: z.string().max(20).optional().nullable(),
  personneContactNom: z.string().max(100).optional().nullable(),
  personneContactTel: z.string().max(20).optional().nullable(),
}).refine(
  (data) => data.dateNaissance !== null || data.ageEstime !== null,
  {
    message: 'Date de naissance ou âge estimé est requis',
    path: ['dateNaissance'],
  }
);

export const patientSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type PatientCreateForm = z.infer<typeof patientCreateSchema>;
export type PatientSearchForm = z.infer<typeof patientSearchSchema>;