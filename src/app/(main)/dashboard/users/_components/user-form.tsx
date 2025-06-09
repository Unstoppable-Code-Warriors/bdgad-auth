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
			selectedRole: userData?.roles?.[0]?.id || (null as number | null),
		},

		validate: {
			name: (value) => {
				const trimmedValue = value.trim()
				if (trimmedValue.length === 0) {
					return "Name is required"
				}
				if (!/^[a-zA-Z0-9\s]+$/.test(trimmedValue)) {
					return "Name can only contain letters, numbers and spaces"
				}
				if (trimmedValue.length > 50) {
					return "Name must be 50 characters or less"
				}
				return null
			},
			email: (value) =>
				/^\S+@\S+$/.test(value.trim()) ? null : "Invalid email",
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
				await updateUser({
					id: userData.id,
					name: values.name,
					email: values.email,
					roleIds: values.selectedRole ? [values.selectedRole] : [],
				})
				toast.success("User updated successfully")
			} else {
				// Create user - password will be auto-generated and emailed
				await createUser({
					email: values.email,
					name: values.name,
					metadata: {},
					roleIds: values.selectedRole ? [values.selectedRole] : [],
				})
				toast.success(
					"User created successfully! Login credentials have been sent to their email address."
				)
			}

			form.reset()
			dialog.closeAll()
			router.refresh()
		} catch (error) {
			console.error(error)
			const errorMessage = `Failed to ${
				isUpdateMode ? "update" : "create"
			} user${
				isUpdateMode
					? "."
					: ", please check if the email address has been used before."
			}`
			toast.error(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="name">Name*</Label>
					<Input
						id="name"
						{...form.getInputProps("name")}
						key={form.key("name")}
						maxLength={50}
					/>
					{form.errors.name && (
						<div className="text-sm text-red-600">
							{form.errors.name}
						</div>
					)}
				</div>
				<div className="grid gap-2">
					<Label htmlFor="email">Email*</Label>
					<Input
						id="email"
						{...form.getInputProps("email")}
						key={form.key("email")}
						disabled={isUpdateMode}
					/>
					{form.errors.email && (
						<div className="text-sm text-red-600">
							{form.errors.email}
						</div>
					)}
				</div>
				<div className="grid gap-2">
					<Label>Role*</Label>
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
					{form.errors.selectedRole && (
						<div className="text-sm text-red-600">
							{form.errors.selectedRole}
						</div>
					)}
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
