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
