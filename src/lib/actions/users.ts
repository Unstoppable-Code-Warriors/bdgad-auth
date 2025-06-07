"use server"

import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { count, eq, getTableColumns } from "drizzle-orm"
import { withAuth } from "@/lib/utils/auth"
import bcrypt from "bcryptjs"

async function getUsersCore({
	limit = 10,
	page = 1,
}: {
	limit?: number
	page?: number
} = {}) {
	const offset = (page - 1) * limit

	const { password, ...userColumns } = getTableColumns(users)

	const result = await db.transaction(async (tx) => {
		const userList = await tx
			.select(userColumns)
			.from(users)
			.limit(limit)
			.offset(offset)

		const totalResult = await tx.select({ count: count() }).from(users)

		return {
			users: userList,
			total: totalResult[0].count,
			totalPages: Math.ceil(totalResult[0].count / limit),
		}
	})

	return result
}

export const getUsers = withAuth(getUsersCore)
export type GetUsersResult = Awaited<ReturnType<typeof getUsers>>

async function createUserCore({
	email,
	password,
	name,
	metadata,
}: {
	email: string
	password: string
	name: string
	metadata: Record<string, any>
}) {
	const hashedPassword = await bcrypt.hash(password, 12)
	const [{ password: hashedDbPassword, ...newUser }] = await db
		.insert(users)
		.values({
			email,
			password: hashedPassword,
			name,
			metadata,
		})
		.returning()

	return newUser
}

export const createUser = withAuth(createUserCore)
export type CreateUserResult = Awaited<ReturnType<typeof createUser>>

async function deleteUserCore({ id }: { id: number }) {
	await db.delete(users).where(eq(users.id, id))
}

export const deleteUser = withAuth(deleteUserCore)
export type DeleteUserResult = Awaited<ReturnType<typeof deleteUser>>
