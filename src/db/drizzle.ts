import { drizzle } from "drizzle-orm/node-postgres"
import { config } from "dotenv"

config({ path: ".env" })

export const db = drizzle(process.env.DATABASE_URL!)
