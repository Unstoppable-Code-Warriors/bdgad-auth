# API Testing Guide - Forgot Password

This guide shows how to test the forgot password functionality.

## Prerequisites

1. Ensure your `.env` file has the required email configuration:

    ```env
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-app-password
    AUTH_URL=http://localhost:3000
    ```

2. Start the development server:
    ```bash
    npm run dev
    ```

## API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**

```json
{
	"email": "user@example.com"
}
```

**Success Response:**

```json
{
	"success": true,
	"message": "If an account with that email exists, a password reset link has been sent."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 2. Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**

```json
{
	"token": "reset-token-from-email",
	"newPassword": "NewSecurePassword123",
	"confirmPassword": "NewSecurePassword123"
}
```

**Success Response:**

```json
{
	"success": true,
	"message": "Password has been reset successfully"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-reset-token-here",
    "newPassword": "NewSecurePassword123",
    "confirmPassword": "NewSecurePassword123"
  }'
```

## Testing Flow

1. **Request Password Reset:**

    - Send a POST request to `/auth/forgot-password` with a valid user email
    - Check your email for the password reset link
    - Extract the token from the URL (e.g., `?token=abc123...`)

2. **Reset Password:**

    - Use the token from the email in the `/auth/reset-password` endpoint
    - Provide a new password that meets the requirements:
        - At least 8 characters long
        - Contains at least one lowercase letter
        - Contains at least one uppercase letter
        - Contains at least one number

3. **Verify Reset:**
    - Try logging in with the new password using `/auth/login`
    - You should also receive a confirmation email

## Error Responses

### Validation Errors (400)

```json
{
	"success": false,
	"error": {
		"type": "validation_error",
		"message": "Please check the following fields and try again:",
		"details": [
			{
				"field": "email",
				"message": "Please provide a valid email address",
				"code": "invalid_string"
			}
		]
	}
}
```

### Invalid/Expired Token (400)

```json
{
	"error": "Invalid or expired reset token"
}
```

### Server Error (500)

```json
{
	"error": "Internal server error"
}
```

## Security Features

-   **Email Enumeration Protection:** The API always returns success, even for non-existent emails
-   **Token Expiration:** Reset tokens expire after 1 hour
-   **One-time Use:** Reset tokens can only be used once
-   **Password Validation:** New passwords must meet security requirements
-   **Rate Limiting:** Consider implementing rate limiting for production use

## Database Tables

The forgot password functionality uses the `password_reset_tokens` table:

```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used VARCHAR(10) NOT NULL DEFAULT 'false',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```
