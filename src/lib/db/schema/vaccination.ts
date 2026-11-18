import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  pgEnum,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { patient } from './patient';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const typeVaccinEnum = pgEnum('type_vaccin', [
  'BCG',
  'VPO',
  'PENTA',
  'PNEUMO',
  'ROTA',
  'VAR',
  'FIEVRE_JAUNE',
  'HPV',
  'COVID',
  'TETANOS',
  'AUTRE',
] as const);

export const vaccination = pgTable(
  'vaccination',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateVaccination: timestamp('date_vaccination', { withTimezone: true }).notNull().defaultNow(),
    vaccin: typeVaccinEnum('vaccin').notNull(),
    doseNumero: smallint('dose_numero').notNull(),
    lotNumero: varchar('lot_numero', { length: 50 }),
    datePeremption: date('date_peremption'),
    siteInjection: varchar('site_injection', { length: 50 }),
    reaction: text('reaction'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientDateIdx: index('vaccination_patient_date_idx').on(t.patientId, t.dateVaccination),
    formationIdx: index('vaccination_formation_idx').on(t.formationSanitaireId),
    agentIdx: index('vaccination_agent_idx').on(t.agentId),
    vaccinIdx: index('vaccination_vaccin_idx').on(t.vaccin),
  })
);

export const vaccinationInsertSchema = createInsertSchema(vaccination);
export const vaccinationSelectSchema = createSelectSchema(vaccination);

export type Vaccination = z.infer<typeof vaccinationSelectSchema>;
export type TypeVaccin = (typeof typeVaccinEnum.enumValues)[number];