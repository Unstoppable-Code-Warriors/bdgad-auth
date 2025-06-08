"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticate } from "@/lib/actions/auth"
import { useFormStatus } from "react-dom"
import { useActionState } from "react"

function SubmitButton() {
	const { pending } = useFormStatus()

	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? "Signing in..." : "Login"}
		</Button>
	)
}

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [errorMessage, dispatch] = useActionState(authenticate, undefined)

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={dispatch}>
						<div className="flex flex-col gap-6">
							{errorMessage && (
								<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
									{errorMessage}
								</div>
							)}
							<div className="grid gap-3">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="m@example.com"
									required
								/>
							</div>
							<div className="grid gap-3">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
									{/* <a
										href="#"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										Forgot your password?
									</a> */}
								</div>
								<Input
									id="password"
									name="password"
									type="password"
									required
								/>
							</div>
							<div className="flex flex-col gap-3">
								<SubmitButton />
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
