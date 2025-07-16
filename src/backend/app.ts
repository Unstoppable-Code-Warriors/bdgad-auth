import { Hono } from "hono"
import { cors } from "hono/cors"
import authRoutes from "./routes/authRoutes"

const app = new Hono().basePath("/api/v1")

// Add CORS middleware for cross-origin requests
app.use(
	"*",
	cors({
		origin: "*", // Add your frontend URLs
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"Accept",
			"X-Requested-With",
			"Access-Control-Allow-Origin",
			"Access-Control-Allow-Headers",
			"Access-Control-Allow-Methods",
		],
		exposeHeaders: ["Content-Length", "X-Request-Id"],
		maxAge: 86400, // 24 hours
		credentials: true,
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
				updateProfile: "PUT /auth/update-profile",
				forgotPassword: "POST /auth/forgot-password",
				resetPassword: "POST /auth/reset-password",
				googleOAuthInit: "POST /auth/google", // Recommended
				googleOAuthInitLegacy: "GET /auth/google", // For testing
				googleCallback: "GET /auth/google/callback",
				googleLogin: "POST /auth/sso", // Legacy endpoint
				getAllUser: "GET /auth/users",
			},
		},
	})
})

// Mount authentication routes
app.route("/auth", authRoutes)

export default app
