# Client-Side Authentication Usage

This document explains how to get user information from authentication on the client side in your Next.js application.

## Overview

The application now supports client-side access to user authentication data using NextAuth v5 with the following components:

-   `SessionProvider` - Wraps the app to provide session context
-   `useAuth` hook - Custom hook for accessing user data
-   `UserInfo` component - Reusable component for displaying user information
-   Updated sidebar with real user data

## Setup

### 1. SessionProvider

The `SessionProvider` is already configured in `src/app/providers.tsx` and wraps your entire application:

```tsx
import { SessionProvider } from "next-auth/react"

const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</SessionProvider>
	)
}
```

### 2. useAuth Hook

Use the custom `useAuth` hook to access user data in any client component:

```tsx
import { useAuth } from "@/hooks/use-auth"

function MyComponent() {
	const { user, isLoading, isAuthenticated, session } = useAuth()

	if (isLoading) return <div>Loading...</div>
	if (!isAuthenticated) return <div>Please log in</div>

	return (
		<div>
			<h1>Welcome, {user?.email}!</h1>
			<p>User ID: {user?.id}</p>
		</div>
	)
}
```

## Available Data

The `user` object contains:

-   `id` - User's unique identifier
-   `email` - User's email address
-   `name` - User's name (may be null)
-   `image` - User's profile image URL (may be null)

## Components

### UserInfo Component

A reusable component for displaying user information:

```tsx
import { UserInfo } from "@/components/user-info"

// Full card with avatar (default)
<UserInfo />

// Compact version without card wrapper
<UserInfo showCard={false} />

// Without avatar
<UserInfo showAvatar={false} />

// Custom styling
<UserInfo className="my-custom-class" />
```

### Updated Sidebar

The sidebar (`AppSidebar`) now automatically displays the authenticated user's information and includes a working logout button.

## Examples

### Basic Usage

```tsx
"use client"

import { useAuth } from "@/hooks/use-auth"

export default function Dashboard() {
	const { user, isLoading } = useAuth()

	if (isLoading) {
		return <div>Loading user data...</div>
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome back, {user?.email}!</p>
		</div>
	)
}
```

### With Loading States

```tsx
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function Profile() {
	const { user, isLoading, isAuthenticated } = useAuth()

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-4 w-[200px]" />
				<Skeleton className="h-4 w-[150px]" />
			</div>
		)
	}

	if (!isAuthenticated) {
		return <div>Please log in to view your profile</div>
	}

	return (
		<div>
			<h1>Profile</h1>
			<p>Email: {user?.email}</p>
			<p>ID: {user?.id}</p>
		</div>
	)
}
```

### Custom Logout

```tsx
"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
	const handleLogout = async () => {
		await signOut({ redirectTo: "/login" })
	}

	return <Button onClick={handleLogout}>Sign Out</Button>
}
```

## Pages

-   `/dashboard` - Main dashboard with user info
-   `/dashboard/profile` - Example profile page showing different usage patterns

## Notes

-   All components using authentication must be client components (`"use client"`)
-   The `useAuth` hook handles loading states automatically
-   User data is available immediately after authentication
-   The sidebar automatically updates with real user information
-   Logout functionality works from any client component

## Migration from Server-Side

If you were previously using server-side authentication:

**Before:**

```tsx
import { auth } from "@/lib/next-auth/auth"

export default async function Page() {
	const session = await auth()
	return <div>{session?.user.email}</div>
}
```

**After:**

```tsx
"use client"
import { useAuth } from "@/hooks/use-auth"

export default function Page() {
	const { user } = useAuth()
	return <div>{user?.email}</div>
}
```
