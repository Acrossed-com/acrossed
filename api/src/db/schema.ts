import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, bigint, boolean, index, integer } from "drizzle-orm/pg-core";

// One project per Clerk user (or org). The encrypted_rules blob is opaque ciphertext.
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(), // Clerk user id
  name: text("name").notNull(),

  // URL-safe identifier — used for the default <slug>.acrsd.dev subdomain.
  slug: text("slug").notNull().unique(),

  // Pricing tier: "free" | "pro" | "enterprise"
  plan: text("plan").notNull().default("free"),

  // Polar (billing) integration: customer + active subscription identifiers.
  polarCustomerId: text("polar_customer_id"),
  polarSubscriptionId: text("polar_subscription_id"),

  // API key is stored encrypted (AES-256-GCM); the public-facing key is shown once at creation.
  apiKeyHash: text("api_key_hash").notNull().unique(),
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  signingSecretEncrypted: text("signing_secret_encrypted").notNull(),
  encryptedRules: text("encrypted_rules").notNull(),

  // Optional bring-your-own log sink. When enabled, /check fires an INSERT into
  // the user's Postgres after every decision (off the hot path). Connection
  // string is AES-256-GCM encrypted; we never log the cleartext.
  logSinkUrlEncrypted: text("log_sink_url_encrypted"),
  logSinkTable: text("log_sink_table").notNull().default("acrossed_decisions"),
  logSinkEnabled: boolean("log_sink_enabled").notNull().default(false),
  logSinkLastError: text("log_sink_last_error"),
  logSinkLastErrorAt: timestamp("log_sink_last_error_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ownerIdx: index("projects_owner_idx").on(t.ownerId),
  slugIdx: index("projects_slug_idx").on(t.slug),
}));

export const customDomains = pgTable("custom_domains", {
  domain: text("domain").primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  projectIdx: index("domains_project_idx").on(t.projectId),
}));

export const usage = pgTable("usage", {
  projectId: uuid("project_id").primaryKey().references(() => projects.id, { onDelete: "cascade" }),
  requestCount: bigint("request_count", { mode: "number" }).notNull().default(0),
  allowedCount: bigint("allowed_count", { mode: "number" }).notNull().default(0),
  deniedCount: bigint("denied_count", { mode: "number" }).notNull().default(0),
  monthlyChecks: bigint("monthly_checks", { mode: "number" }).notNull().default(0),
  monthlyResetAt: timestamp("monthly_reset_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type CustomDomain = typeof customDomains.$inferSelect;

// === BLOG ===
// Public-facing blog. Admin-only writes (see routes/blog.ts).
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  bodyMd: text("body_md").notNull().default(""),
  heroImageUrl: text("hero_image_url"),
  heroImageAlt: text("hero_image_alt"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array().notNull().default(sql`'{}'::text[]`),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  authorId: text("author_id").notNull(),
  readingTimeMin: integer("reading_time_min").notNull().default(1),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
