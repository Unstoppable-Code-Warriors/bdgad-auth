"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRole, updateRole, GetRolesResult } from "@/lib/actions/roles"
import { useForm } from "@mantine/form"
import { useDialog } from "@/hooks/use-dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Row } from "@tanstack/react-table"

const RoleForm = ({
	action,
	row,
}: {
	action: "create" | "update"
	row?: Row<GetRolesResult["roles"][0]>
}) => {
	const dialog = useDialog()
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	// Get role data for update mode
	const roleData = row?.original
	const isUpdateMode = action === "update"

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			name: roleData?.name || "",
			description: roleData?.description || "",
		},

		validate: {
			name: (value) =>
				value.trim().length > 0 ? null : "Name is required",
			description: (value) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) return "Description is required";
				
				// Check for multiple spaces
				if (/\s{2,}/.test(trimmedValue)) {
					return "Description cannot contain multiple spaces between words";
				}
				
				// Check for allowed characters: letters (including Vietnamese), numbers, spaces, and special characters
				const validPattern = /^[a-zA-ZÀ-ỹ0-9\s\W]+$/u;
				if (!validPattern.test(trimmedValue)) {
					return "Description can only contain letters (including Vietnamese), numbers, single spaces, and special characters";
				}
				
				if (trimmedValue.length > 200) {
					return "Description must be 200 characters or less";
				}
				
				return null;
			},
		},
	})

	// Initialize form values when in update mode
	useEffect(() => {
		if (isUpdateMode && roleData) {
			form.setValues({
				name: roleData.name,
				description: roleData.description,
			})
		}
	}, [isUpdateMode, roleData])

	const handleSubmit = async (values: typeof form.values) => {
		setLoading(true)
		try {
			if (isUpdateMode && roleData) {
				// Update role
				await updateRole(roleData.id, {
					name: values.name,
					description: values.description,
				})
				toast.success("Role updated successfully")
			} else {
				// Create role
				await createRole({
					name: values.name,
					description: values.description,
				})
				toast.success("Role created successfully")
			}

			form.reset()
			dialog.closeAll()
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error(`Failed to ${isUpdateMode ? "update" : "create"} role`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						placeholder="Enter role name"
						{...form.getInputProps("name")}
						key={form.key("name")}
						disabled
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						placeholder="Enter role description"
						{...form.getInputProps("description")}
						key={form.key("description")}
						className="resize-none"
					/>
					{form.errors.description && (
						<div className="text-sm text-red-600">{form.errors.description}</div>
					)}
				</div>
				<Button type="submit" disabled={loading}>
					{loading
						? isUpdateMode
							? "Updating..."
							: "Creating..."
						: isUpdateMode
						? "Submit"
						: "Create Role"}
				</Button>
			</div>
		</form>
	)
}

export default RoleForm
