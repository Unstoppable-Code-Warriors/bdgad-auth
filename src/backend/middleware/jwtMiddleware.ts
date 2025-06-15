import { Context, Next } from "hono"
import { verify } from "hono/jwt"
import { JWTPayload } from "../types"
import { db } from "../../db/drizzle"
import { users } from "../../db/schema"
import { eq } from "drizzle-orm"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"

// Middleware to verify JWT token and add user info to context
export const jwtAuth = async (c: Context, next: Next) => {
	try {
		const authHeader = c.req.header("Authorization")

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json({ error: "Authorization token required" }, 401)
		}

		const token = authHeader.substring(7) // Remove "Bearer " prefix

		try {
			// Verify JWT token
			const payload = await verify(token, JWT_SECRET)

			// Type assertion for our custom payload structure
			const userPayload = payload as unknown as JWTPayload

			// Check if user is still active
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, parseInt(userPayload.sub)))
				.limit(1)

			if (!user || user.status !== "active") {
				return c.json({ status: 401,message: "Account is not active", code: "ACCOUNT_INACTIVE" })
			}

			// Add user info to context
			c.set("user", {
				id: parseInt(userPayload.sub),
				email: userPayload.email,
				name: userPayload.name,
				roles: userPayload.roles,
			})

			await next()
		} catch (jwtError) {
			return c.json({ error: "Invalid or expired token" }, 401)
		}
	} catch (error) {
		console.error("JWT middleware error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

// Middleware to check if user has specific role
export const requireRole = (requiredRole: string) => {
	return async (c: Context, next: Next) => {
		const user = c.get("user")

		if (!user) {
			return c.json({ error: "User not authenticated" }, 401)
		}

		if (!user.roles.includes(requiredRole)) {
			return c.json(
				{ error: `Access denied. Required role: ${requiredRole}` },
				403
			)
		}

		await next()
	}
}

// Middleware to check if user has any of the specified roles
export const requireAnyRole = (requiredRoles: string[]) => {
	return async (c: Context, next: Next) => {
		const user = c.get("user")

		if (!user) {
			return c.json({ error: "User not authenticated" }, 401)
		}

		const hasRole = requiredRoles.some((role) => user.roles.includes(role))

		if (!hasRole) {
			return c.json(
				{
					error: `Access denied. Required roles: ${requiredRoles.join(
						", "
					)}`,
				},
				403
			)
		}

		await next()
	}
}
