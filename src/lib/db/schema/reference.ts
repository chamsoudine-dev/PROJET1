import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  smallint,
  integer,
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

export const urgenceEnum = pgEnum('urgence', ['NORMALE', 'URGENTE', 'TRES_URGENTE'] as const);
export const statutReferenceEnum = pgEnum('statut_reference', [
  'INITIEE',
  'EN_COURS',
  'ARRIVEE',
  'PRISE_EN_CHARGE',
  'RETOUR',
  'ANNULEE',
] as const);

export const reference = pgTable(
  'reference',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationOrigineId: integer('formation_origine_id').notNull().references(() => formationSanitaire.id),
    formationDestinationId: integer('formation_destination_id').notNull().references(() => formationSanitaire.id),
    agentInitiateurId: bigint('agent_initiateur_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    agentRecepteurId: bigint('agent_recepteur_id', { mode: 'number' }).references(() => utilisateur.id),
    motif: text('motif').notNull(),
    urgence: urgenceEnum('urgence').notNull(),
    dateInitiation: timestamp('date_initiation', { withTimezone: true }).notNull().defaultNow(),
    dateArrivee: timestamp('date_arrivee', { withTimezone: true }),
    datePriseEnCharge: timestamp('date_prise_en_charge', { withTimezone: true }),
    dateRetour: timestamp('date_retour', { withTimezone: true }),
    compteRendu: text('compte_rendu'),
    medicamentsDonnes: jsonb('medicaments_donnes'),
    statut: statutReferenceEnum('statut').default('INITIEE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('reference_patient_idx').on(t.patientId),
    origineIdx: index('reference_origine_idx').on(t.formationOrigineId),
    destinationIdx: index('reference_destination_idx').on(t.formationDestinationId),
    initiateurIdx: index('reference_initiateur_idx').on(t.agentInitiateurId),
    statutIdx: index('reference_statut_idx').on(t.statut),
    dateIdx: index('reference_date_idx').on(t.dateInitiation),
  })
);

export const referenceInsertSchema = createInsertSchema(reference);
export const referenceSelectSchema = createSelectSchema(reference);

export type Reference = z.infer<typeof referenceSelectSchema>;
export type Urgence = (typeof urgenceEnum.enumValues)[number];
export type StatutReference = (typeof statutReferenceEnum.enumValues)[number];