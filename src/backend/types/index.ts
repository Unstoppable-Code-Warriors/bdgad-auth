// Context Variables type for Hono
export type Variables = {
	user: {
		id: number
		email: string
		name: string
		roles: string[]
	}
}

// User information interface
export interface UserInfo {
	id: number
	email: string
	name: string
	status: string
	roles: string[]
	metadata: any
}

// JWT Payload interface
export interface JWTPayload {
	sub: string
	email: string
	name: string
	roles: string[]
	iat: number
	exp: number
}
