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

export const motifConsultationEnum = pgEnum('motif_consultation', [
  'MALADIE',
  'VACCINATION',
  'CPN',
  'ACCOUCHEMENT',
  'CPON',
  'NUTRITION',
  'PLANNING_FAMILIAL',
  'AUTRE',
] as const);

export const evolutionEnum = pgEnum('evolution', [
  'GUERISON',
  'AMELIORATION',
  'STATIONNAIRE',
  'AGGRAVATION',
  'DECES',
  'REFERENCE',
] as const);

export const consultation = pgTable(
  'consultation',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateConsultation: timestamp('date_consultation', { withTimezone: true }).notNull().defaultNow(),
    motif: motifConsultationEnum('motif').notNull(),
    cim10Code: varchar('cim10_code', { length: 10 }),
    cim10Libelle: varchar('cim10_libelle', { length: 200 }),
    diagnosticSecondaire: jsonb('diagnostic_secondaire'),
    traitement: jsonb('traitement'),
    evolution: evolutionEnum('evolution'),
    refererVersId: integer('referer_vers_id').references(() => formationSanitaire.id),
    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('consultation_patient_idx').on(t.patientId),
    formationIdx: index('consultation_formation_idx').on(t.formationSanitaireId),
    agentIdx: index('consultation_agent_idx').on(t.agentId),
    dateIdx: index('consultation_date_idx').on(t.dateConsultation),
    motifIdx: index('consultation_motif_idx').on(t.motif),
  })
);

export const consultationInsertSchema = createInsertSchema(consultation);
export const consultationSelectSchema = createSelectSchema(consultation);

export type Consultation = z.infer<typeof consultationSelectSchema>;
export type MotifConsultation = (typeof motifConsultationEnum.enumValues)[number];
export type Evolution = (typeof evolutionEnum.enumValues)[number];