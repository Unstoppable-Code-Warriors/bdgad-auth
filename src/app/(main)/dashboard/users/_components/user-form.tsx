"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createUser, updateUser, GetUsersResult } from "@/lib/actions/users"
import { useForm } from "@mantine/form"
import { useDialog } from "@/hooks/use-dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { GetRolesResult } from "@/lib/actions/roles"
import { X, Plus } from "lucide-react"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Row } from "@tanstack/react-table"

const UserForm = ({
	action,
	row,
	roles,
}: {
	action: "create" | "update"
	row?: Row<GetUsersResult["users"][0]>
	roles: GetRolesResult["roles"]
}) => {
	const dialog = useDialog()
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	// Get user data for update mode
	const userData = row?.original
	const isUpdateMode = action === "update"

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			name: userData?.name || "",
			email: userData?.email || "",
			password: "",
			selectedRole: userData?.roles?.[0]?.id || (null as number | null),
		},

		validate: {
			name: (value) =>
				value.trim().length > 0 ? null : "Name is required",
			email: (value) =>
				/^\S+@\S+$/.test(value.trim()) ? null : "Invalid email",
			password: (value) => {
				// Password is required for create, optional for update
				if (isUpdateMode) {
					// If password is provided in update mode, it must be at least 8 characters
					return value.trim().length === 0 || value.trim().length >= 8
						? null
						: "Password must be at least 8 characters long"
				} else {
					// Password is required for create mode
					return value.trim().length >= 8
						? null
						: "Password must be at least 8 characters long"
				}
			},
			selectedRole: (value) =>
				value !== null ? null : "Please select a role",
		},
	})

	// Initialize form values when in update mode
	useEffect(() => {
		if (isUpdateMode && userData) {
			form.setValues({
				name: userData.name,
				email: userData.email,
				password: "",
				selectedRole: userData.roles?.[0]?.id || null,
			})
		}
	}, [isUpdateMode, userData])

	const selectRole = (roleId: number) => {
		form.setFieldValue("selectedRole", roleId)
	}

	const clearRole = () => {
		form.setFieldValue("selectedRole", null)
	}

	const getSelectedRole = () => {
		const selectedRoleId = form.getValues().selectedRole
		return selectedRoleId
			? roles.find((role) => role.id === selectedRoleId)
			: null
	}

	const getAvailableRoles = () => {
		return roles
	}

	const handleSubmit = async (values: typeof form.values) => {
		setLoading(true)
		try {
			if (isUpdateMode && userData) {
				// Update user
				const updateData: any = {
					id: userData.id,
					name: values.name,
					email: values.email,
					roleIds: values.selectedRole ? [values.selectedRole] : [],
				}

				// Only include password if it's provided
				if (values.password.trim().length > 0) {
					updateData.password = values.password
				}

				await updateUser(updateData)
				toast.success("User updated successfully")
			} else {
				// Create user
				await createUser({
					email: values.email,
					password: values.password,
					name: values.name,
					metadata: {},
					roleIds: values.selectedRole ? [values.selectedRole] : [],
				})
				toast.success("User created successfully")
			}

			form.reset()
			dialog.closeAll()
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error(`Failed to ${isUpdateMode ? "update" : "create"} user`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
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
						disabled={isUpdateMode}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="password">
						Password{" "}
						{isUpdateMode && (
							<span className="text-sm text-muted-foreground">
								(leave empty to keep current)
							</span>
						)}
					</Label>
					<Input
						id="password"
						type="password"
						placeholder={
							isUpdateMode
								? "Enter new password (optional)"
								: "Enter password"
						}
						{...form.getInputProps("password")}
						key={form.key("password")}
					/>
				</div>
				<div className="grid gap-2">
					<Label>Role</Label>
					<div className="space-y-2">
						{/* Selected Role Display */}
						<div className="flex items-center justify-between p-3 border rounded-md bg-background min-h-[2.5rem]">
							{getSelectedRole() ? (
								<div className="flex items-center justify-between w-full">
									<div>
										<div className="font-medium">
											{getSelectedRole()?.name}
										</div>
										<div className="text-xs text-muted-foreground">
											{getSelectedRole()?.description}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={clearRole}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<span className="text-sm text-muted-foreground">
									No role selected
								</span>
							)}
						</div>

						{/* Select Role Dropdown */}
						{!getSelectedRole() && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-fit"
									>
										<Plus className="h-4 w-4 mr-1" />
										Select Role
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									className="w-64"
								>
									{getAvailableRoles().map((role) => (
										<DropdownMenuItem
											key={role.id}
											onClick={() => selectRole(role.id)}
											className="flex flex-col items-start p-3"
										>
											<div className="font-medium">
												{role.name}
											</div>
											<div className="text-xs text-muted-foreground">
												{role.description}
											</div>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
				<Button type="submit" disabled={loading}>
					{loading
						? isUpdateMode
							? "Updating..."
							: "Creating..."
						: isUpdateMode
						? "Update User"
						: "Create User"}
				</Button>
			</div>
		</form>
	)
}

export default UserForm
