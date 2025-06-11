import { deleteUser, GetUsersResult } from "@/lib/actions/users"
import { Row } from "@tanstack/react-table"
import { useDialog } from "@/hooks/use-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

const ConfirmDeleteUser = ({
	row,
}: {
	row: Row<GetUsersResult["users"][0]>
}) => {
	const dialog = useDialog()
	const queryClient = useQueryClient()
	const [isLoading, setIsLoading] = useState(false)

	const handleDelete = async () => {
		try {
			setIsLoading(true)
			await deleteUser({ id: row.original.id })
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
			<p>Are you sure you want to delete this user?</p>
			<div className="flex justify-end gap-2">
				<Button
					variant="outline"
					onClick={dialog.closeAll}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={isLoading}
				>
					Delete
				</Button>
			</div>
		</div>
	)
}

export default ConfirmDeleteUser
