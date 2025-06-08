import { sign, verify } from "hono/jwt"
import { db } from "../../db/drizzle"
import { users, roles, userRoles, passwordResetTokens } from "../../db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { UserInfo, Role } from "../types"
import { ValidatedContext } from "../types/context"
import { z } from "zod"
import {
	loginSchema,
	tokenParamSchema,
	changePasswordSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from "../types/validation"
import {
	sendPasswordResetEmail,
	sendPasswordResetConfirmationEmail,
} from "../utils/emailService"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"

export const login = async (c: ValidatedContext) => {
	try {
		// Type assertion is safe here because zValidator middleware validates the data
		const body = (c.req as any).valid("json") as z.infer<typeof loginSchema>
		const { email, password } = body

		// Find user by email
		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1)

		if (user.length === 0) {
			return c.json({ error: "Invalid credentials" }, 401)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json({ error: "Account is not active" }, 401)
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(
			password,
			foundUser.password
		)
		if (!isPasswordValid) {
			return c.json({ error: "Invalid credentials" }, 401)
		}

		// Get user roles
		const userRoleData = await db
			.select({
				roleId: roles.id,
				roleName: roles.name,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const rolesList = userRoleData.map((role) => ({
			id: role.roleId,
			name: role.roleName,
		}))

		// Create JWT payload
		const payload = {
			sub: foundUser.id.toString(),
			email: foundUser.email,
			name: foundUser.name,
			roles: rolesList,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
		}

		// Sign JWT token
		const token = await sign(payload, JWT_SECRET)

		return c.json({
			success: true,
			token,
			user: {
				id: foundUser.id,
				email: foundUser.email,
				name: foundUser.name,
				roles: rolesList,
				status: foundUser.status,
			},
		})
	} catch (error) {
		console.error("Login error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export const getUserInfo = async (c: ValidatedContext) => {
	try {
		// Get user info from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return c.json({ error: "No authentication information found" }, 401)
		}

		const userId = user.id

		// Get fresh user data from database
		const dbUser = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				status: users.status,
				metadata: users.metadata,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (dbUser.length === 0) {
			return c.json({ error: "User not found" }, 404)
		}

		const foundUser = dbUser[0]

		// Check if user is still active
		if (foundUser.status !== "active") {
			return c.json({ error: "Account is not active" }, 401)
		}

		// Get user roles
		const userRoleData = await db
			.select({
				roleId: roles.id,
				roleName: roles.name,
				roleDescription: roles.description,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const rolesList = userRoleData.map((role) => ({
			id: role.roleId,
			name: role.roleName,
		}))

		const userInfo: UserInfo = {
			id: foundUser.id,
			email: foundUser.email,
			name: foundUser.name,
			status: foundUser.status,
			roles: rolesList,
			metadata: foundUser.metadata,
		}

		return c.json({
			success: true,
			user: userInfo,
		})
	} catch (error) {
		console.error("Get user info error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export const verifyToken = async (c: ValidatedContext) => {
	try {
		// Type assertion is safe here because zValidator middleware validates the data
		const params = (c.req as any).valid("param") as z.infer<
			typeof tokenParamSchema
		>
		const { token } = params

		try {
			// Verify JWT token
			const payload = await verify(token, JWT_SECRET)

			// Type assertion for our custom payload structure
			const userPayload = payload as unknown as {
				sub: string
				email: string
				name: string
				roles: Role[]
				iat: number
				exp: number
			}

			return c.json({
				success: true,
				valid: true,
				user: {
					id: parseInt(userPayload.sub),
					email: userPayload.email,
					name: userPayload.name,
					roles: userPayload.roles,
				},
			})
		} catch (jwtError) {
			return c.json({
				success: true,
				valid: false,
				error: "Invalid or expired token",
			})
		}
	} catch (error) {
		console.error("Token verification error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export const changePassword = async (c: ValidatedContext) => {
	try {
		// Get user from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return c.json({ error: "User not authenticated" }, 401)
		}

		// Type assertion is safe here because zValidator middleware validates the data
		const body = (c.req as any).valid("json") as z.infer<
			typeof changePasswordSchema
		>
		const { currentPassword, newPassword } = body

		// Get user from database to verify current password
		const dbUser = await db
			.select()
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1)

		if (dbUser.length === 0) {
			return c.json({ error: "User not found" }, 404)
		}

		const foundUser = dbUser[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json({ error: "Account is not active" }, 401)
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			foundUser.password
		)

		if (!isCurrentPasswordValid) {
			return c.json({ error: "Current password is incorrect" }, 400)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)

		if (isSamePassword) {
			return c.json(
				{
					error: "New password must be different from current password",
				},
				400
			)
		}

		// Hash the new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12)

		// Update password in database
		await db
			.update(users)
			.set({
				password: hashedNewPassword,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id))

		return c.json({
			success: true,
			message: "Password changed successfully",
		})
	} catch (error) {
		console.error("Change password error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export const forgotPassword = async (c: ValidatedContext) => {
	try {
		// Type assertion is safe here because zValidator middleware validates the data
		const body = (c.req as any).valid("json") as z.infer<
			typeof forgotPasswordSchema
		>
		const { email, redirectUrl } = body

		// Find user by email
		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1)

		// Always return success to prevent email enumeration attacks
		// But only send email if user exists and is active
		if (user.length > 0 && user[0].status === "active") {
			const foundUser = user[0]

			// Generate secure random token
			const resetToken = crypto.randomBytes(32).toString("hex")
			const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

			// Store reset token in database
			await db.insert(passwordResetTokens).values({
				userId: foundUser.id,
				token: resetToken,
				expiresAt,
				used: "false",
			})

			// Send password reset email
			try {
				await sendPasswordResetEmail(
					redirectUrl,
					foundUser.email,
					resetToken,
					foundUser.name
				)
			} catch (emailError) {
				console.error(
					"Failed to send password reset email:",
					emailError
				)
				// Continue execution - don't reveal email sending failure to user
			}
		}

		return c.json({
			success: true,
			message:
				"If an account with that email exists, a password reset link has been sent.",
		})
	} catch (error) {
		console.error("Forgot password error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

export const resetPassword = async (c: ValidatedContext) => {
	try {
		// Type assertion is safe here because zValidator middleware validates the data
		const body = (c.req as any).valid("json") as z.infer<
			typeof resetPasswordSchema
		>
		const { token, newPassword } = body

		// Find valid reset token
		const resetTokenRecord = await db
			.select({
				id: passwordResetTokens.id,
				userId: passwordResetTokens.userId,
				expiresAt: passwordResetTokens.expiresAt,
				used: passwordResetTokens.used,
			})
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.token, token),
					eq(passwordResetTokens.used, "false")
				)
			)
			.limit(1)

		if (resetTokenRecord.length === 0) {
			return c.json({ error: "Invalid or expired reset token" }, 400)
		}

		const tokenData = resetTokenRecord[0]

		// Check if token has expired
		if (new Date() > tokenData.expiresAt) {
			return c.json({ error: "Reset token has expired" }, 400)
		}

		// Get user data
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, tokenData.userId))
			.limit(1)

		if (user.length === 0) {
			return c.json({ error: "User not found" }, 404)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json({ error: "Account is not active" }, 401)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)
		if (isSamePassword) {
			return c.json(
				{
					error: "New password must be different from current password",
				},
				400
			)
		}

		// Hash the new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12)

		// Update password in database
		await db
			.update(users)
			.set({
				password: hashedNewPassword,
				updatedAt: new Date(),
			})
			.where(eq(users.id, foundUser.id))

		// Mark reset token as used
		await db
			.update(passwordResetTokens)
			.set({ used: "true" })
			.where(eq(passwordResetTokens.id, tokenData.id))

		// Send confirmation email
		try {
			await sendPasswordResetConfirmationEmail(
				foundUser.email,
				foundUser.name
			)
		} catch (emailError) {
			console.error(
				"Failed to send password reset confirmation email:",
				emailError
			)
			// Continue execution - password reset was successful
		}

		return c.json({
			success: true,
			message: "Password has been reset successfully",
		})
	} catch (error) {
		console.error("Reset password error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}
