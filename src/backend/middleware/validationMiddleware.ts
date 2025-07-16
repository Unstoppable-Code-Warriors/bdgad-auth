import {
	loginSchema,
	tokenParamSchema,
	changePasswordSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	updateProfileSchema,
	createValidator,
	googleLoginSchema,
	googleOAuthInitSchema,
} from "../types/validation"

// Export validation middleware for use in routes
export const validateLogin = createValidator(loginSchema, "json")
export const validateTokenParam = createValidator(tokenParamSchema, "param")
export const validateChangePassword = createValidator(
	changePasswordSchema,
	"json"
)
export const validateForgotPassword = createValidator(
	forgotPasswordSchema,
	"json"
)
export const validateResetPassword = createValidator(
	resetPasswordSchema,
	"json"
)
export const validateUpdateProfile = createValidator(
	updateProfileSchema,
	"json"
)
export const validateGoogleLogin = createValidator(googleLoginSchema, "json")
export const validateGoogleOAuthInit = createValidator(
	googleOAuthInitSchema,
	"json"
)
