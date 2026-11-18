import {
  pgTable,
  serial,
  smallserial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const typeFormationEnum = pgEnum('type_formation', [
  'CSI',
  'CSI_CASE_SANTE',
  'CSME',
  'HOPITAL_DISTRICT',
  'HOPITAL_REGIONAL',
  'HOPITAL_NATIONAL',
] as const);

export const region = pgTable(
  'region',
  {
    id: smallserial('id').primaryKey(),
    code: varchar('code', { length: 2 }).notNull().unique(),
    nom: varchar('nom', { length: 50 }).notNull(),
    nomHaoussa: varchar('nom_haoussa', { length: 50 }),
    nomZarma: varchar('nom_zarma', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('region_code_idx').on(t.code),
  })
);

export const district = pgTable(
  'district',
  {
    id: serial('id').primaryKey(),
    regionId: smallint('region_id').notNull().references(() => region.id),
    code: varchar('code', { length: 10 }).notNull(),
    nom: varchar('nom', { length: 100 }).notNull(),
    nomHaoussa: varchar('nom_haoussa', { length: 100 }),
    nomZarma: varchar('nom_zarma', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    regionCodeIdx: uniqueIndex('district_region_code_idx').on(t.regionId, t.code),
    regionIdx: index('district_region_idx').on(t.regionId),
  })
);

export const formationSanitaire = pgTable(
  'formation_sanitaire',
  {
    id: serial('id').primaryKey(),
    districtId: integer('district_id').notNull().references(() => district.id),
    code: varchar('code', { length: 20 }).notNull().unique(),
    nom: varchar('nom', { length: 150 }).notNull(),
    type: typeFormationEnum('type').notNull(),
    latitude: varchar('latitude', { length: 20 }),
    longitude: varchar('longitude', { length: 20 }),
    telephone: varchar('telephone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    responsableNom: varchar('responsable_nom', { length: 100 }),
    responsableTelephone: varchar('responsable_telephone', { length: 20 }),
    actif: boolean('actif').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('formation_code_idx').on(t.code),
    districtIdx: index('formation_district_idx').on(t.districtId),
    actifIdx: index('formation_actif_idx').on(t.actif),
  })
);

export const regionInsertSchema = createInsertSchema(region);
export const regionSelectSchema = createSelectSchema(region);
export const districtInsertSchema = createInsertSchema(district);
export const districtSelectSchema = createSelectSchema(district);
export const formationSanitaireInsertSchema = createInsertSchema(formationSanitaire);
export const formationSanitaireSelectSchema = createSelectSchema(formationSanitaire);

export type Region = z.infer<typeof regionSelectSchema>;
export type District = z.infer<typeof districtSelectSchema>;
export type FormationSanitaire = z.infer<typeof formationSanitaireSelectSchema>;
export type TypeFormation = (typeof typeFormationEnum.enumValues)[number];