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
import { errorResponses } from "../utils/errorResponse"
import crypto from "crypto"
import { Context } from "hono"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const AUTH_URL = process.env.AUTH_URL

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	console.warn("Google OAuth credentials not configured")
}

// In-memory store for OAuth states (in production, use Redis or database)
const oauthStates = new Map<
	string,
	{ redirectUrl: string; timestamp: number }
>()

// Clean up expired states (older than 10 minutes)
const cleanupExpiredStates = () => {
	const now = Date.now()
	for (const [state, data] of oauthStates.entries()) {
		if (now - data.timestamp > 10 * 60 * 1000) {
			// 10 minutes
			oauthStates.delete(state)
		}
	}
}

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
			return c.json(errorResponses.invalidCredentials)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(
			password,
			foundUser.password
		)
		if (!isPasswordValid) {
			return c.json(errorResponses.invalidCredentials)
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
			message: "Đăng nhập thành công",
		})
	} catch (error) {
		console.error("Login error:", error)
		return c.json(errorResponses.internalServerError, 500)
	}
}

export const getUserInfo = async (c: ValidatedContext) => {
	try {
		// Get user info from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return c.json(errorResponses.userNotAuthenticated)
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
			return c.json(errorResponses.userNotFound)
		}

		const foundUser = dbUser[0]

		// Check if user is still active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
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
			message: "Lấy thông tin người dùng thành công",
		})
	} catch (error) {
		console.error("Get user info error:", error)
		return c.json(errorResponses.internalServerError, 500)
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
				valid: true,
				user: {
					id: parseInt(userPayload.sub),
					email: userPayload.email,
					name: userPayload.name,
					roles: userPayload.roles,
				},
			})
		} catch (jwtError) {
			return c.json(errorResponses.invalidToken)
		}
	} catch (error) {
		console.error("Token verification error:", error)
		return c.json(errorResponses.internalServerError, 500)
	}
}

export const changePassword = async (c: ValidatedContext) => {
	try {
		// Get user from context (set by JWT middleware)
		const user = c.get("user")

		if (!user) {
			return c.json(errorResponses.userNotAuthenticated)
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
			return c.json(errorResponses.userNotFound)
		}

		const foundUser = dbUser[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			foundUser.password
		)

		if (!isCurrentPasswordValid) {
			return c.json(errorResponses.passwordMismatch)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)

		if (isSamePassword) {
			return c.json(errorResponses.samePassword)
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
		return c.json(errorResponses.internalServerError, 500)
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
			return c.json(errorResponses.emailNotFound)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
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
			console.error("Failed to send password reset email:", emailError)
			return c.json(errorResponses.emailSendFailed)
		}

		return c.json({
			message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn",
		})
	} catch (error) {
		console.error("Forgot password error:", error)
		return c.json(errorResponses.internalServerError, 500)
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
			return c.json(errorResponses.invalidToken)
		}

		const tokenData = resetTokenRecord[0]

		// Check if token has expired
		if (new Date() > tokenData.expiresAt) {
			return c.json(errorResponses.tokenExpired)
		}

		// Get user data
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, tokenData.userId))
			.limit(1)

		if (user.length === 0) {
			return c.json(errorResponses.userNotFound)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
		}

		// Check if new password is different from current password
		const isSamePassword = await bcrypt.compare(
			newPassword,
			foundUser.password
		)
		if (isSamePassword) {
			return c.json(errorResponses.samePassword)
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
			console.log(
				"Password reset confirmation email sent to",
				foundUser.email
			)
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
		return c.json(errorResponses.internalServerError, 500)
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
			return c.json(errorResponses.userNotAuthenticated)
		}

		const userId = user.id

		const dbUser = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (dbUser.length === 0) {
			return c.json(errorResponses.userNotFound)
		}

		const foundUser = dbUser[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
		}

		// Prepare metadata update
		const currentMetadata =
			(foundUser.metadata as Record<string, string>) || {}
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
		return c.json(errorResponses.internalServerError, 500)
	}
}

