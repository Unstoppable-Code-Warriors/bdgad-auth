import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core"

export const systemAdmins = pgTable("system_admins", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
