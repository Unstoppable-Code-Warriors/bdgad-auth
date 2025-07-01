"use client"

import { Button } from "@/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const LoginSchema = z.object({
	email: z.string().email("Định dạng email không hợp lệ").min(1, "Email là bắt buộc"),
	password: z.string().min(1, "Mật khẩu là bắt buộc"),
})

type FormValues = z.infer<typeof LoginSchema>

export function LoginForm() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<FormValues>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	async function onSubmit(values: FormValues) {
		setIsLoading(true)
		try {
			const result = await signIn("credentials", {
				email: values.email,
				password: values.password,
				redirect: false,
			})

			if (result?.error) {
				form.setError("root", {
					message: "Email hoặc mật khẩu không hợp lệ",
				})
				return
			}

			router.push("/dashboard")
			router.refresh()
		} catch (error) {
			form.setError("root", {
				message: "Đã xảy ra lỗi. Vui lòng thử lại.",
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">Chào mừng trở lại</h1>
				<p className="text-sm text-muted-foreground">
					Nhập thông tin để truy cập tài khoản của bạn
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }: { field: any }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder="ten@example.com"
										type="email"
										disabled={isLoading}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }: { field: any }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										placeholder="Nhập mật khẩu của bạn"
										type="password"
										disabled={isLoading}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{form.formState.errors.root && (
						<div className="text-sm text-red-500">
							{form.formState.errors.root.message}
						</div>
					)}
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Đang đăng nhập...
							</>
						) : (
							"Đăng nhập"
						)}
					</Button>
				</form>
			</Form>
		</div>
	)
}
