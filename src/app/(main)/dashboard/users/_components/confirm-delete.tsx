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
			toast.success("Người dùng đã được xóa!")
		} catch (error) {
			toast.error("Lỗi khi xóa người dùng")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<p>Bạn có chắc chắn muốn xóa người dùng này?</p>
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={dialog.closeAll}
					disabled={isLoading}
				>
					Hủy bỏ
				</Button>
				<Button
					type="button"
					variant="destructive"
					onClick={handleDelete}
					disabled={isLoading}
				>
					{isLoading ? "Đang xóa..." : "Xóa"}
				</Button>
			</div>
		</div>
	)
}

export default ConfirmDeleteUser

