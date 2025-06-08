import { Hono } from "hono"
import { cors } from "hono/cors"
import authRoutes from "./routes/authRoutes"

const app = new Hono().basePath("/api/v1")

// Add CORS middleware for cross-origin requests
app.use(
	"*",
	cors({
		origin: "*", // Add your frontend URLs
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	})
)

app.get("/", (c) => {
	return c.json({
		message: "Welcome to the BDGAD Auth Service API",
		version: "1.0.0",
		endpoints: {
			auth: {
				login: "POST /auth/login",
				userInfo: "GET /auth/me",
				verifyToken: "GET /auth/verify/:token",
				changePassword: "PUT /auth/change-password",
				forgotPassword: "POST /auth/forgot-password",
				resetPassword: "POST /auth/reset-password",
			},
		},
	})
})

// Mount authentication routes
app.route("/auth", authRoutes)

export default app
