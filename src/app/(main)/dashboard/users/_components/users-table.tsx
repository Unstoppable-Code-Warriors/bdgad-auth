"use client"

import { Button } from "@/components/ui/button"
import { createHeader, DataTable } from "@/components/ui/datatable"
import { GetUsersResult } from "@/lib/actions/users"
import { FetchLimit } from "@/lib/constants"
import { ColumnDef, Row } from "@tanstack/react-table"
import { MoreHorizontal, Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDialog } from "@/hooks/use-dialog"
import AddUserForm from "./add-user-form"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ConfirmDeleteUser from "./confirm-delete"

const columns: ColumnDef<GetUsersResult["users"][0]>[] = [
	{
		accessorKey: "name",
		header: createHeader("Name"),
	},
	{
		accessorKey: "email",
		header: createHeader("Email"),
	},
]

const UsersActions = () => {
	const dialog = useDialog()

	const openAddUserModal = () => {
		dialog.open({
			title: "Add New User",
			children: <AddUserForm />,
			size: "md",
		})
	}

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" onClick={openAddUserModal}>
				<Plus className="h-4 w-4 mr-2" />
				Add New
			</Button>
		</div>
	)
}

const ActionsMenu = ({ row }: { row: Row<GetUsersResult["users"][0]> }) => {
	const dialog = useDialog()

	const openConfirmDeleteDialog = () => {
		dialog.open({
			title: "Delete User",
			children: <ConfirmDeleteUser row={row} />,
		})
	}
	return (
		<>
			<DropdownMenuItem>Edit</DropdownMenuItem>
			<DropdownMenuItem onClick={openConfirmDeleteDialog}>
				Delete
			</DropdownMenuItem>
		</>
	)
}

const UsersTable = ({ users, total, totalPages }: GetUsersResult) => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const page = searchParams.get("page")

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams)
		params.set("page", newPage.toString())
		router.push(`?${params.toString()}`)
	}

	return (
		<DataTable
			columns={columns}
			data={users}
			total={total}
			page={parseInt(page as string) || 1}
			pageSize={FetchLimit.USERS}
			onPageChange={handlePageChange}
			actions={<UsersActions />}
			rowActions={(row) => <ActionsMenu row={row} />}
		/>
	)
}

export default UsersTable
