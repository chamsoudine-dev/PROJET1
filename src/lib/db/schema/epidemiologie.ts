import {
  pgTable,
  serial,
  smallserial,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  boolean,
  jsonb,
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
import { region } from './geography';
import { district } from './geography';

export const classificationCasEnum = pgEnum('classification_cas', [
  'SUSPECT',
  'PROBABLE',
  'CONFIRME',
  'ELIMINE',
] as const);

export const issueCasEnum = pgEnum('issue_cas', [
  'GUERISON',
  'DECES',
  'EN_COURS',
  'TRANSFERE',
  'PERDUS_VUE',
] as const);

export const niveauAlerteEnum = pgEnum('niveau_alerte', [
  'FORMATION',
  'DISTRICT',
  'REGION',
  'NATIONAL',
] as const);

export const statutAlerteEnum = pgEnum('statut_alerte', [
  'ACTIVE',
  'TRAITEE',
  'RESOLUE',
  'FAUSSE_ALERTE',
] as const);

export const maladieDeclarationObligatoire = pgTable(
  'maladie_declaration_obligatoire',
  {
    id: smallserial('id').primaryKey(),
    code: varchar('code', { length: 10 }).notNull().unique(),
    nom: varchar('nom', { length: 100 }).notNull(),
    nomHaoussa: varchar('nom_haoussa', { length: 100 }),
    nomZarma: varchar('nom_zarma', { length: 100 }),
    seuilAlerteDistrict: integer('seuil_alerte_district'),
    seuilAlerteRegion: integer('seuil_alerte_region'),
    delaiDeclarationHeures: smallint('delai_declaration_heures').default(24),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('maladie_code_idx').on(t.code),
  })
);

export const casMaladie = pgTable(
  'cas_maladie',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    patientId: bigint('patient_id', { mode: 'number' }).notNull().references(() => patient.id),
    maladieId: smallint('maladie_id').notNull().references(() => maladieDeclarationObligatoire.id),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    dateDeclaration: timestamp('date_declaration', { withTimezone: true }).notNull().defaultNow(),
    dateDebutSymptomes: date('date_debut_symptomes'),
    classification: classificationCasEnum('classification').notNull(),
    issue: issueCasEnum('issue'),
    laboratoireConfirmation: boolean('laboratoire_confirmation').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    patientIdx: index('cas_patient_idx').on(t.patientId),
    maladieIdx: index('cas_maladie_idx').on(t.maladieId),
    formationIdx: index('cas_formation_idx').on(t.formationSanitaireId),
    agentIdx: index('cas_agent_idx').on(t.agentId),
    dateDeclarationIdx: index('cas_date_declaration_idx').on(t.dateDeclaration),
    classificationIdx: index('cas_classification_idx').on(t.classification),
  })
);

export const alerteEpidemiologique = pgTable(
  'alerte_epidemiologique',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    maladieId: smallint('maladie_id').notNull().references(() => maladieDeclarationObligatoire.id),
    regionId: smallint('region_id').references(() => region.id),
    districtId: integer('district_id').references(() => district.id),
    formationSanitaireId: integer('formation_sanitaire_id').references(() => formationSanitaire.id),
    periodeDebut: date('periode_debut').notNull(),
    periodeFin: date('periode_fin').notNull(),
    nombreCas: integer('nombre_cas').notNull(),
    seuilDeclenche: integer('seuil_declenche').notNull(),
    niveau: niveauAlerteEnum('niveau').notNull(),
    statut: statutAlerteEnum('statut').default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    resoluePar: bigint('resolue_par', { mode: 'number' }).references(() => utilisateur.id),
    resolueAt: timestamp('resolue_at', { withTimezone: true }),
  },
  (t) => ({
    maladieIdx: index('alerte_maladie_idx').on(t.maladieId),
    regionIdx: index('alerte_region_idx').on(t.regionId),
    districtIdx: index('alerte_district_idx').on(t.districtId),
    formationIdx: index('alerte_formation_idx').on(t.formationSanitaireId),
    statutIdx: index('alerte_statut_idx').on(t.statut),
    periodeIdx: index('alerte_periode_idx').on(t.periodeDebut, t.periodeFin),
  })
);

export const maladieDeclarationObligatoireInsertSchema = createInsertSchema(maladieDeclarationObligatoire);
export const maladieDeclarationObligatoireSelectSchema = createSelectSchema(maladieDeclarationObligatoire);
export const casMaladieInsertSchema = createInsertSchema(casMaladie);
export const casMaladieSelectSchema = createSelectSchema(casMaladie);
export const alerteEpidemiologiqueInsertSchema = createInsertSchema(alerteEpidemiologique);
export const alerteEpidemiologiqueSelectSchema = createSelectSchema(alerteEpidemiologique);

export type MaladieDeclarationObligatoire = z.infer<typeof maladieDeclarationObligatoireSelectSchema>;
export type CasMaladie = z.infer<typeof casMaladieSelectSchema>;
export type AlerteEpidemiologique = z.infer<typeof alerteEpidemiologiqueSelectSchema>;
export type ClassificationCas = (typeof classificationCasEnum.enumValues)[number];
export type IssueCas = (typeof issueCasEnum.enumValues)[number];
export type NiveauAlerte = (typeof niveauAlerteEnum.enumValues)[number];
export type StatutAlerte = (typeof statutAlerteEnum.enumValues)[number];