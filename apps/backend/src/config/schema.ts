import { pgTable, varchar, text, timestamp, integer, boolean, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';

// Users table (managed by Clerk)
export const users = pgTable('users', {
  id: varchar('id', { length: 191 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: varchar('id', { length: 191 }).primaryKey(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  keyHashIdx: index('key_hash_idx').on(table.keyHash),
}));

// Email validation results table
export const emailValidations = pgTable('email_validations', {
  id: varchar('id', { length: 191 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  isValid: boolean('is_valid').notNull(),
  isCatchAll: boolean('is_catch_all').notNull(),
  mxRecords: jsonb('mx_records').$type<string[]>(),
  mxProvider: varchar('mx_provider', { length: 100 }),
  smtpResponse: text('smtp_response'),
  validationMethod: varchar('validation_method', { length: 50 }).notNull(),
  confidence: integer('confidence'), // 0-100
  linkedinVerified: boolean('linkedin_verified'),
  linkedinData: jsonb('linkedin_data').$type<{
    profileUrl?: string;
    position?: string;
    company?: string;
    verified?: boolean;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  domainIdx: index('domain_idx').on(table.domain),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// Email patterns table
export const emailPatterns = pgTable('email_patterns', {
  id: varchar('id', { length: 191 }).primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull(),
  pattern: varchar('pattern', { length: 100 }).notNull(),
  patternType: varchar('pattern_type', { length: 50 }).notNull(), // 'common', 'custom', 'domain-specific'
  successRate: integer('success_rate'), // 0-100
  sampleEmails: jsonb('sample_emails').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patternDomainIdx: index('pattern_domain_idx').on(table.domain),
  patternTypeIdx: index('pattern_type_idx').on(table.patternType),
}));

// Rate limiting table
export const rateLimits = pgTable('rate_limits', {
  id: varchar('id', { length: 191 }).primaryKey(),
  apiKeyId: varchar('api_key_id', { length: 191 }).notNull(),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  requests: integer('requests').default(0).notNull(),
  windowStart: timestamp('window_start').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  apiKeyEndpointIdx: index('api_key_endpoint_idx').on(table.apiKeyId, table.endpoint),
  windowStartIdx: index('window_start_idx').on(table.windowStart),
}));

// Export schema for database connection
export const schema = {
  users,
  apiKeys,
  emailValidations,
  emailPatterns,
  rateLimits,
};
