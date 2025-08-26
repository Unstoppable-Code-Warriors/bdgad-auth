"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRole, updateRole, GetRolesResult } from "@/lib/actions/roles"
import { userRole } from "@/lib/constants"
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
			name: roleData?.name ? (userRole[roleData.name] || roleData.name) : "",
			description: roleData?.description || "",
		},

		validate: {
			name: (value) =>
				value.trim().length > 0 ? null : "Tên là bắt buộc",
			description: (value) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) return "Mô tả là bắt buộc";
				
				// Check for multiple spaces
				if (/\s{2,}/.test(trimmedValue)) {
					return "Mô tả không được chứa nhiều khoảng trắng liên tiếp";
				}
				
				if (trimmedValue.length > 200) {
					return "Mô tả không được vượt quá 200 ký tự";
				}
				
				return null;
			},
		},
	})

	// Initialize form values when in update mode
	useEffect(() => {
		if (isUpdateMode && roleData) {
			form.setValues({
				name: userRole[roleData.name] || roleData.name,
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
					description: values.description,
				})
				toast.success("Cập nhật vai trò thành công")
			} else {
				// Create role
				await createRole({
					name: values.name,
					description: values.description,
				})
				toast.success("Tạo vai trò thành công")
			}

			form.reset()
			dialog.closeAll()
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error(`Không thể ${isUpdateMode ? "cập nhật" : "tạo"} vai trò`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="name">Tên</Label>
					<Input
						id="name"
						placeholder="Nhập tên vai trò"
						{...form.getInputProps("name")}
						key={form.key("name")}
						disabled
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="description">Mô tả</Label>
					<Textarea
						id="description"
						placeholder="Nhập mô tả vai trò"
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
							? "Đang cập nhật..."
							: "Đang tạo..."
						: isUpdateMode
						? "Gửi"
						: "Tạo vai trò"}
				</Button>
			</div>
		</form>
	)
}

export default RoleForm
