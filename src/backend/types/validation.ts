import { z } from "zod"
import { Context } from "hono"
import { zValidator } from "@hono/zod-validator"

// Login validation schema with improved error messages
export const loginSchema = z.object({
	email: z
		.string({
			required_error: "Email is required",
			invalid_type_error: "Email must be a string",
		})
		.email("Please provide a valid email address")
		.min(1, "Email cannot be empty"),
	password: z
		.string({
			required_error: "Password is required",
			invalid_type_error: "Password must be a string",
		})
		.min(1, "Password cannot be empty"),
})

// Token verification parameter schema
export const tokenParamSchema = z.object({
	token: z
		.string({
			required_error: "Token is required",
			invalid_type_error: "Token must be a string",
		})
		.min(1, "Token cannot be empty"),
})

// Change password validation schema
export const changePasswordSchema = z
	.object({
		currentPassword: z
			.string({
				required_error: "Current password is required",
				invalid_type_error: "Current password must be a string",
			})
			.min(1, "Current password cannot be empty"),
		newPassword: z
			.string({
				required_error: "New password is required",
				invalid_type_error: "New password must be a string",
			})
			.min(8, "New password must be at least 8 characters long")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"New password must contain at least one lowercase letter, one uppercase letter, and one number"
			),
		confirmPassword: z
			.string({
				required_error: "Password confirmation is required",
				invalid_type_error: "Password confirmation must be a string",
			})
			.min(1, "Password confirmation cannot be empty"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "New password and confirmation password do not match",
		path: ["confirmPassword"],
	})

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
	email: z
		.string({
			required_error: "Email is required",
			invalid_type_error: "Email must be a string",
		})
		.email("Please provide a valid email address")
		.min(1, "Email cannot be empty"),
	// url validate, also allow localhost
	redirectUrl: z
		.string({
			required_error: "Redirect URL is required",
			invalid_type_error: "Redirect URL must be a string",
		})
		.url("Please provide a valid redirect URL"),
})

// Reset password validation schema
export const resetPasswordSchema = z
	.object({
		token: z
			.string({
				required_error: "Reset token is required",
				invalid_type_error: "Reset token must be a string",
			})
			.min(1, "Reset token cannot be empty"),
		newPassword: z
			.string({
				required_error: "New password is required",
				invalid_type_error: "New password must be a string",
			})
			.min(8, "New password must be at least 8 characters long")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"New password must contain at least one lowercase letter, one uppercase letter, and one number"
			),
		confirmPassword: z
			.string({
				required_error: "Password confirmation is required",
				invalid_type_error: "Password confirmation must be a string",
			})
			.min(1, "Password confirmation cannot be empty"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "New password and confirmation password do not match",
		path: ["confirmPassword"],
	})

// Custom validation error formatter
export const formatValidationError = (error: z.ZodError) => {
	const formattedErrors = error.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}))

	return {
		success: false,
		error: {
			type: "validation_error",
			message: "Please check the following fields and try again:",
			details: formattedErrors,
		},
	}
}

// Custom validator with better error handling
export const createValidator = (
	schema: z.ZodSchema,
	target: "json" | "param" = "json"
) => {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			return c.json(formatValidationError(result.error), 400)
		}
	})
}
