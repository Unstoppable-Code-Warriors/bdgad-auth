import { db } from "./drizzle"
import { systemAdmins } from "./schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { config } from "dotenv"

config({ path: ".env" })

async function initializeDatabase() {
	try {
		const systemAdminEmail = process.env.SYSTEM_ADMIN_EMAIL
		const systemAdminPassword = process.env.SYSTEM_ADMIN_PASSWORD

		if (!systemAdminEmail || !systemAdminPassword) {
			console.log(
				"SYSTEM_ADMIN_EMAIL or SYSTEM_ADMIN_PASSWORD not found in environment variables. Skipping default admin creation."
			)
			return
		}

		// Check if system admin already exists
		const existingAdmin = await db
			.select()
			.from(systemAdmins)
			.where(eq(systemAdmins.email, systemAdminEmail))
			.limit(1)

		if (existingAdmin.length > 0) {
			console.log(
				"Default system admin already exists. Skipping creation."
			)
			return
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(systemAdminPassword, 12)

		// Create the default system admin
		await db.insert(systemAdmins).values({
			email: systemAdminEmail,
			password: hashedPassword,
		})

		console.log("Default system admin created successfully.")
	} catch (error) {
		console.error("Error initializing database:", error)
		throw error
	}
}

initializeDatabase()
