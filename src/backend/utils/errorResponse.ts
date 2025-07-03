export const errorResponses = {
    accountInactive: {
        status: 401,
        code: "ACCOUNT_INACTIVE",
        message: "Account is not active",
    },
    invalidCredentials: {
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
    },
    emailNotFound: {
        status: 404,
        code: "EMAIL_NOT_FOUND",
        message: "Email not found in the system",
    },
    internalServerError: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
    },
    userNotFound: {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found"
    },
    userAlreadyExists: {
        status: 409,
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
    },
    passwordMismatch: {
        status: 400,
        code: "PASSWORD_MISMATCH",
        message: "Password mismatch",
    },
    invalidToken: {
        status: 401,
        code: "INVALID_TOKEN",
        message: "Invalid token",
    },
    tokenExpired: {
        status: 401,
        code: "TOKEN_EXPIRED",
        message: "Token expired",
    },
    invalidPassword: { 
        status: 400,
        code: "INVALID_PASSWORD",
        message: "Invalid password",
    },
    userNotAuthenticated: {
        status: 401,
        code: "USER_NOT_AUTHENTICATED",
        message: "User not authenticated",
    },
    samePassword: {
        status: 400,
        code: "SAME_PASSWORD",
        message: "New password must be different from current password",
    },
    emailSendFailed: {
        status: 500,
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send password reset email",
    }
}

export const createErrorResponse = (errorType: keyof typeof errorResponses) => {
    return errorResponses[errorType]
}