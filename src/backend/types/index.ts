// Role interface
export interface Role {
  id: number;
  name: string;
  code: string;
}

// Context Variables type for Hono
export type Variables = {
  user: {
    id: number;
    email: string;
    name: string;
    roles: Role[];
  };
};

// User information interface
export interface UserInfo {
  id: number;
  email: string;
  name: string;
  status: string;
  roles: Role[];
  metadata: any;
}

// JWT Payload interface
export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  roles: Role[];
  iat: number;
  exp: number;
}
