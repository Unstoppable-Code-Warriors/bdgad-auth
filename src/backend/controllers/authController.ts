import { sign, verify } from "hono/jwt"
import { db } from "../../db/drizzle"
import { users, roles, userRoles } from "../../db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { UserInfo } from "../types"
import { ValidatedContext } from "../types/context"
import { z } from "zod"
import {
	loginSchema,
	tokenParamSchema,
	createValidator,
} from "../types/validation"

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
				roleName: roles.name,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const roleNames = userRoleData.map((role) => role.roleName)

		// Create JWT payload
		const payload = {
			sub: foundUser.id.toString(),
			email: foundUser.email,
			name: foundUser.name,
			roles: roleNames,
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
				roles: roleNames,
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
				roleName: roles.name,
				roleDescription: roles.description,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, foundUser.id))

		const roleNames = userRoleData.map((role) => role.roleName)

		const userInfo: UserInfo = {
			id: foundUser.id,
			email: foundUser.email,
			name: foundUser.name,
			status: foundUser.status,
			roles: roleNames,
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
		const { token } = (c.req as any).valid("param") as z.infer<
			typeof tokenParamSchema
		>

		try {
			// Verify JWT token
			const payload = await verify(token, JWT_SECRET)

			return c.json({
				success: true,
				valid: true,
				payload: {
					sub: payload.sub,
					email: payload.email,
					name: payload.name,
					roles: payload.roles,
					iat: payload.iat,
					exp: payload.exp,
				},
			})
		} catch (jwtError) {
			return c.json(
				{
					success: false,
					valid: false,
					error: "Invalid or expired token",
				},
				401
			)
		}
	} catch (error) {
		console.error("Verify token error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

// Export validation middleware for use in routes with improved error handling
export const validateLogin = createValidator(loginSchema, "json")
export const validateTokenParam = createValidator(tokenParamSchema, "param")
