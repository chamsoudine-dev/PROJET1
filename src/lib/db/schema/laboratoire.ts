import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  smallint,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { patient } from './patient';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const typeExamenEnum = pgEnum('type_examen', [
  'HEMATOLOGIE',
  'BIOCHIMIE',
  'PARASITOLOGIE',
  'BACTERIOLOGIE',
  'SEROLOGIE',
  'VIROLOGIE',
  'AUTRE',
] as const);

export const statutExamenEnum = pgEnum('statut_examen', [
  'PRESCRIT',
  'EN_COURS',
  'TERMINE',
  'ANNULE',
] as const);

export const interpretationEnum = pgEnum('interpretation', [
  'NORMAL',
  'ANORMAL',
  'CRITIQUE',
] as const);

export const examenLaboratoire = pgTable(
  'examen_laboratoire',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentPrescripteurId: bigint('agent_prescripteur_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    agentRealisationId: bigint('agent_realisation_id', { mode: 'number' }).references(() => utilisateur.id),
    typeExamen: typeExamenEnum('type_examen').notNull(),
    examenCode: varchar('examen_code', { length: 20 }),
    examenLibelle: varchar('examen_libelle', { length: 150 }).notNull(),
    datePrescription: timestamp('date_prescription', { withTimezone: true }).notNull().defaultNow(),
    datePrelevement: timestamp('date_prelevement', { withTimezone: true }),
    dateResultat: timestamp('date_resultat', { withTimezone: true }),
    resultat: jsonb('resultat'),
    interpretation: interpretationEnum('interpretation'),
    commentaire: text('commentaire'),
    statut: statutExamenEnum('statut').default('PRESCRIT'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('examen_patient_idx').on(t.patientId),
    formationIdx: index('examen_formation_idx').on(t.formationSanitaireId),
    prescripteurIdx: index('examen_prescripteur_idx').on(t.agentPrescripteurId),
    statutIdx: index('examen_statut_idx').on(t.statut),
    datePrescriptionIdx: index('examen_date_prescription_idx').on(t.datePrescription),
  })
);

export const examenLaboratoireInsertSchema = createInsertSchema(examenLaboratoire);
export const examenLaboratoireSelectSchema = createSelectSchema(examenLaboratoire);

export type ExamenLaboratoire = z.infer<typeof examenLaboratoireSelectSchema>;
export type TypeExamen = (typeof typeExamenEnum.enumValues)[number];
export type StatutExamen = (typeof statutExamenEnum.enumValues)[number];
export type Interpretation = (typeof interpretationEnum.enumValues)[number];