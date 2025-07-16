import { Hono } from "hono"
import {
	login,
	getUserInfo,
	verifyToken,
	changePassword,
	forgotPassword,
	resetPassword,
	updateProfile,
	googleLogin,
	getAllUser,
	googleOAuthCallback,
	initiateGoogleOAuth,
} from "../controllers/authController"
import {
	validateLogin,
	validateTokenParam,
	validateChangePassword,
	validateForgotPassword,
	validateResetPassword,
	validateUpdateProfile,
	validateGoogleLogin,
	validateGoogleOAuthInit,
} from "../middleware/validationMiddleware"
import { jwtAuth } from "../middleware/jwtMiddleware"

const authRoutes = new Hono()

// POST /auth/login - Login endpoint with validation
authRoutes.post("/login", validateLogin, login)

// GET /auth/me - Get current user information
authRoutes.get("/me", jwtAuth, getUserInfo)

// GET /auth/verify/:token - Verify JWT token with validation
authRoutes.get("/verify/:token", validateTokenParam, verifyToken)

// PUT /auth/change-password - Change password with validation and JWT auth
authRoutes.put(
	"/change-password",
	jwtAuth,
	validateChangePassword,
	changePassword
)

// POST /auth/forgot-password - Forgot password endpoint with validation
authRoutes.post("/forgot-password", validateForgotPassword, forgotPassword)

// POST /auth/reset-password - Reset password endpoint with validation
authRoutes.post("/reset-password", validateResetPassword, resetPassword)

// PUT /auth/update-profile - Update profile endpoint with validation and JWT auth
authRoutes.put("/update-profile", jwtAuth, validateUpdateProfile, updateProfile)

// GET /auth/users - Get all users with optional role filtering
authRoutes.get("/users", getAllUser)

// Google OAuth routes
// POST /auth/google - Initiate Google OAuth flow (recommended)
authRoutes.post("/google", validateGoogleOAuthInit, initiateGoogleOAuth)

// GET /auth/google - Initiate Google OAuth flow (fallback for testing)
authRoutes.get("/google", initiateGoogleOAuth)

// GET /auth/google/callback - Handle Google OAuth callback
authRoutes.get("/google/callback", googleOAuthCallback)

// POST /auth/sso - Legacy Google login (keep for backward compatibility)
authRoutes.post("/sso", validateGoogleLogin, googleLogin)

export default authRoutes
