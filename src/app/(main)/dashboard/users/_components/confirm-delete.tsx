import { deleteUser, GetUsersResult } from "@/lib/actions/users"
import { Row } from "@tanstack/react-table"
import { useDialog } from "@/hooks/use-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "@mantine/form"

interface FormValues {
	reason: string;
}

const ConfirmDeleteUser = ({
	row,
}: {
	row: Row<GetUsersResult["users"][0]>
}) => {
	const dialog = useDialog()
	const queryClient = useQueryClient()
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<FormValues>({
		initialValues: {
			reason: "",
		},
		validate: {
			reason: (value) => {
				const trimmedValue = value.trim();
				if (!trimmedValue) {
					return "Reason is required";
				}
				if (trimmedValue.length > 200) {
					return "Reason must not exceed 200 characters";
				}
				// Check for multiple consecutive spaces
				if (/\s{2,}/.test(trimmedValue)) {
					return "Reason cannot contain multiple consecutive spaces";
				}
				// Check for allowed characters
				const validPattern = /^[a-zA-ZÀ-ỹ0-9\s.,]+$/u;
				if (!validPattern.test(trimmedValue)) {
					return "Reason can only contain letters (including Vietnamese), numbers, single spaces, periods (.), and commas (,)";
				}
				return null;
			},
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			setIsLoading(true)
			await deleteUser({ id: row.original.id, reason: values.reason.trim() })
			await queryClient.invalidateQueries({ queryKey: ["users"] })
			dialog.closeAll()
			toast.success("User deleted!")
		} catch (error) {
			toast.error("Failed to delete user")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<p>Are you sure you want to delete this user? This action cannot be undone.</p>
			<form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
				<div className="space-y-2">
					<div className="text-sm font-medium">
						Reason<span className="text-red-500">*</span>
					</div>
					<Textarea
						{...form.getInputProps("reason")}
						placeholder="Enter reason for deletion..."
						className="min-h-[100px] resize-none"
						disabled={isLoading}
					/>
					{form.errors.reason && (
						<p className="text-sm text-red-500">{form.errors.reason}</p>
					)}
				</div>
				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={dialog.closeAll}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="destructive"
						disabled={isLoading}
					>
						{isLoading ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</form>
		</div>
	)
}

export default ConfirmDeleteUser

