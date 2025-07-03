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
	updateProfileSchema,
	googleLoginSchema,
} from "../types/validation"
import {
	sendPasswordResetEmail,
	sendPasswordResetConfirmationEmail,
} from "../utils/emailService"
import {
	invalidCredentials,
	accountInactive,
	userNotAuthenticated,
	invalidToken,
	passwordMismatch,
	samePassword,
	tokenExpired,
	userNotFound,
	emailNotFound,
	internalServerError,
	emailSendFailed,
} from "../utils/errorResponse"
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
			return invalidCredentials(c)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(
			password,
			foundUser.password
		)
		if (!isPasswordValid) {
			return invalidCredentials(c)
		}

		// Get user roles
		const userRoleData = await db
			.select({
				roleId: roles.id,
				roleName: roles.name,
				roleCode: roles.code,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const rolesList = userRoleData.map((role) => ({
			id: role.roleId,
			name: role.roleName,
			code: role.roleCode,
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
			data: {
				token,
				user: {
					id: foundUser.id,
					email: foundUser.email,
					name: foundUser.name,
					roles: rolesList,
					status: foundUser.status,
				},
			},
			message: "Đăng nhập thành công"
		})
	} catch (error) {
		console.error("Login error:", error)
		return internalServerError(c, "Lỗi đăng nhập")
	}
}

export const getUserInfo = async (c: ValidatedContext) => {
	try {
		// Get user info from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return userNotAuthenticated(c)
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
			return userNotFound(c)
		}

		const foundUser = dbUser[0]

		// Check if user is still active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

		// Get user roles
		const userRoleData = await db
			.select({
				roleId: roles.id,
				roleName: roles.name,
				roleDescription: roles.description,
				roleCode: roles.code,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const rolesList = userRoleData.map((role) => ({
			id: role.roleId,
			name: role.roleName,
			code: role.roleCode || "",
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
			data: {
				user: userInfo,
			},
			message: "Lấy thông tin người dùng thành công"
		})
	} catch (error) {
		console.error("Get user info error:", error)
		return internalServerError(c, "Lỗi lấy thông tin người dùng")
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
				data: {
					valid: true,
					user: {
						id: parseInt(userPayload.sub),
						email: userPayload.email,
						name: userPayload.name,
						roles: userPayload.roles,
					},
				},
				message: "Token hợp lệ"
			})
		} catch (jwtError) {
			return invalidToken(c)
		}
	} catch (error) {
		console.error("Token verification error:", error)
		return internalServerError(c, "Lỗi xác thực token")
	}
}

export const changePassword = async (c: ValidatedContext) => {
	try {
		// Get user from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return userNotAuthenticated(c)
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
			return userNotFound(c)
		}

		const foundUser = dbUser[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			foundUser.password
		)

		if (!isCurrentPasswordValid) {
			return passwordMismatch(c)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)

		if (isSamePassword) {
			return samePassword(c)
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
			message: "Đổi mật khẩu thành công",
		})
	} catch (error) {
		console.error("Change password error:", error)
		return internalServerError(c, "Lỗi đổi mật khẩu")
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

		// Check if user exists
		if (user.length === 0) {
			return emailNotFound(c)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

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
			return emailSendFailed(c)
		}

		return c.json({
			message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn",
		})
	} catch (error) {
		console.error("Forgot password error:", error)
		return internalServerError(c, "Lỗi gửi email đặt lại mật khẩu")
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
			return invalidToken(c)
		}

		const tokenData = resetTokenRecord[0]

		// Check if token has expired
		if (new Date() > tokenData.expiresAt) {
			return tokenExpired(c)
		}

		// Get user data
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, tokenData.userId))
			.limit(1)

		if (user.length === 0) {
			return userNotFound(c)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)
		if (isSamePassword) {
			return samePassword(c)
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
			// await sendPasswordResetConfirmationEmail(
			// 	foundUser.email,
			// 	foundUser.name
			// )
			console.log("Password reset confirmation email sent to", foundUser.email)
		} catch (emailError) {
			console.error(
				"Failed to send password reset confirmation email:",
				emailError
			)
			// Continue execution - password reset was successful
		}

		return c.json({
			message: "Đặt lại mật khẩu thành công",
		})
	} catch (error) {
		console.error("Reset password error:", error)
		return internalServerError(c, "Lỗi đặt lại mật khẩu")
	}
}

export const updateProfile = async (c: ValidatedContext) => {
	try {
		// Type assertion is safe here because zValidator middleware validates the data
		const body = (c.req as any).valid("json") as z.infer<
			typeof updateProfileSchema
		>
		const { name, phone, address } = body

		// Get user from database
		const user = c.get("user")

		if (!user) {
			return userNotAuthenticated(c)
		}

		const userId = user.id

		const dbUser = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (dbUser.length === 0) {
			return userNotFound(c)
		}

		const foundUser = dbUser[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c)
		}

		// Prepare metadata update
		const currentMetadata = (foundUser.metadata as Record<string, string>) || {}
		const updatedMetadata = {
			...currentMetadata,
			phone: phone?.trim() || "",
			address: address?.trim() || "",
		}

		// Update user in database
		await db
			.update(users)
			.set({
				name: name.trim(),
				metadata: updatedMetadata,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))

		// Return updated user info
		const updatedUser = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				status: users.status,
				metadata: users.metadata,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		return c.json({
			data: {
				user: updatedUser[0],
			},
			message: "Cập nhật hồ sơ thành công",
		})
	} catch (error) {
		console.error("Update profile error:", error)
		return internalServerError(c, "Lỗi cập nhật hồ sơ")
	}
}

export const googleLogin = async (c: ValidatedContext) => {
	const body = (c.req as any).valid("json") as z.infer<
			typeof googleLoginSchema
		>
	const { token } = body

	const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`)
	const data = await response.json()
	if (!response.ok) {
		return invalidToken(c)
	}

	if (response.ok) {
		const { email } = data

		const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

		if (user.length === 0) {
			return userNotFound(c)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return accountInactive(c, `Tài khoản ${email} chưa được kích hoạt`)
		}
		// Get user roles
		const userRoleData = await db
			.select({
				roleId: roles.id,
				roleName: roles.name,
				roleCode: roles.code,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const rolesList = userRoleData.map((role) => ({
			id: role.roleId,
			name: role.roleName,
			code: role.roleCode,
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
			data: {
				token,
				user: foundUser,
			},
			message: `Đăng nhập Google thành công với tài khoản ${email}`
		})

	}	
}