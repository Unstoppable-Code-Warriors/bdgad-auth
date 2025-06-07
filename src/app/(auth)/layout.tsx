import { auth } from "@/lib/next-auth/auth"
import { redirect } from "next/navigation"
import React from "react"

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
	const session = await auth()

	if (session?.user) {
		redirect("/dashboard")
	}
	return <>{children}</>
}

export default AuthLayout
