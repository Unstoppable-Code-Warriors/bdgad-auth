# Google SSO Implementation

This document describes the Google Single Sign-On (SSO) implementation for the BDGAD Auth Service.

## Overview

The auth service supports Google OAuth 2.0 authentication with a proper flow that redirects users back to your client application after successful authentication.

**Flow Overview:**

1. Client app sends POST request to auth service with redirect URL
2. Auth service returns Google OAuth URL
3. Client app redirects user to Google OAuth URL
4. User authenticates with Google
5. Google redirects to auth service callback
6. Auth service processes authentication and redirects back to client app with token

## Prerequisites

Make sure you have the following environment variables configured:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## OAuth Flow (Recommended)

### 1. Initiate OAuth Flow

**Endpoint**: `POST /api/v1/auth/google`

**Request Body**:

```json
{
	"redirectAfterLogin": "https://yourapp.com/auth/callback"
}
```

**Success Response**:

```json
{
	"data": {
		"oauthUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&state=...",
		"state": "generated_state_token"
	},
	"message": "Google OAuth URL generated successfully"
}
```

**Error Responses**:

-   `OAUTH_NOT_CONFIGURED`: Google OAuth credentials not set
-   `INVALID_REDIRECT_URL`: Invalid redirectAfterLogin URL
-   `REDIRECT_URL_REQUIRED`: Missing redirectAfterLogin field

### 2. Redirect User to Google

After receiving the OAuth URL, redirect the user to the `oauthUrl` from the response.

### 3. Handle Callback in Your App

After successful authentication, the user will be redirected to your `redirectAfterLogin` URL with query parameters:

**Success callback**:

```
https://yourapp.com/auth/callback?token=jwt_token_here&status=success
```

**Error callback**:

```
https://yourapp.com/auth/callback?error=USER_NOT_FOUND&message=No+account+found
```

## Legacy Token Validation

**Endpoint**: `POST /api/v1/auth/sso`

**Request Body**:

```json
{
	"token": "google_access_token"
}
```

This endpoint validates Google access tokens directly and returns a JWT token.

## Frontend Integration Examples

### JavaScript/React Example

```javascript
// Step 1: Initiate Google OAuth
const initiateGoogleLogin = async () => {
	try {
		const response = await fetch("/api/v1/auth/google", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				redirectAfterLogin: window.location.origin + "/auth/callback",
			}),
		})

		const data = await response.json()

		if (data.data?.oauthUrl) {
			// Redirect to Google OAuth
			window.location.href = data.data.oauthUrl
		}
	} catch (error) {
		console.error("Failed to initiate Google login:", error)
	}
}

// Step 2: Handle callback in your app (e.g., /auth/callback page)
const handleAuthCallback = () => {
	const urlParams = new URLSearchParams(window.location.search)
	const token = urlParams.get("token")
	const status = urlParams.get("status")
	const error = urlParams.get("error")

	if (status === "success" && token) {
		// Store token and redirect to dashboard
		localStorage.setItem("authToken", token)
		window.location.href = "/dashboard"
	} else if (error) {
		const message = urlParams.get("message") || "Authentication failed"
		alert(`Login failed: ${message}`)
		window.location.href = "/login"
	}
}

// Button click handler
document
	.getElementById("google-login-btn")
	.addEventListener("click", initiateGoogleLogin)
```

### React Hook Example

```javascript
import { useState } from "react"

const useGoogleAuth = () => {
	const [loading, setLoading] = useState(false)

	const initiateGoogleLogin = async (redirectUrl) => {
		setLoading(true)
		try {
			const response = await fetch("/api/v1/auth/google", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ redirectAfterLogin: redirectUrl }),
			})

			const data = await response.json()

			if (data.data?.oauthUrl) {
				window.location.href = data.data.oauthUrl
			} else {
				throw new Error("Failed to get OAuth URL")
			}
		} catch (error) {
			console.error("Google login error:", error)
			setLoading(false)
		}
	}

	return { initiateGoogleLogin, loading }
}

// Usage in component
const LoginPage = () => {
	const { initiateGoogleLogin, loading } = useGoogleAuth()

	const handleGoogleLogin = () => {
		const callbackUrl = `${window.location.origin}/auth/callback`
		initiateGoogleLogin(callbackUrl)
	}

	return (
		<button onClick={handleGoogleLogin} disabled={loading}>
			{loading ? "Redirecting..." : "Sign in with Google"}
		</button>
	)
}
```

### Next.js Example

```javascript
// pages/auth/callback.js or app/auth/callback/page.js
import { useEffect } from "react"
import { useRouter } from "next/router"

export default function AuthCallback() {
	const router = useRouter()

	useEffect(() => {
		const { token, status, error, message } = router.query

		if (status === "success" && token) {
			localStorage.setItem("authToken", token)
			router.push("/dashboard")
		} else if (error) {
			alert(`Login failed: ${message || error}`)
			router.push("/login")
		}
	}, [router.query])

	return <div>Processing authentication...</div>
}
```

## Testing with GET (Development Only)

For testing purposes, you can use a GET request:

**Endpoint**: `GET /api/v1/auth/google?redirect_url=https://yourapp.com/callback`

This will directly redirect to Google OAuth. **Not recommended for production.**

## Security Features

1. **State Parameter**: Prevents CSRF attacks using cryptographically secure random state
2. **URL Validation**: Validates redirect URLs to prevent open redirects
3. **Token Expiration**: OAuth states expire after 10 minutes
4. **User Verification**: Only allows login for existing, active users
5. **JWT Security**: Creates secure JWT tokens with 7-day expiration

## Error Handling

**OAuth Initiation Errors**:

-   `OAUTH_NOT_CONFIGURED`: Missing Google OAuth configuration
-   `INVALID_REDIRECT_URL`: Invalid redirectAfterLogin URL
-   `REDIRECT_URL_REQUIRED`: Missing redirectAfterLogin field

**Callback Errors** (redirected to client app):

-   `USER_NOT_FOUND`: No account found with Google email
-   `ACCOUNT_INACTIVE`: User account is deactivated
-   `OAUTH_ERROR`: Google OAuth process error
-   `INVALID_STATE`: Invalid or expired OAuth state

## Production Considerations

1. **State Storage**: The current implementation uses in-memory storage for OAuth states. For production with multiple instances, use Redis or a database.

2. **HTTPS Required**: Google OAuth requires HTTPS in production.

3. **Domain Whitelist**: Consider implementing a whitelist of allowed redirect domains for additional security.

4. **Rate Limiting**: Implement rate limiting on OAuth endpoints to prevent abuse.

## Migration from Legacy Implementation

If you're currently using the legacy `POST /auth/sso` endpoint:

1. Update your frontend to use the new two-step flow
2. The legacy endpoint remains available for backward compatibility
3. The new flow provides better security and user experience

## Notes

-   Users must already exist in the database with their Google email
-   The system does not automatically create new users via Google SSO
-   Google profile pictures are stored in user metadata
-   OAuth states are cleaned up automatically after 10 minutes
-   The callback URL must be configured in your Google OAuth application settings
