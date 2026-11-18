import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  boolean,
  jsonb,
  char,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const sexeEnum = pgEnum('sexe', ['M', 'F'] as const);

export const patient = pgTable(
  'patient',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    identifiantNational: varchar('identifiant_national', { length: 20 }).notNull().unique(),
    nom: varchar('nom', { length: 100 }).notNull(),
    prenom: varchar('prenom', { length: 100 }).notNull(),
    dateNaissance: date('date_naissance'),
    ageEstime: smallint('age_estime'),
    sexe: sexeEnum('sexe').notNull(),
    village: varchar('village', { length: 100 }),
    quartier: varchar('quartier', { length: 100 }),
    personneContactNom: varchar('personne_contact_nom', { length: 100 }),
    personneContactTel: varchar('personne_contact_tel', { length: 20 }),
    telephone: varchar('telephone', { length: 20 }),
    formationCreationId: integer('formation_creation_id').notNull().references(() => formationSanitaire.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: bigint('created_by', { mode: 'number' }).notNull().references(() => utilisateur.id),
  },
  (t) => ({
    identifiantIdx: uniqueIndex('patient_identifiant_idx').on(t.identifiantNational),
    nomIdx: index('patient_nom_idx').on(t.nom),
    prenomIdx: index('patient_prenom_idx').on(t.prenom),
    dobVillageIdx: index('patient_dob_village_idx').on(t.dateNaissance, t.village),
    formationIdx: index('patient_formation_idx').on(t.formationCreationId),
  })
);

export const patientFusion = pgTable(
  'patient_fusion',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientSourceId: bigint('patient_source_id', { mode: 'number' }).notNull().references(() => patient.id),
    patientCibleId: bigint('patient_cible_id', { mode: 'number' }).notNull().references(() => patient.id),
    motif: text('motif'),
    validePar: bigint('valide_par', { mode: 'number' }).notNull().references(() => utilisateur.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    sourceIdx: index('fusion_source_idx').on(t.patientSourceId),
    cibleIdx: index('fusion_cible_idx').on(t.patientCibleId),
  })
);

export const patientInsertSchema = createInsertSchema(patient).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });
export const patientSelectSchema = createSelectSchema(patient);
export const patientFusionInsertSchema = createInsertSchema(patientFusion).omit({ id: true, createdAt: true, validePar: true });
export const patientFusionSelectSchema = createSelectSchema(patientFusion);

export type Patient = z.infer<typeof patientSelectSchema>;
export type PatientFusion = z.infer<typeof patientFusionSelectSchema>;
export type Sexe = (typeof sexeEnum.enumValues)[number];