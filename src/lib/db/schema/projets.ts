import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  numeric,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { utilisateur } from './users';
import { region } from './geography';
import { district } from './geography';

export const typePartenaireEnum = pgEnum('type_partenaire', [
  'MINISTERE',
  'INSTITUTION_PUBLIQUE',
  'ONG_NATIONALE',
  'ONG_INTERNATIONALE',
  'AGENCE_ONU',
  'BAILLEUR_BILATERAL',
  'BAILLEUR_MULTILATERAL',
  'FONDATION',
  'AUTRE',
] as const);

export const partenaire = pgTable(
  'partenaire',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nom: varchar('nom', { length: 150 }).notNull(),
    sigle: varchar('sigle', { length: 20 }),
    type: typePartenaireEnum('type').notNull(),
    paysSiege: varchar('pays_siege', { length: 50 }),
    adresse: text('adresse'),
    telephone: varchar('telephone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    siteWeb: varchar('site_web', { length: 200 }),
    personneContactNom: varchar('personne_contact_nom', { length: 100 }),
    personneContactFonction: varchar('personne_contact_fonction', { length: 100 }),
    personneContactEmail: varchar('personne_contact_email', { length: 100 }),
    personneContactTel: varchar('personne_contact_tel', { length: 20 }),
    actif: boolean('actif').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    nomIdx: index('partenaire_nom_idx').on(t.nom),
    typeIdx: index('partenaire_type_idx').on(t.type),
    actifIdx: index('partenaire_actif_idx').on(t.actif),
  })
);

export const statutProjetEnum = pgEnum('statut_projet', [
  'EN_PREPARATION',
  'EN_COURS',
  'SUSPENDU',
  'TERMINE',
  'ANNULE',
] as const);

export const projet = pgTable(
  'projet',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    partenaireId: bigint('partenaire_id', { mode: 'number' }).notNull().references(() => partenaire.id),
    titre: varchar('titre', { length: 200 }).notNull(),
    description: text('description'),
    regions: integer('regions').array().notNull().default([]),
    districts: integer('districts').array().notNull().default([]),
    dateDebut: date('date_debut').notNull(),
    dateFin: date('date_fin'),
    budgetTotal: numeric('budget_total', { precision: 18, scale: 2 }),
    devise: varchar('devise', { length: 3 }).default('XOF'),
    statut: statutProjetEnum('statut').default('EN_COURS'),
    responsableNom: varchar('responsable_nom', { length: 100 }),
    responsableEmail: varchar('responsable_email', { length: 100 }),
    responsableTelephone: varchar('responsable_telephone', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: bigint('created_by', { mode: 'number' }).references(() => utilisateur.id),
  },
  (t) => ({
    partenaireIdx: index('projet_partenaire_idx').on(t.partenaireId),
    statutIdx: index('projet_statut_idx').on(t.statut),
    dateDebutIdx: index('projet_date_debut_idx').on(t.dateDebut),
  })
);

export const frequenceCollecteEnum = pgEnum('frequence_collecte', [
  'MENSUEL',
  'TRIMESTRIEL',
  'SEMESTRIEL',
  'ANNUEL',
  'PONCTUEL',
] as const);

export const indicateurProjet = pgTable(
  'indicateur_projet',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projetId: bigint('projet_id', { mode: 'number' }).notNull().references(() => projet.id),
    code: varchar('code', { length: 30 }).notNull(),
    nom: varchar('nom', { length: 150 }).notNull(),
    definition: text('definition'),
    unite: varchar('unite', { length: 30 }),
    frequenceCollecte: frequenceCollecteEnum('frequence_collecte').notNull(),
    valeurCible: numeric('valeur_cible', { precision: 14, scale: 4 }),
    disagregation: jsonb('disagregation'),
    actif: boolean('actif').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    projetIdx: index('indicateur_projet_idx').on(t.projetId),
    codeIdx: uniqueIndex('indicateur_code_unique_idx').on(t.projetId, t.code),
    actifIdx: index('indicateur_actif_idx').on(t.actif),
  })
);

export const valeurIndicateur = pgTable(
  'valeur_indicateur',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    indicateurId: bigint('indicateur_id', { mode: 'number' }).notNull().references(() => indicateurProjet.id),
    periodeDebut: date('periode_debut').notNull(),
    periodeFin: date('periode_fin').notNull(),
    valeur: numeric('valeur', { precision: 14, scale: 4 }).notNull(),
    disagregationValeurs: jsonb('disagregation_valeurs'),
    source: varchar('source', { length: 50 }),
    collectePar: bigint('collecte_par', { mode: 'number' }).references(() => utilisateur.id),
    validePar: bigint('valide_par', { mode: 'number' }).references(() => utilisateur.id),
    dateCollecte: timestamp('date_collecte', { withTimezone: true }).defaultNow(),
    dateValidation: timestamp('date_validation', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    indicateurIdx: index('valeur_indicateur_idx').on(t.indicateurId),
    periodeIdx: index('valeur_periode_idx').on(t.periodeDebut, t.periodeFin),
    collecteIdx: index('valeur_collecte_idx').on(t.collectePar),
  })
);

export const partenaireInsertSchema = createInsertSchema(partenaire);
export const partenaireSelectSchema = createSelectSchema(partenaire);
export const projetInsertSchema = createInsertSchema(projet);
export const projetSelectSchema = createSelectSchema(projet);
export const indicateurProjetInsertSchema = createInsertSchema(indicateurProjet);
export const indicateurProjetSelectSchema = createSelectSchema(indicateurProjet);
export const valeurIndicateurInsertSchema = createInsertSchema(valeurIndicateur);
export const valeurIndicateurSelectSchema = createSelectSchema(valeurIndicateur);

export type Partenaire = z.infer<typeof partenaireSelectSchema>;
export type Projet = z.infer<typeof projetSelectSchema>;
export type IndicateurProjet = z.infer<typeof indicateurProjetSelectSchema>;
export type ValeurIndicateur = z.infer<typeof valeurIndicateurSelectSchema>;
export type TypePartenaire = (typeof typePartenaireEnum.enumValues)[number];
export type StatutProjet = (typeof statutProjetEnum.enumValues)[number];
export type FrequenceCollecte = (typeof frequenceCollecteEnum.enumValues)[number];