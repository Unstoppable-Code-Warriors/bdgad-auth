import { db } from "@/db/drizzle"
import { roles } from "@/db/schema"
import { count, getTableColumns, eq } from "drizzle-orm"
import { withAuth, requireAuth, handleDatabaseError } from "@/lib/utils/auth"

// Example 1: Using withAuth wrapper (recommended)
async function getRolesCore({ limit = 10, page = 1 }) {
	const offset = (page - 1) * limit

	const roleColumns = getTableColumns(roles)

	const result = await db.transaction(async (tx) => {
		const roleList = await tx
			.select(roleColumns)
			.from(roles)
			.limit(limit)
			.offset(offset)

		const totalResult = await tx.select({ count: count() }).from(roles)

		return {
			roles: roleList,
			total: totalResult[0].count,
		}
	})

	return result
}

export const getRoles = withAuth(getRolesCore)

// Example 2: Manual auth check with custom error handling
export async function createRole(data: { name: string; description: string }) {
	try {
		// Manual auth check
		await requireAuth()

		const [newRole] = await db.insert(roles).values(data).returning()

		return newRole
	} catch (error) {
		handleDatabaseError(error, "create role")
	}
}

// Example 3: Using withAuth for simple operations
const deleteRoleCore = async (id: number) => {
	const [deletedRole] = await db
		.delete(roles)
		.where(eq(roles.id, id))
		.returning()

	if (!deletedRole) {
		throw new Error("Role not found")
	}

	return deletedRole
}

export const deleteRole = withAuth(deleteRoleCore)
