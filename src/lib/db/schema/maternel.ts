import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  smallint,
  integer,
  boolean,
  numeric,
  pgEnum,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { patient } from './patient';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const typeAccouchementEnum = pgEnum('type_accouchement', [
  'VOIE_BASSE',
  'CESARIENNE',
  'INSTRUMENTAL',
] as const);

export const issueMereEnum = pgEnum('issue_mere', ['VIVANTE', 'DECEDEE', 'TRANSFEREE'] as const);
export const issueEnfantEnum = pgEnum('issue_enfant', ['VIVANT', 'MORT_NE', 'DECEDE', 'TRANSFERE'] as const);

export const cpn = pgTable(
  'cpn',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateCpn: timestamp('date_cpn', { withTimezone: true }).notNull().defaultNow(),
    numeroCpn: smallint('numero_cpn').notNull(),
    ageGestationnel: smallint('age_gestationnel'),
    taille: numeric('taille', { precision: 4, scale: 1 }),
    poids: numeric('poids', { precision: 5, scale: 2 }),
    tensionArterielle: varchar('tension_arterielle', { length: 20 }),
    hb: numeric('hb', { precision: 3, scale: 1 }),
    vihTest: boolean('vih_test'),
    vihResultat: varchar('vih_resultat', { length: 20 }),
    paluTest: boolean('palu_test'),
    paluResultat: varchar('palu_resultat', { length: 20 }),
    tetanosDoses: smallint('tetanos_doses').default(0),
    ferAcideFolique: boolean('fer_acide_folique').default(false),
    mildiose: boolean('mildiose').default(false),
    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('cpn_patient_idx').on(t.patientId),
    formationIdx: index('cpn_formation_idx').on(t.formationSanitaireId),
    dateIdx: index('cpn_date_idx').on(t.dateCpn),
  })
);

export const accouchement = pgTable(
  'accouchement',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateAccouchement: timestamp('date_accouchement', { withTimezone: true }).notNull().defaultNow(),
    typeAccouchement: typeAccouchementEnum('type_accouchement').notNull(),
    issueMere: issueMereEnum('issue_mere').notNull(),
    issueEnfant: issueEnfantEnum('issue_enfant').notNull(),
    poidsEnfant: numeric('poids_enfant', { precision: 5, scale: 3 }),
    apgar1min: smallint('apgar_1min'),
    apgar5min: smallint('apgar_5min'),
    complicationMere: text('complication_mere'),
    complicationEnfant: text('complication_enfant'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('accouchement_patient_idx').on(t.patientId),
    formationIdx: index('accouchement_formation_idx').on(t.formationSanitaireId),
    dateIdx: index('accouchement_date_idx').on(t.dateAccouchement),
  })
);

export const cpon = pgTable(
  'cpon',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    enfantId: bigint('enfant_id', { mode: 'number' }).references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateCpon: timestamp('date_cpon', { withTimezone: true }).notNull().defaultNow(),
    numeroCpon: smallint('numero_cpon').notNull(),
    etatMere: varchar('etat_mere', { length: 50 }),
    etatEnfant: varchar('etat_enfant', { length: 50 }),
    allaitementExclusif: boolean('allaitement_exclusif'),
    vaccinationEnfant: boolean('vaccination_enfant'),
    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('cpon_patient_idx').on(t.patientId),
    enfantIdx: index('cpon_enfant_idx').on(t.enfantId),
    formationIdx: index('cpon_formation_idx').on(t.formationSanitaireId),
    dateIdx: index('cpon_date_idx').on(t.dateCpon),
  })
);

export const cpnInsertSchema = createInsertSchema(cpn);
export const cpnSelectSchema = createSelectSchema(cpn);
export const accouchementInsertSchema = createInsertSchema(accouchement);
export const accouchementSelectSchema = createSelectSchema(accouchement);
export const cponInsertSchema = createInsertSchema(cpon);
export const cponSelectSchema = createSelectSchema(cpon);

export type Cpn = z.infer<typeof cpnSelectSchema>;
export type Accouchement = z.infer<typeof accouchementSelectSchema>;
export type Cpon = z.infer<typeof cponSelectSchema>;
export type TypeAccouchement = (typeof typeAccouchementEnum.enumValues)[number];
export type IssueMere = (typeof issueMereEnum.enumValues)[number];
export type IssueEnfant = (typeof issueEnfantEnum.enumValues)[number];