import { Hono } from "hono"
import {
	login,
	getUserInfo,
	verifyToken,
	changePassword,
	validateLogin,
	validateTokenParam,
	validateChangePassword,
} from "../controllers/authController"
import { jwtAuth } from "../middleware/jwtMiddleware"

const authRoutes = new Hono()

// POST /auth/login - Login endpoint with validation
authRoutes.post("/login", validateLogin, login)

// GET /auth/me - Get current user information
authRoutes.get("/me", jwtAuth, getUserInfo)

// GET /auth/verify/:token - Verify JWT token with validation
authRoutes.get("/verify/:token", validateTokenParam, verifyToken)

// PUT /auth/change-password - Change user password
authRoutes.put(
	"/change-password",
	jwtAuth,
	validateChangePassword,
	changePassword
)

export default authRoutes
