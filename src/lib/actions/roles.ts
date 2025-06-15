"use server"

import { db } from "@/db/drizzle"
import { roles } from "@/db/schema"
import { count, getTableColumns, eq } from "drizzle-orm"
import { withAuth, requireAuth, handleDatabaseError } from "@/lib/utils/auth"
import { FetchLimit } from "../constants"

async function getRolesCore({
	limit = FetchLimit.ROLES,
	page = 1,
}: {
	limit?: number
	page?: number
} = {}) {
	try {
		console.log("Validating pagination parameters:", { limit, page });

		// Validate limit if provided
		if (limit !== undefined) {
			if (typeof limit !== "number") {
				throw new Error("Limit must be a number");
			}
			if (limit <= 0) {
				throw new Error("Limit must be greater than 0");
			}
		}

		// Validate page if provided
		if (page !== undefined) {
			if (typeof page !== "number") {
				throw new Error("Page must be a number");
			}
			if (page <= 0) {
				throw new Error("Page must be greater than 0");
			}
		}

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
				totalPages: Math.ceil(totalResult[0].count / limit),
			}
		})

		return result
	} catch (error) {
		console.error("Error in getRolesCore:", error);
		throw error; // Re-throw the error to be handled by the caller
	}
}

export const getRoles = withAuth(getRolesCore)
export type GetRolesResult = Awaited<ReturnType<typeof getRoles>>

const createRoleCore = async (data: { name: string; description: string }) => {
	const [newRole] = await db.insert(roles).values(data).returning()

	return newRole
}

export const createRole = withAuth(createRoleCore)
export type CreateRoleResult = Awaited<ReturnType<typeof createRole>>

const updateRoleCore = async (
	id: number,
	data: { description: string }
) => {
	try {
		console.log("Validating role update data:", { id, description: data.description });

		// Validate that id is a number and not empty
		if (!id || typeof id !== "number") {
			throw new Error("Invalid role ID: must be a number");
		}

		// Check if role exists
		const existingRole = await db
			.select({ id: roles.id })
			.from(roles)
			.where(eq(roles.id, id))
			.limit(1);

		if (existingRole.length === 0) {
			throw new Error(`Role with ID ${id} does not exist`);
		}

		// Validate description
		if (!data.description || typeof data.description !== "string") {
			throw new Error("Description is required");
		}

		if (data.description.length > 200) {
			throw new Error("Description must not exceed 200 characters");
		}

		// Allow letters (including Vietnamese), numbers, spaces, and special characters
		if (!/^[a-zA-ZÀ-ỹ0-9\s\(\)\|\/\-\,\.]+$/.test(data.description)) {
			throw new Error("Description can only contain letters (including Vietnamese), numbers, spaces, and the following special characters: ( ) | / - , .");
		}

		const [updatedRole] = await db
			.update(roles)
			.set(data)
			.where(eq(roles.id, id))
			.returning();

		return updatedRole;
	} catch (error) {
		console.error("Error in updateRoleCore:", error);
		throw error; // Re-throw the error to be handled by the caller
	}
}

export const updateRole = withAuth(updateRoleCore)
export type UpdateRoleResult = Awaited<ReturnType<typeof updateRole>>

const deleteRoleCore = async (id: number) => {
	try {
		console.log("Validating role ID for deletion:", id);

		// Validate that id is a number and not empty
		if (!id || typeof id !== "number") {
			throw new Error("Invalid role ID: must be a number");
		}

		// Check if role exists
		const existingRole = await db
			.select({ id: roles.id })
			.from(roles)
			.where(eq(roles.id, id))
			.limit(1);

		if (existingRole.length === 0) {
			throw new Error(`Role with ID ${id} does not exist`);
		}

		const [deletedRole] = await db
			.delete(roles)
			.where(eq(roles.id, id))
			.returning();

		return deletedRole;
	} catch (error) {
		console.error("Error in deleteRoleCore:", error);
		throw error; // Re-throw the error to be handled by the caller
	}
}

export const deleteRole = withAuth(deleteRoleCore)
