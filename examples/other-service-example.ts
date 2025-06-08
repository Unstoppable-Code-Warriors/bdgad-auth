// Example: How another service can use the BDGAD Auth Service
import { Hono, Context, Next } from "hono"

// Define the context variables type
type Variables = {
	user: {
		id: number
		email: string
		name: string
		roles: string[]
	}
}

// This would be your JWT middleware (copy from the auth service)
// You can also create a shared npm package for this
const jwtAuth = async (c: Context, next: Next) => {
	try {
		const authHeader = c.req.header("Authorization")

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json({ error: "Authorization token required" }, 401)
		}

		const token = authHeader.substring(7)

		// Option 1: Verify token locally (if you have the same JWT secret)
		// const payload = await verify(token, JWT_SECRET)

		// Option 2: Verify token by calling the auth service
		const verifyResponse = await fetch(
			"http://auth-service:3000/api/v1/auth/verify",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (!verifyResponse.ok) {
			return c.json({ error: "Invalid token" }, 401)
		}

		const verifyData = await verifyResponse.json()

		if (!verifyData.valid) {
			return c.json({ error: "Invalid token" }, 401)
		}

		// Add user info to context
		c.set("user", {
			id: parseInt(verifyData.payload.sub),
			email: verifyData.payload.email,
			name: verifyData.payload.name,
			roles: verifyData.payload.roles,
		})

		await next()
	} catch (error) {
		console.error("JWT middleware error:", error)
		return c.json({ error: "Internal server error" }, 500)
	}
}

// Your service app
const app = new Hono<{ Variables: Variables }>()

// Public routes
app.get("/", (c) => {
	return c.json({
		service: "My Awesome Service",
		version: "1.0.0",
	})
})

// Protected routes
app.get("/protected-data", jwtAuth, (c) => {
	const user = c.get("user")

	return c.json({
		message: "This is protected data",
		user: user,
		data: {
			// Your service-specific data
			items: ["item1", "item2", "item3"],
		},
	})
})

// Admin only route
app.get("/admin-data", jwtAuth, (c) => {
	const user = c.get("user")

	if (!user.roles.includes("admin")) {
		return c.json({ error: "Admin access required" }, 403)
	}

	return c.json({
		message: "Admin only data",
		adminData: {
			// Sensitive admin data
			systemStats: { users: 100, revenue: 50000 },
		},
	})
})

export default app

// Usage example for client applications:
/*

// 1. Login to get token
const loginResponse = await fetch("http://auth-service:3000/api/v1/auth/login", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		email: "user@example.com",
		password: "password123"
	})
})

const { token } = await loginResponse.json()

// 2. Use token to access other services
const dataResponse = await fetch("http://my-service:3001/protected-data", {
	headers: {
		"Authorization": `Bearer ${token}`
	}
})

const data = await dataResponse.json()
console.log(data)

*/
