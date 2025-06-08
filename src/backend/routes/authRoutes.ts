import { Hono } from "hono"
import {
	login,
	getUserInfo,
	verifyToken,
	validateLogin,
	validateTokenParam,
} from "../controllers/authController"
import { jwtAuth } from "../middleware/jwtMiddleware"

const authRoutes = new Hono()

// POST /auth/login - Login endpoint with validation
authRoutes.post("/login", validateLogin, login)

// GET /auth/me - Get current user information
authRoutes.get("/me", jwtAuth, getUserInfo)

// GET /auth/verify/:token - Verify JWT token with validation
authRoutes.get("/verify/:token", validateTokenParam, verifyToken)

export default authRoutes
