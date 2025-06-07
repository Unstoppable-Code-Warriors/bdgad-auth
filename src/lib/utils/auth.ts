import { auth } from "@/lib/next-auth/auth"

export class AuthError extends Error {
	constructor(message: string = "Unauthorized: Authentication required") {
		super(message)
		this.name = "AuthError"
	}
}

export class DatabaseError extends Error {
	constructor(message: string = "Database operation failed") {
		super(message)
		this.name = "DatabaseError"
	}
}

/**
 * Check if user is authenticated as system admin
 * @throws {AuthError} If user is not authenticated
 */
export async function requireAuth() {
	const session = await auth()
	if (!session?.user) {
		throw new AuthError()
	}
	return session
}

/**
 * Higher-order function that wraps actions with authentication and error handling
 * @param action The action function to wrap
 * @returns Wrapped action with auth and error handling
 */
export function withAuth<T extends any[], R>(
	action: (...args: T) => Promise<R>
) {
	return async (...args: T): Promise<R> => {
		try {
			// Check authentication first
			await requireAuth()

			// Execute the action
			return await action(...args)
		} catch (error) {
			console.error("Action error:", error)

			// Re-throw known error types
			if (error instanceof AuthError || error instanceof DatabaseError) {
				throw error
			}

			// Wrap unknown errors
			if (error instanceof Error) {
				throw new DatabaseError(error.message)
			}

			// Fallback for non-Error objects
			throw new DatabaseError("An unexpected error occurred")
		}
	}
}

/**
 * Generic error handler for database operations
 * @param error The error to handle
 * @param context Context information for logging
 */
export function handleDatabaseError(error: unknown, context: string): never {
	console.error(`Database error in ${context}:`, error)

	if (error instanceof AuthError) {
		throw error
	}

	if (error instanceof Error) {
		throw new DatabaseError(`Failed to ${context}: ${error.message}`)
	}

	throw new DatabaseError(`Failed to ${context}`)
}
