"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser } from "@/lib/actions/users"
import { useForm } from "@mantine/form"
import { useDialog } from "@/hooks/use-dialog"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const AddUserForm = () => {
	const dialog = useDialog()
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			name: "",
			email: "",
			password: "",
		},

		validate: {
			name: (value) =>
				value.trim().length > 0 ? null : "Name is required",
			email: (value) =>
				/^\S+@\S+$/.test(value.trim()) ? null : "Invalid email",
			password: (value) => {
				if (value.trim().length < 8) {
					return "Password must be at least 8 characters long"
				}
				return null
			},
		},
	})
	const handleCreateUser = async (values: typeof form.values) => {
		setLoading(true)
		try {
			const newUser = await createUser({
				email: values.email,
				password: values.password,
				name: values.name,
				metadata: {},
			})
			if (newUser) {
				form.reset()
				toast.success("User created successfully")
				dialog.closeAll()
				router.refresh()
			}
		} catch (error) {
			console.error(error)
			toast.error("Failed to create user")
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleCreateUser)}>
			<div className="grid gap-4 py-4">
				{Object.keys(form.errors).length > 0 && (
					<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
						{Object.values(form.errors)[0]}
					</div>
				)}
				<div className="grid gap-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						{...form.getInputProps("name")}
						key={form.key("name")}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						{...form.getInputProps("email")}
						key={form.key("email")}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						{...form.getInputProps("password")}
						key={form.key("password")}
					/>
				</div>
				<Button type="submit" disabled={loading}>
					{loading ? "Adding..." : "Add User"}
				</Button>
			</div>
		</form>
	)
}

export default AddUserForm
