import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  pgEnum,
  bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { utilisateur } from './users';
import { formationSanitaire } from './geography';

export const actionAuditEnum = pgEnum('action_audit', ['INSERT', 'UPDATE', 'DELETE'] as const);

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tableName: varchar('table_name', { length: 100 }).notNull(),
    recordId: bigint('record_id', { mode: 'number' }).notNull(),
    action: actionAuditEnum('action').notNull(),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    changedFields: text('changed_fields').array(),
    utilisateurId: bigint('utilisateur_id', { mode: 'number' }).references(() => utilisateur.id),
    formationSanitaireId: integer('formation_sanitaire_id').references(() => formationSanitaire.id),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    tableRecordIdx: index('audit_table_record_idx').on(t.tableName, t.recordId),
    userIdx: index('audit_user_idx').on(t.utilisateurId),
    formationIdx: index('audit_formation_idx').on(t.formationSanitaireId),
    dateIdx: index('audit_date_idx').on(t.createdAt),
  })
);

export const auditLogInsertSchema = createInsertSchema(auditLog);
export const auditLogSelectSchema = createSelectSchema(auditLog);

export type AuditLog = z.infer<typeof auditLogSelectSchema>;
export type ActionAudit = (typeof actionAuditEnum.enumValues)[number];