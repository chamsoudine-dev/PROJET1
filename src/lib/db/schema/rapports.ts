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
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const statutRapportEnum = pgEnum('statut_rapport', [
  'BROUILLON',
  'SOUMIS',
  'VALIDE',
  'REJETE',
] as const);

export const rapportMensuel = pgTable(
  'rapport_mensuel',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    annee: smallint('annee').notNull(),
    mois: smallint('mois').notNull(),
    statut: statutRapportEnum('statut').default('BROUILLON'),
    donnees: jsonb('donnees').notNull(),
    generePar: bigint('genere_par', { mode: 'number' }).references(() => utilisateur.id),
    validePar: bigint('valide_par', { mode: 'number' }).references(() => utilisateur.id),
    dateGeneration: timestamp('date_generation', { withTimezone: true }).defaultNow(),
    dateValidation: timestamp('date_validation', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueFormationAnneeMois: uniqueIndex('rapport_unique_formation_annee_mois_idx').on(t.formationSanitaireId, t.annee, t.mois),
    formationIdx: index('rapport_formation_idx').on(t.formationSanitaireId),
    anneeMoisIdx: index('rapport_annee_mois_idx').on(t.annee, t.mois),
    statutIdx: index('rapport_statut_idx').on(t.statut),
  })
);

export const rapportMensuelInsertSchema = createInsertSchema(rapportMensuel);
export const rapportMensuelSelectSchema = createSelectSchema(rapportMensuel);

export type RapportMensuel = z.infer<typeof rapportMensuelSelectSchema>;
export type StatutRapport = (typeof statutRapportEnum.enumValues)[number];