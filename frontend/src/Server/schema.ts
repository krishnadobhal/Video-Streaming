import { 
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  pgEnum,
  varchar,
  unique,
} from "drizzle-orm/pg-core"
import type { AdapterAccount } from "next-auth/adapters"
import { createId } from "@paralleldrive/cuid2"

export const RoleEnum = pgEnum("role", ["user", "admin"])

export const users = pgTable("user", {
  id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  role: RoleEnum("role").default("user"),
  customerID: text("customerID")
}, (vt) => ({
  uniqueEmail: unique("unique_email").on(vt.email)
}))

export const accounts = pgTable(
  "account",
  {
      userId: text("userId")
          .notNull()
          .references(() => users.id, { onDelete: "cascade" }),
      type: text("type").$type<AdapterAccount["type"]>().notNull(),
      provider: text("provider").notNull(),
      providerAccountId: text("providerAccountId").notNull(),
      refresh_token: text("refresh_token"),
      access_token: text("access_token"),
      expires_at: integer("expires_at"),
      token_type: text("token_type"),
      scope: text("scope"),
      id_token: text("id_token"),
      session_state: text("session_state"),
  },
  (account) => ({
      compoundKey: primaryKey({
          columns: [account.provider, account.providerAccountId],
      }),
  })
)

export const email_tokens = pgTable(
  "email_tokens",
  {
      id: text("id")
          .notNull()
          .$defaultFn(() => createId()),
      token: text("token").notNull(),
      expires: timestamp("expires", { mode: "date" }).notNull(),
      email: text("email").notNull(),
  }
)

export const password_reset_tokens = pgTable(
  "password_reset_tokens",
  {
      id: text("id")
          .notNull()
          .$defaultFn(() => createId()),
      token: text("token").notNull(),
      expires: timestamp("expires", { mode: "date" }).notNull(),
      email: text("email").notNull(),
  }
)

export const two_factor_tokens = pgTable(
  "two_factor_tokens",
  {
      id: text("id")
          .notNull()
          .$defaultFn(() => createId()),
      token: text("token").notNull(),
      expires: timestamp("expires", { mode: "date" }).notNull(),
      email: text("email").notNull(),
      userID: text("userID")
          .references(() => users.id, { onDelete: "cascade" }),
  }
)

export const video_data = pgTable("video_data", {
  id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
  title: varchar("title", { length: 255 }).notNull(), 
  description: text("description"), 
  author: varchar("author", { length: 255 }).notNull(), 
  url: varchar("url", { length: 2083 }).notNull(),
  master: varchar("master", { length: 2083 }).notNull(),
})