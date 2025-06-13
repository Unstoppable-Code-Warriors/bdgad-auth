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
			description: (value) =>
				value.trim().length > 0 ? null : "Description is required",
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
				{Object.keys(form.errors).length > 0 && (
					<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
						{Object.values(form.errors)[0]}
					</div>
				)}
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
				</div>
				<Button type="submit" disabled={loading}>
					{loading
						? isUpdateMode
							? "Updating..."
							: "Creating..."
						: isUpdateMode
						? "Update Role"
						: "Create Role"}
				</Button>
			</div>
		</form>
	)
}

export default RoleForm
