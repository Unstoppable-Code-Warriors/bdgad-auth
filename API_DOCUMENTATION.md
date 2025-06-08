# BDGAD Auth Service API Documentation

## Overview

The BDGAD Auth Service provides JWT-based authentication for microservices. It includes user management, role-based access control, and secure token generation/verification.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

#### Request Body

```json
{
	"email": "user@example.com",
	"password": "password123"
}
```

#### Response

**Success (200)**

```json
{
	"success": true,
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": 1,
		"email": "user@example.com",
		"name": "John Doe",
		"roles": ["user", "admin"],
		"status": "active"
	}
}
```

**Error (401)**

```json
{
	"error": "Invalid credentials"
}
```

**Error (400)**

```json
{
	"error": "Email and password are required"
}
```

### 2. Get User Information

**GET** `/auth/me`

Get current user information from JWT token.

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Response

**Success (200)**

```json
{
	"success": true,
	"user": {
		"id": 1,
		"email": "user@example.com",
		"name": "John Doe",
		"status": "active",
		"roles": ["user", "admin"],
		"metadata": {}
	}
}
```

**Error (401)**

```json
{
	"error": "Authorization token required"
}
```

### 3. Verify Token

**POST** `/auth/verify`

Verify if a JWT token is valid and get payload information.

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Response

**Success (200)**

```json
{
	"success": true,
	"valid": true,
	"payload": {
		"sub": "1",
		"email": "user@example.com",
		"name": "John Doe",
		"roles": ["user", "admin"],
		"iat": 1640995200,
		"exp": 1641600000
	}
}
```

**Error (401)**

```json
{
	"success": false,
	"valid": false,
	"error": "Invalid or expired token"
}
```

## Protected Routes Examples

These routes demonstrate how other services can implement authentication using the JWT middleware.

### 1. Profile (Authentication Required)

**GET** `/protected/profile`

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Response

```json
{
	"message": "This is a protected route",
	"user": {
		"id": 1,
		"email": "user@example.com",
		"name": "John Doe",
		"roles": ["user", "admin"]
	}
}
```

### 2. Admin Only Route

**GET** `/protected/admin-only`

Requires `admin` role.

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Response

**Success (200)**

```json
{
	"message": "This route is only accessible by admins",
	"user": {
		"id": 1,
		"email": "admin@example.com",
		"name": "Admin User",
		"roles": ["admin"]
	}
}
```

**Error (403)**

```json
{
	"error": "Access denied. Required role: admin"
}
```

### 3. Admin or Moderator Route

**GET** `/protected/admin-or-moderator`

Requires either `admin` or `moderator` role.

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Response

**Success (200)**

```json
{
	"message": "This route is accessible by admins or moderators",
	"user": {
		"id": 1,
		"email": "user@example.com",
		"name": "User Name",
		"roles": ["moderator"]
	}
}
```

**Error (403)**

```json
{
	"error": "Access denied. Required roles: admin, moderator"
}
```

## JWT Token Structure

The JWT token contains the following payload:

```json
{
	"sub": "1", // User ID
	"email": "user@example.com",
	"name": "John Doe",
	"roles": ["user", "admin"],
	"iat": 1640995200, // Issued at timestamp
	"exp": 1641600000 // Expiration timestamp (7 days)
}
```

## Error Codes

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 200         | Success                                 |
| 400         | Bad Request - Invalid input             |
| 401         | Unauthorized - Invalid or missing token |
| 403         | Forbidden - Insufficient permissions    |
| 404         | Not Found - User not found              |
| 500         | Internal Server Error                   |

## Using the Authentication in Other Services

### 1. Install Dependencies

```bash
npm install hono bcryptjs
```

### 2. Import Middleware

```typescript
import {
	jwtAuth,
	requireRole,
	requireAnyRole,
} from "./middleware/jwtMiddleware"
```

### 3. Protect Routes

```typescript
import { Hono } from "hono"
import { jwtAuth, requireRole } from "./middleware/jwtMiddleware"

const app = new Hono()

// Require authentication
app.get("/protected", jwtAuth, (c) => {
	const user = c.get("user")
	return c.json({ message: "Protected route", user })
})

// Require specific role
app.get("/admin", jwtAuth, requireRole("admin"), (c) => {
	return c.json({ message: "Admin only route" })
})

// Require any of multiple roles
app.get("/staff", jwtAuth, requireAnyRole(["admin", "moderator"]), (c) => {
	return c.json({ message: "Staff only route" })
})
```

### 4. Environment Variables

Make sure to set the same JWT secret in all services:

```env
JWT_SECRET=your-super-secret-jwt-key
```

## Client Usage Examples

### JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch("/api/v1/auth/login", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		email: "user@example.com",
		password: "password123",
	}),
})

const { token } = await loginResponse.json()

// Use token for authenticated requests
const userResponse = await fetch("/api/v1/auth/me", {
	headers: {
		Authorization: `Bearer ${token}`,
	},
})

const userData = await userResponse.json()
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user info
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify token
curl -X POST http://localhost:3000/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret key for JWT signing
2. **Token Expiration**: Tokens expire after 7 days by default
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Store tokens securely on the client side
5. **Role Validation**: Always validate user roles on the server side

## Database Schema

The authentication service uses the following database tables:

-   `users`: User accounts with email, password, name, status, and metadata
-   `roles`: Available roles in the system
-   `user_roles`: Many-to-many relationship between users and roles
-   `system_admins`: System administrator accounts

## Rate Limiting

Consider implementing rate limiting for authentication endpoints to prevent brute force attacks:

```typescript
import { rateLimiter } from "hono-rate-limiter"

app.use(
	"/auth/login",
	rateLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		limit: 5, // Limit each IP to 5 requests per window
		keyGenerator: (c) => c.req.header("x-forwarded-for") || "unknown",
	})
)
```
