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
        status: 500,
        code: "EMAIL_NOT_FOUND",
        message: "Email not found in the system"
    },
    internalServerError: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error"
    }
}

export const createErrorResponse = (errorType: keyof typeof errorResponses) => {
    return errorResponses[errorType]
}