export const getAllUser = async (c: ValidatedContext) => {
	try {
		const roleCode = c.req.query("code")

		const conditions = [eq(users.status, "active")]

		if (roleCode) {
			const role = await db
				.select({
					id: roles.id,
					code: roles.code,
				})
				.from(roles)
				.where(eq(roles.code, roleCode))
				.limit(1)

			const foundRole = role[0]
			if (!foundRole) {
				return c.json({
					data: {
						users: [],
					},
					message: `No users found for roleCode '${roleCode}'`,
				})
			}

			conditions.push(eq(userRoles.roleId, foundRole.id))
		}

		const usersWithRoles = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				status: users.status,
				metadata: users.metadata,
				roleId: userRoles.roleId,
			})
			.from(users)
			.innerJoin(userRoles, eq(users.id, userRoles.userId))
			.where(and(...conditions))

		return c.json({
			data: {
				users: usersWithRoles,
			},
			message: "Get all users successfully",
		})
	} catch (error) {
		console.error("Get all users error:", error)
		return c.json(
			{
				error: "INTERNAL_SERVER_ERROR",
				message: "An error occurred while getting users.",
			},
			500
		)
	}
}

export const googleLogin = async (c: ValidatedContext) => {
	const body = (c.req as any).valid("json") as z.infer<
		typeof googleLoginSchema
	>
	const { token } = body

	const response = await fetch(
		`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
	)
	const data = await response.json()
	if (!response.ok) {
		return c.json(errorResponses.invalidToken)
	}

	if (response.ok) {
		const { email } = data

		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1)

		if (user.length === 0) {
			return c.json(errorResponses.userNotFound)
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			return c.json(errorResponses.accountInactive)
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
			message: `Đăng nhập Google thành công với tài khoản ${email}`,
		})
	}
}

export const initiateGoogleOAuth = async (c: Context) => {
	try {
		if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
			return c.json(
				{
					error: "OAUTH_NOT_CONFIGURED",
					message: "Google OAuth is not properly configured",
				},
				500
			)
		}

		// Expect POST request with redirectAfterLogin in body
		let redirectAfterLogin: string

		if (c.req.method === "POST") {
			// For POST requests, the validation middleware has already validated the body
			const body = (c.req as any).valid("json") as {
				redirectAfterLogin: string
			}
			redirectAfterLogin = body.redirectAfterLogin
		} else {
			// Fallback for GET requests (for testing)
			redirectAfterLogin =
				c.req.query("redirect_url") || "http://localhost:3000/dashboard"

			// Validate redirect URL for GET requests
			try {
				new URL(redirectAfterLogin)
			} catch {
				return c.json(
					{
						error: "INVALID_REDIRECT_URL",
						message: "redirect_url must be a valid URL",
					},
					400
				)
			}
		}

		// Generate state parameter for security
		const state = crypto.randomBytes(32).toString("hex")

		// Store state and redirect URL (expires in 10 minutes)
		oauthStates.set(state, {
			redirectUrl: redirectAfterLogin,
			timestamp: Date.now(),
		})

		// Clean up expired states
		cleanupExpiredStates()

		// FIXED: Auth service callback URL (this is always the same)
		const authServiceCallbackUrl = `${AUTH_URL}/api/v1/auth/google/callback`

		// Generate Google OAuth URL
		const googleOAuthUrl =
			`https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${GOOGLE_CLIENT_ID}&` +
			`redirect_uri=${encodeURIComponent(authServiceCallbackUrl)}&` +
			`response_type=code&` +
			`scope=openid%20email%20profile&` +
			`state=${state}`

		return c.json({
			data: {
				oauthUrl: googleOAuthUrl,
				state: state,
			},
			message: "Google OAuth URL generated successfully",
		})
	} catch (error) {
		console.error("Google OAuth initiation error:", error)
		return c.json(
			{
				error: "OAUTH_INITIATION_FAILED",
				message: "Failed to initiate Google OAuth",
			},
			500
		)
	}
}

export const googleOAuthCallback = async (c: Context) => {
	try {
		if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
			return c.json(
				{
					error: "OAUTH_NOT_CONFIGURED",
					message: "Google OAuth is not properly configured",
				},
				500
			)
		}

		// Get OAuth callback data
		const { code, state, error: oauthError } = c.req.query()

		if (oauthError) {
			return c.json(
				{
					error: "OAUTH_ERROR",
					message: oauthError,
				},
				400
			)
		}

		if (!code) {
			return c.json(
				{
					error: "OAUTH_CODE_MISSING",
					message: "Authorization code is missing",
				},
				400
			)
		}

		if (!state) {
			return c.json(
				{
					error: "OAUTH_STATE_MISSING",
					message: "State parameter is missing",
				},
				400
			)
		}

		// Verify state and get redirect URL
		const stateData = oauthStates.get(state)
		if (!stateData) {
			return c.json(
				{
					error: "INVALID_STATE",
					message: "Invalid or expired state parameter",
				},
				400
			)
		}

		// Remove used state
		oauthStates.delete(state)

		// Check if state is not expired (10 minutes)
		if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
			return c.json(
				{
					error: "EXPIRED_STATE",
					message: "OAuth state has expired",
				},
				400
			)
		}

		// Exchange code for tokens
		const authServiceCallbackUrl = `${c.req.url.split("?")[0]}` // Current callback URL without query params

		const tokenResponse = await fetch(
			"https://oauth2.googleapis.com/token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: GOOGLE_CLIENT_ID,
					client_secret: GOOGLE_CLIENT_SECRET,
					code,
					grant_type: "authorization_code",
					redirect_uri: authServiceCallbackUrl, // This must match the redirect_uri used in the authorization request
				}),
			}
		)

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json()
			console.error("Token exchange error:", errorData)
			return c.json(
				{
					error: "TOKEN_EXCHANGE_FAILED",
					message: "Failed to exchange authorization code for tokens",
				},
				400
			)
		}

		const tokenData = await tokenResponse.json()
		const { access_token, id_token } = tokenData

		// Get user info from Google
		const userInfoResponse = await fetch(
			"https://www.googleapis.com/oauth2/v2/userinfo",
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			}
		)

		if (!userInfoResponse.ok) {
			return c.json(
				{
					error: "USER_INFO_FAILED",
					message: "Failed to get user information from Google",
				},
				400
			)
		}

		const googleUser = await userInfoResponse.json()
		const { email, name, picture } = googleUser

		if (!email) {
			return c.json(
				{
					error: "EMAIL_NOT_PROVIDED",
					message: "Google account does not have email information",
				},
				400
			)
		}

		// Find user in database
		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1)

		if (user.length === 0) {
			// Redirect to client app with error
			const errorUrl = new URL(stateData.redirectUrl)
			errorUrl.searchParams.set("error", "USER_NOT_FOUND")
			errorUrl.searchParams.set(
				"message",
				"No account found with this Google email"
			)
			return c.redirect(errorUrl.toString())
		}

		const foundUser = user[0]

		// Check if user is active
		if (foundUser.status !== "active") {
			// Redirect to client app with error
			const errorUrl = new URL(stateData.redirectUrl)
			errorUrl.searchParams.set("error", "ACCOUNT_INACTIVE")
			errorUrl.searchParams.set("message", "Account is not active")
			return c.redirect(errorUrl.toString())
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

		// Update user metadata with Google info if needed
		const updatedMetadata = {
			...(foundUser.metadata || {}),
			googlePicture: picture,
			lastGoogleLogin: new Date().toISOString(),
		}

		await db
			.update(users)
			.set({
				metadata: updatedMetadata,
				updatedAt: new Date(),
			})
			.where(eq(users.id, foundUser.id))

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

		// Redirect to client app with success token
		const successUrl = new URL(stateData.redirectUrl)
		successUrl.searchParams.set("token", token)
		successUrl.searchParams.set("status", "success")

		return c.redirect(successUrl.toString())
	} catch (error) {
		console.error("Google OAuth callback error:", error)
		return c.json(
			{
				error: "OAUTH_CALLBACK_FAILED",
				message: "Failed to process Google OAuth callback",
			},
			500
		)
	}
}
