import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  smallint,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { patient } from './patient';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const typeLitEnum = pgEnum('type_lit', ['STANDARD', 'REA', 'NEONAT', 'MATERNITE'] as const);

export const lit = pgTable(
  'lit',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    service: varchar('service', { length: 50 }).notNull(),
    numero: varchar('numero', { length: 20 }).notNull(),
    typeLit: typeLitEnum('type_lit'),
    actif: boolean('actif').default(true),
  },
  (t) => ({
    uniqueServiceNumero: uniqueIndex('lit_unique_service_numero_idx').on(t.formationSanitaireId, t.service, t.numero),
    formationIdx: index('lit_formation_idx').on(t.formationSanitaireId),
    serviceIdx: index('lit_service_idx').on(t.service),
  })
);

export const issueHospitalisationEnum = pgEnum('issue_hospitalisation', [
  'GUERISON',
  'AMELIORATION',
  'DECES',
  'TRANSFERT',
  'FUGUE',
  'REFUS_SOINS',
] as const);

export const hospitalisation = pgTable(
  'hospitalisation',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    litId: bigint('lit_id', { mode: 'number' }).notNull().references(() => lit.id),
    agentAdmissionId: bigint('agent_admission_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    agentSortieId: bigint('agent_sortie_id', { mode: 'number' }).references(() => utilisateur.id),
    dateAdmission: timestamp('date_admission', { withTimezone: true }).notNull().defaultNow(),
    dateSortie: timestamp('date_sortie', { withTimezone: true }),
    motifAdmission: text('motif_admission'),
    diagnosticEntree: varchar('diagnostic_entree', { length: 200 }),
    diagnosticSortie: varchar('diagnostic_sortie', { length: 200 }),
    issue: issueHospitalisationEnum('issue'),
    transfertVersId: integer('transfert_vers_id').references(() => formationSanitaire.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('hospitalisation_patient_idx').on(t.patientId),
    litIdx: index('hospitalisation_lit_idx').on(t.litId),
    admissionIdx: index('hospitalisation_admission_idx').on(t.agentAdmissionId),
    dateAdmissionIdx: index('hospitalisation_date_admission_idx').on(t.dateAdmission),
  })
);

export const litInsertSchema = createInsertSchema(lit);
export const litSelectSchema = createSelectSchema(lit);
export const hospitalisationInsertSchema = createInsertSchema(hospitalisation);
export const hospitalisationSelectSchema = createSelectSchema(hospitalisation);

export type Lit = z.infer<typeof litSelectSchema>;
export type Hospitalisation = z.infer<typeof hospitalisationSelectSchema>;
export type TypeLit = (typeof typeLitEnum.enumValues)[number];
export type IssueHospitalisation = (typeof issueHospitalisationEnum.enumValues)[number];