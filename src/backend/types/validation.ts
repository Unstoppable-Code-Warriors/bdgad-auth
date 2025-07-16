import { z } from "zod"
import { Context } from "hono"
import { zValidator } from "@hono/zod-validator"

// Login validation schema with improved error messages
export const loginSchema = z.object({
	email: z
		.string({
			required_error: "Email là bắt buộc",
			invalid_type_error: "Email phải là chuỗi ký tự",
		})
		.email("Vui lòng cung cấp địa chỉ email hợp lệ")
		.min(1, "Email không được để trống"),
	password: z
		.string({
			required_error: "Mật khẩu là bắt buộc",
			invalid_type_error: "Mật khẩu phải là chuỗi ký tự",
		})
		.min(1, "Mật khẩu không được để trống"),
})

// Token verification parameter schema
export const tokenParamSchema = z.object({
	token: z
		.string({
			required_error: "Token là bắt buộc",
			invalid_type_error: "Token phải là chuỗi ký tự",
		})
		.min(1, "Token không được để trống"),
})

// Change password validation schema
export const changePasswordSchema = z
	.object({
		currentPassword: z
			.string({
				required_error: "Mật khẩu hiện tại là bắt buộc",
				invalid_type_error: "Mật khẩu hiện tại phải là chuỗi ký tự",
			})
			.min(1, "Mật khẩu hiện tại không được để trống"),
		newPassword: z
			.string({
				required_error: "Mật khẩu mới là bắt buộc",
				invalid_type_error: "Mật khẩu mới phải là chuỗi ký tự",
			})
			.min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Mật khẩu mới phải chứa ít nhất một chữ thường, một chữ hoa và một số"
			),
		confirmPassword: z
			.string({
				required_error: "Xác nhận mật khẩu là bắt buộc",
				invalid_type_error: "Xác nhận mật khẩu phải là chuỗi ký tự",
			})
			.min(1, "Xác nhận mật khẩu không được để trống"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
		path: ["confirmPassword"],
	})

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
	email: z
		.string({
			required_error: "Email là bắt buộc",
			invalid_type_error: "Email phải là chuỗi ký tự",
		})
		.email("Vui lòng cung cấp địa chỉ email hợp lệ")
		.min(1, "Email không được để trống"),
	// url validate, also allow localhost
	redirectUrl: z
		.string({
			required_error: "URL chuyển hướng là bắt buộc",
			invalid_type_error: "URL chuyển hướng phải là chuỗi ký tự",
		})
		.url("Vui lòng cung cấp URL chuyển hướng hợp lệ"),
})

// Reset password validation schema
export const resetPasswordSchema = z
	.object({
		token: z
			.string({
				required_error: "Token đặt lại là bắt buộc",
				invalid_type_error: "Token đặt lại phải là chuỗi ký tự",
			})
			.min(1, "Token đặt lại không được để trống"),
		newPassword: z
			.string({
				required_error: "Mật khẩu mới là bắt buộc",
				invalid_type_error: "Mật khẩu mới phải là chuỗi ký tự",
			})
			.min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Mật khẩu mới phải chứa ít nhất một chữ thường, một chữ hoa và một số"
			),
		confirmPassword: z
			.string({
				required_error: "Xác nhận mật khẩu là bắt buộc",
				invalid_type_error: "Xác nhận mật khẩu phải là chuỗi ký tự",
			})
			.min(1, "Xác nhận mật khẩu không được để trống"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
		path: ["confirmPassword"],
	})

// Update profile validation schema
export const updateProfileSchema = z.object({
	name: z
		.string({
			required_error: "Tên là bắt buộc",
			invalid_type_error: "Tên phải là chuỗi ký tự",
		})
		.min(3, "Tên phải có ít nhất 3 ký tự")
		.max(50, "Tên không được vượt quá 50 ký tự")
		.regex(
			/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/,
			"Tên chỉ được chứa chữ cái (bao gồm tiếng Việt) và khoảng trắng đơn giữa các từ"
		),
	phone: z
		.string()
		.optional()
		.refine((phone) => {
			if (!phone || phone.trim() === "") return true
			const trimmed = phone.trim()
			return /^\d{10}$/.test(trimmed)
		}, "Số điện thoại phải gồm đúng 10 chữ số và không được chứa khoảng trắng"),
	address: z
		.string()
		.optional()
		.refine((address) => {
			if (!address || address.trim() === "") return true // Allow empty address
			const trimmedAddress = address.trim()
			// Check length
			if (trimmedAddress.length < 3 || trimmedAddress.length > 200) {
				return false
			}
			// Check for allowed characters: letters (including Vietnamese), numbers, single spaces, comma, slash
			return /^[a-zA-ZÀ-ỹ0-9,/]+( [a-zA-ZÀ-ỹ0-9,/]+)*$/.test(
				trimmedAddress
			)
		}, "Địa chỉ phải có 3-200 ký tự và chỉ được chứa chữ cái (bao gồm tiếng Việt), số, khoảng trắng đơn giữa các từ, dấu phẩy và dấu gạch chéo"),
})

// Custom validation error formatter
export const formatValidationError = (error: z.ZodError) => {
	const formattedErrors = error.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}))

	return {
		error: "VALIDATION_ERROR",
		message: `Lỗi xác thực: ${formattedErrors
			.map((err) => `${err.message}`)
			.join(". ")}`,
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

export const googleLoginSchema = z.object({
	token: z.string({
		required_error: "Token là bắt buộc",
		invalid_type_error: "Token phải là chuỗi ký tự",
	}),
})

export const googleOAuthInitSchema = z.object({
	redirectAfterLogin: z
		.string({
			required_error: "redirectAfterLogin là bắt buộc",
			invalid_type_error: "redirectAfterLogin phải là chuỗi ký tự",
		})
		.url("redirectAfterLogin phải là URL hợp lệ"),
})
