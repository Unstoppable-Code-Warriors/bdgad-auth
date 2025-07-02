export const errorResponses = {
    accountInactive: {
        status: 401,
        code: "ACCOUNT_INACTIVE",
        message: "Account is not active",
        details: "The account associated with this email is not active."
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
        details: "The provided email address does not exist in our records."
    },
    internalServerError: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: "An unexpected error occurred. Please try again later."
    },
    userNotFound: {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: "The user with the provided ID does not exist."
    },
    userAlreadyExists: {
        status: 409,
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
        details: "A user with this email already exists in the system."
    },
    passwordMismatch: {
        status: 400,
        code: "PASSWORD_MISMATCH",
        message: "Password mismatch",
        details: "The provided password does not match the current password."
    },
    invalidToken: {
        status: 401,
        code: "INVALID_TOKEN",
        message: "Invalid token",
        details: "The provided token is invalid or has expired."
    },
    tokenExpired: {
        status: 401,
        code: "TOKEN_EXPIRED",
        message: "Token expired",
        details: "The provided token has expired."
    },
    invalidPassword: { 
        status: 400,
        code: "INVALID_PASSWORD",
        message: "Invalid password",
        details: "The provided password is invalid."
    },
    userNotAuthenticated: {
        status: 401,
        code: "USER_NOT_AUTHENTICATED",
        message: "User not authenticated",
        details: "Authentication is required to access this resource."
    },
    samePassword: {
        status: 400,
        code: "SAME_PASSWORD",
        message: "New password must be different from current password",
        details: "The new password cannot be the same as the current password."
    },
    emailSendFailed: {
        status: 500,
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send password reset email",
        details: "There was an error sending the password reset email. Please try again later."
    }
}

export const createErrorResponse = (errorType: keyof typeof errorResponses) => {
    return errorResponses[errorType]
}