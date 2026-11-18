import { z } from 'zod';
import { utilisateur } from '@/lib/db/schema/users';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  totpCode: z.string().length(6).optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
    .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir un caractère spécial'),
  prenom: z.string().min(1, 'Le prénom est requis').max(50),
  nom: z.string().min(1, 'Le nom est requis').max(50),
  telephone: z.string().max(20, 'Le téléphone doit contenir moins de 20 caractères').optional().nullable(),
  role: z.enum(['ADMIN_NATIONAL', 'SUPERVISEUR_NATIONAL', 'SUPERVISEUR_REGIONAL', 'AGENT_SANTE']),
  regionId: z.number().int().positive().optional().nullable(),
  districtId: z.number().int().positive().optional().nullable(),
  formationSanitaireId: z.number().int().positive(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;