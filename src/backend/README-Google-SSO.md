# Google SSO Implementation

This document describes the Google Single Sign-On (SSO) implementation for the BDGAD Auth Service.

## Overview

The auth service supports Google OAuth 2.0 authentication with a proper flow that redirects users back to your client application after successful authentication.

**Flow Overview:**

1. Client app sends POST request to auth service with their callback URL
2. Auth service stores client callback URL in state and returns Google OAuth URL
3. Client app redirects user to Google OAuth URL
4. User authenticates with Google
5. **Google redirects to auth service callback** (not client app)
6. Auth service processes authentication and redirects back to client app with token

**Important**: The `redirect_uri` in Google OAuth always points to the auth service callback endpoint (`/api/v1/auth/google/callback`). The client app's redirect URL is stored in the OAuth state parameter for later use.

## Prerequisites

Make sure you have the following environment variables configured:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Google OAuth App Configuration:**

-   **Authorized redirect URI**: `https://yourdomain.com/api/v1/auth/google/callback`
-   For development: `http://localhost:3000/api/v1/auth/google/callback`

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
		"oauthUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=AUTH_SERVICE_CALLBACK&state=...",
		"state": "generated_state_token"
	},
	"message": "Google OAuth URL generated successfully"
}
```

**Note**: The `redirect_uri` in the OAuth URL always points to the auth service callback, not your client app.

### 2. Google OAuth Process

1. **Client redirects user** to the `oauthUrl`
2. **User authenticates** with Google
3. **Google redirects** to `https://yourdomain.com/api/v1/auth/google/callback?code=...&state=...`
4. **Auth service processes** the callback and retrieves the original client callback URL from state
5. **Auth service redirects** to client app with result

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

## State Management

The OAuth state parameter serves two purposes:

1. **Security**: Prevents CSRF attacks
2. **Client Callback Storage**: Stores the client app's callback URL

**State Flow**:

```
1. Client sends: redirectAfterLogin = "https://myapp.com/callback"
2. Auth service generates state and stores: state -> "https://myapp.com/callback"
3. Google OAuth uses: redirect_uri = "https://authservice.com/api/v1/auth/google/callback"
4. After auth, auth service retrieves client URL from state and redirects to "https://myapp.com/callback?token=..."
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
```

## Google OAuth Configuration

**Critical**: Your Google OAuth application must be configured with the correct redirect URI:

**For Development**:

```
http://localhost:3000/api/v1/auth/google/callback
```

**For Production**:

```
https://yourdomain.com/api/v1/auth/google/callback
```

**DO NOT** configure your client app URLs (like `https://yourapp.com/auth/callback`) in Google OAuth settings. These are handled internally by the auth service.

## Security Features

1. **State Parameter**: Prevents CSRF attacks using cryptographically secure random state
2. **Proper Redirect URI**: Google OAuth always redirects to the auth service, preventing redirect hijacking
3. **URL Validation**: Validates client redirect URLs to prevent open redirects
4. **Token Expiration**: OAuth states expire after 10 minutes
5. **User Verification**: Only allows login for existing, active users
6. **JWT Security**: Creates secure JWT tokens with 7-day expiration

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

## Testing with GET (Development Only)

For testing purposes, you can use a GET request:

**Endpoint**: `GET /api/v1/auth/google?redirect_url=https://yourapp.com/callback`

This will directly redirect to Google OAuth. **Not recommended for production.**

## Production Considerations

1. **State Storage**: The current implementation uses in-memory storage for OAuth states. For production with multiple instances, use Redis or a database.

2. **HTTPS Required**: Google OAuth requires HTTPS in production.

3. **Domain Whitelist**: Consider implementing a whitelist of allowed redirect domains for additional security.

4. **Rate Limiting**: Implement rate limiting on OAuth endpoints to prevent abuse.

5. **Google OAuth Quotas**: Monitor your Google OAuth API usage and quotas.

## Troubleshooting

**Common Issues**:

1. **Redirect URI Mismatch**: Ensure Google OAuth app is configured with `https://yourdomain.com/api/v1/auth/google/callback`

2. **Invalid State**: OAuth states expire after 10 minutes. If users take too long, they'll get an invalid state error.

3. **User Not Found**: Users must exist in the database with their Google email address.

4. **CORS Issues**: Ensure your auth service has proper CORS configuration for client app domains.

## Notes

-   The `redirect_uri` parameter in Google OAuth **always** points to the auth service callback
-   Client app callback URLs are stored in the OAuth state parameter
-   Users must already exist in the database with their Google email
-   The system does not automatically create new users via Google SSO
-   Google profile pictures are stored in user metadata
-   OAuth states are cleaned up automatically after 10 minutes
