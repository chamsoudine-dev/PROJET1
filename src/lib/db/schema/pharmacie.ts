import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  date,
  integer,
  numeric,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  bigint,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { formationSanitaire } from './geography';
import { utilisateur } from './users';

export const medicament = pgTable(
  'medicament',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    dci: varchar('dci', { length: 100 }).notNull(),
    nomCommercial: varchar('nom_commercial', { length: 150 }),
    forme: varchar('forme', { length: 50 }),
    dosage: varchar('dosage', { length: 50 }),
    unite: varchar('unite', { length: 20 }),
    categorie: varchar('categorie', { length: 50 }),
    listeEssentielle: boolean('liste_essentielle').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    dciIdx: index('medicament_dci_idx').on(t.dci),
    categorieIdx: index('medicament_categorie_idx').on(t.categorie),
  })
);

export const stock = pgTable(
  'stock',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    formationSanitaireId: integer('formation_sanitaire_id').notNull().references(() => formationSanitaire.id),
    medicamentId: bigint('medicament_id', { mode: 'number' }).notNull().references(() => medicament.id),
    lotNumero: varchar('lot_numero', { length: 50 }).notNull(),
    datePeremption: date('date_peremption').notNull(),
    quantiteEntree: integer('quantite_entree').notNull().default(0),
    quantiteSortie: integer('quantite_sortie').notNull().default(0),
    quantiteActuelle: integer('quantite_actuelle').generatedAlwaysAs(
      sql`quantite_entree - quantite_sortie`
    ),
    prixUnitaire: numeric('prix_unitaire', { precision: 12, scale: 2 }),
    fournisseur: varchar('fournisseur', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueLot: uniqueIndex('stock_unique_lot_idx').on(t.formationSanitaireId, t.medicamentId, t.lotNumero),
    formationIdx: index('stock_formation_idx').on(t.formationSanitaireId),
    peremptionIdx: index('stock_peremption_idx').on(t.formationSanitaireId, t.datePeremption),
    ruptureIdx: index('stock_rupture_idx').on(t.formationSanitaireId).where(sql`quantite_entree - quantite_sortie <= 0`),
  })
);

export const typeMouvementStockEnum = pgEnum('type_mouvement_stock', [
  'ENTREE',
  'SORTIE',
  'AJUSTEMENT',
  'PERTE',
  'PERIME',
] as const);

export const mouvementStock = pgTable(
  'mouvement_stock',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    stockId: bigint('stock_id', { mode: 'number' }).notNull().references(() => stock.id),
    typeMouvement: typeMouvementStockEnum('type_mouvement').notNull(),
    quantite: integer('quantite').notNull(),
    motif: varchar('motif', { length: 100 }),
    referenceId: bigint('reference_id', { mode: 'number' }),
    agentId: bigint('agent_id', { mode: 'number' }).notNull().references(() => utilisateur.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    stockIdx: index('mouvement_stock_idx').on(t.stockId),
    agentIdx: index('mouvement_agent_idx').on(t.agentId),
    dateIdx: index('mouvement_date_idx').on(t.createdAt),
  })
);

export const medicamentInsertSchema = createInsertSchema(medicament);
export const medicamentSelectSchema = createSelectSchema(medicament);
export const stockInsertSchema = createInsertSchema(stock);
export const stockSelectSchema = createSelectSchema(stock);
export const mouvementStockInsertSchema = createInsertSchema(mouvementStock);
export const mouvementStockSelectSchema = createSelectSchema(mouvementStock);

export type Medicament = z.infer<typeof medicamentSelectSchema>;
export type Stock = z.infer<typeof stockSelectSchema>;
export type MouvementStock = z.infer<typeof mouvementStockSelectSchema>;
export type TypeMouvementStock = (typeof typeMouvementStockEnum.enumValues)[number];