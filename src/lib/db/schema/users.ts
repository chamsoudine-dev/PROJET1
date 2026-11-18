import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  boolean,
  smallint,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { region } from './geography';
import { district } from './geography';
import { formationSanitaire } from './geography';

export const roleUtilisateurEnum = pgEnum('role_utilisateur', [
  'ADMIN_NATIONAL',
  'SUPERVISEUR_NATIONAL',
  'SUPERVISEUR_REGIONAL',
  'AGENT_SANTE',
] as const);

export const statutUtilisateurEnum = pgEnum('statut_utilisateur', [
  'EN_ATTENTE',
  'ACTIF',
  'SUSPENDU',
  'REJETE',
] as const);

export type RoleUtilisateur = (typeof roleUtilisateurEnum.enumValues)[number];
export type StatutUtilisateur = (typeof statutUtilisateurEnum.enumValues)[number];

export const utilisateur = pgTable(
  'utilisateur',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 150 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    totpSecret: varchar('totp_secret', { length: 32 }),
    totpEnabled: boolean('totp_enabled').default(false),
    prenom: varchar('prenom', { length: 50 }).notNull(),
    nom: varchar('nom', { length: 50 }).notNull(),
    telephone: varchar('telephone', { length: 20 }),
    role: roleUtilisateurEnum('role').notNull(),
    regionId: smallint('region_id').references(() => region.id),
    districtId: integer('district_id').references(() => district.id),
    formationSanitaireId: integer('formation_sanitaire_id').references(() => formationSanitaire.id),
    statut: statutUtilisateurEnum('statut').default('EN_ATTENTE'),
    dernierConnexion: timestamp('dernier_connexion', { withTimezone: true }),
    echecsConnexion: smallint('echecs_connexion').default(0),
    verrouilleJusqu: timestamp('verrouille_jusqu', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: bigint('created_by', { mode: 'number' }),
  },
  (t) => ({
    emailIdx: uniqueIndex('utilisateur_email_idx').on(t.email),
    formationIdx: index('utilisateur_formation_idx').on(t.formationSanitaireId),
    regionIdx: index('utilisateur_region_idx').on(t.regionId),
    statutIdx: index('utilisateur_statut_idx').on(t.statut),
    roleIdx: index('utilisateur_role_idx').on(t.role),
  })
);

export const sessionConnexion = pgTable(
  'session_connexion',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    utilisateurId: bigint('utilisateur_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    formationSanitaireId: integer('formation_sanitaire_id').references(() => formationSanitaire.id),
    dateDebut: timestamp('date_debut', { withTimezone: true }).defaultNow(),
    dateFin: timestamp('date_fin', { withTimezone: true }),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userActiveIdx: index('session_user_active_idx').on(t.utilisateurId, t.active),
    tokenIdx: uniqueIndex('session_token_hash_idx').on(t.tokenHash),
  })
);

export const utilisateurInsertSchema = createInsertSchema(utilisateur).omit({ createdBy: true });
export const utilisateurSelectSchema = createSelectSchema(utilisateur);
export const sessionConnexionInsertSchema = createInsertSchema(sessionConnexion);
export const sessionConnexionSelectSchema = createSelectSchema(sessionConnexion);

export type Utilisateur = z.infer<typeof utilisateurSelectSchema>;
export type SessionConnexion = z.infer<typeof sessionConnexionSelectSchema>;