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

export const typeMalnutritionEnum = pgEnum('type_malnutrition', ['MAM', 'MAS', 'NORMAL'] as const);
export const pecTypeEnum = pgEnum('pec_type', ['AMBULATOIRE', 'HOSPITALISATION', 'REFERENCE'] as const);

export const nutrition = pgTable(
  'nutrition',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateEvaluation: timestamp('date_evaluation', { withTimezone: true }).notNull().defaultNow(),
    ageMois: smallint('age_mois').notNull(),
    poids: numeric('poids', { precision: 5, scale: 2 }).notNull(),
    taille: numeric('taille', { precision: 5, scale: 1 }).notNull(),
    pb: numeric('pb', { precision: 4, scale: 1 }),
    oedeme: boolean('oedeme').default(false),
    classification: typeMalnutritionEnum('classification').notNull(),
    zScorePoidsTaille: numeric('z_score_poids_taille', { precision: 3, scale: 2 }),
    zScorePoidsAge: numeric('z_score_poids_age', { precision: 3, scale: 2 }),
    zScoreTailleAge: numeric('z_score_taille_age', { precision: 3, scale: 2 }),
    pecType: pecTypeEnum('pec_type'),
    rationDistribuee: jsonb('ration_distribuee'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('nutrition_patient_idx').on(t.patientId),
    formationIdx: index('nutrition_formation_idx').on(t.formationSanitaireId),
    dateIdx: index('nutrition_date_idx').on(t.dateEvaluation),
    classificationIdx: index('nutrition_classification_idx').on(t.classification),
  })
);

export const nutritionInsertSchema = createInsertSchema(nutrition);
export const nutritionSelectSchema = createSelectSchema(nutrition);

export type Nutrition = z.infer<typeof nutritionSelectSchema>;
export type TypeMalnutrition = (typeof typeMalnutritionEnum.enumValues)[number];
export type PecType = (typeof pecTypeEnum.enumValues)[number];