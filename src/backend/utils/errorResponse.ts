import { Context } from "hono"

export const createErrorResponse = (c: Context, errorType: string, customMessage?: string) => {
	const errorMap = {
		// Authentication errors (401)
		INVALID_CREDENTIALS: {
			status: 401,
            code: "INVALID_CREDENTIALS",
			message: "Thông tin đăng nhập không chính xác",
		},
		ACCOUNT_INACTIVE: {
			status: 401,
            code: "ACCOUNT_INACTIVE",
			message: "Tài khoản chưa được kích hoạt", 
		},
		USER_NOT_AUTHENTICATED: {
			status: 401,
            code: "USER_NOT_AUTHENTICATED",
			message: "Người dùng chưa được xác thực",
		},

		// Bad request errors (400)
		INVALID_TOKEN: {
			status: 400,
            code: "INVALID_TOKEN",
			message: "Token không hợp lệ hoặc đã hết hạn",
		},
		PASSWORD_MISMATCH: {
			status: 400,
            code: "PASSWORD_MISMATCH",
			message: "Mật khẩu hiện tại không chính xác",
		},
		SAME_PASSWORD: {
			status: 400,
            code: "SAME_PASSWORD",
			message: "Mật khẩu mới phải khác với mật khẩu hiện tại",
		},
		TOKEN_EXPIRED: {
			status: 400,
            code: "TOKEN_EXPIRED",
			message: "Token đã hết hạn",
		},

		// Not found errors (404)
		USER_NOT_FOUND: {
			status: 404,
            code: "USER_NOT_FOUND",
			message: "Không tìm thấy người dùng",
		},
		EMAIL_NOT_FOUND: {
			status: 404,
            code: "EMAIL_NOT_FOUND",
			message: "Không tìm thấy email trong hệ thống",
		},

		// Server errors (500)
		INTERNAL_SERVER_ERROR: {
			status: 500,
            code: "INTERNAL_SERVER_ERROR",
			message: `Lỗi thực hiện yêu cầu: ${customMessage || "Không xác định"}`,
		},
		EMAIL_SEND_FAILED: {
			status: 500,
            code: "EMAIL_SEND_FAILED",
			message: "Gửi email đặt lại mật khẩu thất bại",
		}
	}

	const errorConfig = errorMap[errorType as keyof typeof errorMap]
	
	if (!errorConfig) {
		return c.json({
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: `Lỗi thực hiện yêu cầu: ${customMessage || "Không xác định"}`
        },500)
	}

    if(errorConfig.code === "INTERNAL_SERVER_ERROR") {
        return c.json(errorConfig, 500)
    }

	return c.json(errorConfig)
}

// Convenience functions for common error types
export const invalidCredentials = (c: Context) => createErrorResponse(c, "INVALID_CREDENTIALS")
export const accountInactive = (c: Context, customMessage?: string) => createErrorResponse(c, "ACCOUNT_INACTIVE", customMessage)
export const userNotAuthenticated = (c: Context) => createErrorResponse(c, "USER_NOT_AUTHENTICATED")
export const invalidToken = (c: Context) => createErrorResponse(c, "INVALID_TOKEN")
export const passwordMismatch = (c: Context) => createErrorResponse(c, "PASSWORD_MISMATCH")
export const samePassword = (c: Context) => createErrorResponse(c, "SAME_PASSWORD")
export const tokenExpired = (c: Context) => createErrorResponse(c, "TOKEN_EXPIRED")
export const userNotFound = (c: Context) => createErrorResponse(c, "USER_NOT_FOUND")
export const emailNotFound = (c: Context) => createErrorResponse(c, "EMAIL_NOT_FOUND")
export const internalServerError = (c: Context, customMessage?: string) => createErrorResponse(c, "INTERNAL_SERVER_ERROR", customMessage)
export const emailSendFailed = (c: Context) => createErrorResponse(c, "EMAIL_SEND_FAILED") 