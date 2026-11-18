import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
  numeric,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const statutPersonnelEnum = pgEnum('statut_personnel', [
  'ACTIF',
  'CONGE',
  'MUTATION',
  'RETRAITE',
  'DECEDE',
] as const);

export const personnel = pgTable(
  'personnel',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    utilisateurId: bigint('utilisateur_id', { mode: 'number' }).unique().references(() => utilisateur.id),
    matricule: varchar('matricule', { length: 30 }),
    prenom: varchar('prenom', { length: 50 }).notNull(),
    nom: varchar('nom', { length: 50 }).notNull(),
    sexe: varchar('sexe', { length: 1 }),
    dateNaissance: date('date_naissance'),
    qualification: varchar('qualification', { length: 100 }),
    specialite: varchar('specialite', { length: 100 }),
    dateEntreeFonction: date('date_entree_fonction'),
    statut: statutPersonnelEnum('statut').default('ACTIF'),
    telephone: varchar('telephone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    formationIdx: index('personnel_formation_idx').on(t.formationSanitaireId),
    utilisateurIdx: uniqueIndex('personnel_utilisateur_idx').on(t.utilisateurId),
    matriculeIdx: uniqueIndex('personnel_matricule_idx').on(t.matricule),
    statutIdx: index('personnel_statut_idx').on(t.statut),
  })
);

export const statutEquipementEnum = pgEnum('statut_equipement', [
  'FONCTIONNEL',
  'EN_PANNE',
  'MAINTENANCE',
  'HORS_SERVICE',
  'REFORME',
] as const);

export const equipement = pgTable(
  'equipement',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    nom: varchar('nom', { length: 100 }).notNull(),
    categorie: varchar('categorie', { length: 50 }),
    marque: varchar('marque', { length: 50 }),
    modele: varchar('modele', { length: 50 }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    dateAcquisition: date('date_acquisition'),
    dateDerniereMaintenance: date('date_derniere_maintenance'),
    frequenceMaintenanceJours: integer('frequence_maintenance_jours'),
    statut: statutEquipementEnum('statut').default('FONCTIONNEL'),
    valeurAcquisition: numeric('valeur_acquisition', { precision: 14, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    formationIdx: index('equipement_formation_idx').on(t.formationSanitaireId),
    categorieIdx: index('equipement_categorie_idx').on(t.categorie),
    statutIdx: index('equipement_statut_idx').on(t.statut),
  })
);

export const personnelInsertSchema = createInsertSchema(personnel);
export const personnelSelectSchema = createSelectSchema(personnel);
export const equipementInsertSchema = createInsertSchema(equipement);
export const equipementSelectSchema = createSelectSchema(equipement);

export type Personnel = z.infer<typeof personnelSelectSchema>;
export type Equipement = z.infer<typeof equipementSelectSchema>;
export type StatutPersonnel = (typeof statutPersonnelEnum.enumValues)[number];
export type StatutEquipement = (typeof statutEquipementEnum.enumValues)[number];