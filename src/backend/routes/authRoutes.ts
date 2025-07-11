import { Hono } from "hono";
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
} from "../controllers/authController";
import {
  validateLogin,
  validateTokenParam,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateGoogleLogin,
} from "../middleware/validationMiddleware";
import { jwtAuth } from "../middleware/jwtMiddleware";

const authRoutes = new Hono();

// POST /auth/login - Login endpoint with validation
authRoutes.post("/login", validateLogin, login);

// GET /auth/me - Get current user information
authRoutes.get("/me", jwtAuth, getUserInfo);

// GET /auth/verify/:token - Verify JWT token with validation
authRoutes.get("/verify/:token", validateTokenParam, verifyToken);

// PUT /auth/change-password - Change user password
authRoutes.put(
  "/change-password",
  jwtAuth,
  validateChangePassword,
  changePassword
);

// POST /auth/forgot-password - Request password reset
authRoutes.post("/forgot-password", validateForgotPassword, forgotPassword);

// POST /auth/reset-password - Reset password with token
authRoutes.post("/reset-password", validateResetPassword, resetPassword);

// POST /auth/change-password - Change user password
authRoutes.post(
  "/change-password",
  jwtAuth,
  validateChangePassword,
  changePassword
);

// PUT /auth/update-profile - Update user profile
authRoutes.put(
  "/update-profile",
  jwtAuth,
  validateUpdateProfile,
  updateProfile
);

// POST /auth/google-login - Google login
authRoutes.post("/sso", validateGoogleLogin, googleLogin);

// GET /auth/users - Get all users
authRoutes.get("/users", jwtAuth, getAllUser);

export default authRoutes;
