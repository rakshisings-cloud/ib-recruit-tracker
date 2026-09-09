import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const institutionTypeValues = [
  "bulge_bracket",
  "elite_boutique",
  "private_equity",
  "middle_market",
] as const;

export const firmStatusValues = [
  "unknown",
  "not_open",
  "open",
  "does_not_sponsor",
  "error",
] as const;

export const fetchStrategyValues = ["http", "browser"] as const;

export const firms = pgTable("firms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ticker: text("ticker"),
  institutionType: text("institution_type").notNull(),
  targetLocation: text("target_location"),
  historicalOpenDate: date("historical_open_date"),
  actualOpenDate: date("actual_open_date"),
  status: text("status").notNull().default("unknown"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchTargets = pgTable("watch_targets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  cssSelector: text("css_selector"),
  keywords: jsonb("keywords").notNull().default(sql`'[]'::jsonb`),
  fetchStrategy: text("fetch_strategy").notNull().default("http"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkRuns = pgTable("check_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  watchTargetId: uuid("watch_target_id")
    .notNull()
    .references(() => watchTargets.id, { onDelete: "cascade" }),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  httpStatus: integer("http_status"),
  contentHash: text("content_hash"),
  matchedKeywords: jsonb("matched_keywords").default(sql`'[]'::jsonb`),
  rawExcerpt: text("raw_excerpt"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),
  watchTargetId: uuid("watch_target_id").references(() => watchTargets.id, {
    onDelete: "set null",
  }),
  checkRunId: uuid("check_run_id").references(() => checkRuns.id, {
    onDelete: "set null",
  }),
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  message: text("message"),
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const firmsRelations = relations(firms, ({ many }) => ({
  watchTargets: many(watchTargets),
  alerts: many(alerts),
}));

export const watchTargetsRelations = relations(watchTargets, ({ one, many }) => ({
  firm: one(firms, { fields: [watchTargets.firmId], references: [firms.id] }),
  checkRuns: many(checkRuns),
}));

export const checkRunsRelations = relations(checkRuns, ({ one }) => ({
  watchTarget: one(watchTargets, {
    fields: [checkRuns.watchTargetId],
    references: [watchTargets.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  firm: one(firms, { fields: [alerts.firmId], references: [firms.id] }),
  watchTarget: one(watchTargets, {
    fields: [alerts.watchTargetId],
    references: [watchTargets.id],
  }),
  checkRun: one(checkRuns, { fields: [alerts.checkRunId], references: [checkRuns.id] }),
}));
