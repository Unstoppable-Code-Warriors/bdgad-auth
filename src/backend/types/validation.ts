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

// Update profile validation schema
export const updateProfileSchema = z.object({
	name: z
		.string({
			required_error: "Name is required",
			invalid_type_error: "Name must be a string",
		})
		.min(3, "Name must be at least 3 characters long")
		.max(50, "Name must not exceed 50 characters")
		.regex(
			/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/,
			"Name can only contain letters (including Vietnamese) and single spaces between words"
		),
	phone: z
		.string()
		.optional()
		.refine((phone) => {
			if (!phone || phone.trim() === "") return true; // Allow empty phone
			return !/\s/.test(phone); // No spaces allowed if phone has value
		}, "Phone number cannot contain spaces"),
	address: z
		.string()
		.optional()
		.refine((address) => {
			if (!address || address.trim() === "") return true; // Allow empty address
			const trimmedAddress = address.trim();
			// Check length
			if (trimmedAddress.length < 3 || trimmedAddress.length > 200) {
				return false;
			}
			// Check for allowed characters: letters (including Vietnamese), numbers, single spaces, comma, slash
			return /^[a-zA-ZÀ-ỹ0-9,/]+( [a-zA-ZÀ-ỹ0-9,/]+)*$/.test(trimmedAddress);
		}, "Address must be 3-200 characters and can only contain letters (including Vietnamese), numbers, single spaces between words, commas, and slashes"),
})

// Custom validation error formatter
export const formatValidationError = (error: z.ZodError) => {
	const formattedErrors = error.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
	}))

	return {
		error: "Validation error",
		details: formattedErrors,
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
