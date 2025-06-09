"use server"

import { db } from "@/db/drizzle"
import { users, userRoles, roles } from "@/db/schema"
import { count, eq, getTableColumns } from "drizzle-orm"
import { withAuth } from "@/lib/utils/auth"
import bcrypt from "bcryptjs"
import { FetchLimit } from "../constants"
import { sendPasswordEmail } from "@/lib/utils/email"

// Define the type for user with roles
type UserWithRoles = Omit<typeof users.$inferSelect, "password"> & {
	roles: Array<{
		id: number
		name: string
		description: string
	}>
}

async function getUsersCore({
	limit = FetchLimit.USERS,
	page = 1,
}: {
	limit?: number
	page?: number
} = {}) {
	const offset = (page - 1) * limit

	const { password, ...userColumns } = getTableColumns(users)

	const result = await db.transaction(async (tx) => {
		// Get users with their roles
		const usersWithRoles = await tx
			.select({
				...userColumns,
				roleId: userRoles.roleId,
				roleName: roles.name,
				roleDescription: roles.description,
			})
			.from(users)
			.leftJoin(userRoles, eq(users.id, userRoles.userId))
			.leftJoin(roles, eq(userRoles.roleId, roles.id))
			.limit(limit)
			.offset(offset)

		// Group roles by user
		const userMap = new Map<number, UserWithRoles>()

		usersWithRoles.forEach((row) => {
			const userId = row.id
			if (!userMap.has(userId)) {
				const { roleId, roleName, roleDescription, ...userData } = row
				userMap.set(userId, {
					...userData,
					roles: [],
				})
			}

			// Add role if it exists (leftJoin might return null roles for users without roles)
			if (row.roleId && row.roleName && row.roleDescription) {
				userMap.get(userId)!.roles.push({
					id: row.roleId,
					name: row.roleName,
					description: row.roleDescription,
				})
			}
		})

		const userList: UserWithRoles[] = Array.from(userMap.values())

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
	name,
	metadata,
	roleIds = [],
}: {
	email: string
	name: string
	metadata: Record<string, any>
	roleIds?: number[]
}) {
	// Generate a random password
	const generateRandomPassword = () => {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
		let password = ""
		for (let i = 0; i < 12; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		return password
	}

	const generatedPassword = generateRandomPassword()
	const hashedPassword = await bcrypt.hash(generatedPassword, 12)

	const result = await db.transaction(async (tx) => {
		// Create the user
		const [{ password: hashedDbPassword, ...newUser }] = await tx
			.insert(users)
			.values({
				email,
				password: hashedPassword,
				name,
				metadata,
			})
			.returning()

		// Assign roles if provided
		if (roleIds.length > 0) {
			await tx.insert(userRoles).values(
				roleIds.map((roleId) => ({
					userId: newUser.id,
					roleId,
				}))
			)
		}

		// TODO: Send email with generated password to user
		// This would require an email service to be implemented
		try {
			await sendPasswordEmail(email, generatedPassword, name)
		} catch (emailError) {
			console.error("Failed to send password email:", emailError)
			// Don't throw here - user creation was successful, just email failed
			// The frontend will handle this case with appropriate messaging
		}

		return newUser
	})

	return result
}

export const createUser = withAuth(createUserCore)
export type CreateUserResult = Awaited<ReturnType<typeof createUser>>

async function updateUserCore({
	id,
	email,
	password,
	name,
	metadata,
	roleIds,
}: {
	id: number
	email?: string
	password?: string
	name?: string
	metadata?: Record<string, any>
	roleIds?: number[]
}) {
	const result = await db.transaction(async (tx) => {
		// Prepare update data
		const updateData: any = {}

		if (email !== undefined) updateData.email = email
		if (name !== undefined) updateData.name = name
		if (metadata !== undefined) updateData.metadata = metadata
		if (password !== undefined) {
			updateData.password = await bcrypt.hash(password, 12)
		}

		// Update user if there's data to update
		let updatedUser
		if (Object.keys(updateData).length > 0) {
			const [{ password: hashedDbPassword, ...user }] = await tx
				.update(users)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(users.id, id))
				.returning()
			updatedUser = user
		} else {
			// If no user data to update, just get the current user
			const { password: hashedDbPassword, ...user } = await tx
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((rows) => rows[0])
			updatedUser = user
		}

		// Update roles if provided
		if (roleIds !== undefined) {
			// Delete existing roles
			await tx.delete(userRoles).where(eq(userRoles.userId, id))

			// Insert new roles if any
			if (roleIds.length > 0) {
				await tx.insert(userRoles).values(
					roleIds.map((roleId) => ({
						userId: id,
						roleId,
					}))
				)
			}
		}

		return updatedUser
	})

	return result
}

export const updateUser = withAuth(updateUserCore)
export type UpdateUserResult = Awaited<ReturnType<typeof updateUser>>

async function deleteUserCore({ id }: { id: number }) {
	await db.transaction(async (tx) => {
		// Delete user roles first (due to foreign key constraints)
		await tx.delete(userRoles).where(eq(userRoles.userId, id))

		// Then delete the user
		await tx.delete(users).where(eq(users.id, id))
	})
}

export const deleteUser = withAuth(deleteUserCore)
export type DeleteUserResult = Awaited<ReturnType<typeof deleteUser>>
