import { deleteRole, GetRolesResult } from "@/lib/actions/roles"
import { Row } from "@tanstack/react-table"
import { useDialog } from "@/hooks/use-dialog"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"

const ConfirmDeleteRole = ({
	row,
}: {
	row: Row<GetRolesResult["roles"][0]>
}) => {
	const dialog = useDialog()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const handleDelete = async () => {
		try {
			setIsLoading(true)
			await deleteRole(row.original.id)
			router.refresh()
			dialog.closeAll()
			toast.success("Xóa vai trò thành công!")
		} catch (error) {
			toast.error("Không thể xóa vai trò")
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className="flex flex-col gap-4">
			<p>Bạn có chắc chắn muốn xóa vai trò này?</p>
			<div className="flex justify-end gap-2">
				<Button
					variant="outline"
					onClick={dialog.closeAll}
					disabled={isLoading}
				>
					Hủy
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={isLoading}
				>
					Xóa
				</Button>
			</div>
		</div>
	)
}

export default ConfirmDeleteRole
