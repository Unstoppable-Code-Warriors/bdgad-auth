"use server"

import { signIn, signOut } from "@/lib/next-auth/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		const email = formData.get("email") as string
		const password = formData.get("password") as string

		await signIn("credentials", {
			email,
			password,
			redirectTo: "/dashboard",
		})
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "Invalid credentials."
				default:
					return "Something went wrong."
			}
		}
		throw error
	}
}

export async function signOutAction() {
	await signOut({ redirectTo: "/login" })
}
