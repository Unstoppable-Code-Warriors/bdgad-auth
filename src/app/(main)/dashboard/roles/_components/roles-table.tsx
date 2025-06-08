"use client"

import { Button } from "@/components/ui/button"
import { createHeader, DataTable } from "@/components/ui/datatable"
import { GetRolesResult } from "@/lib/actions/roles"
import { FetchLimit } from "@/lib/constants"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDialog } from "@/hooks/use-dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import RoleForm from "./role-form"
import ConfirmDeleteRole from "./confirm-delete"

const columns: ColumnDef<GetRolesResult["roles"][0]>[] = [
	{
		accessorKey: "name",
		header: createHeader("Name"),
	},
	{
		accessorKey: "description",
		header: createHeader("Description"),
	},
]

const RolesActions = () => {
	const dialog = useDialog()

	const openAddRoleModal = () => {
		dialog.open({
			title: "Add New Role",
			children: <RoleForm action="create" />,
			size: "md",
		})
	}

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" onClick={openAddRoleModal}>
				<Plus className="h-4 w-4 mr-2" />
				Add New
			</Button>
		</div>
	)
}

const ActionsMenu = ({ row }: { row: Row<GetRolesResult["roles"][0]> }) => {
	const dialog = useDialog()

	const openEditRoleModal = () => {
		dialog.open({
			title: "Edit Role",
			children: <RoleForm action="update" row={row} />,
		})
	}

	const openConfirmDeleteDialog = () => {
		dialog.open({
			title: "Delete Role",
			children: <ConfirmDeleteRole row={row} />,
		})
	}
	return (
		<>
			<DropdownMenuItem onClick={openEditRoleModal}>
				Edit
			</DropdownMenuItem>
			<DropdownMenuItem onClick={openConfirmDeleteDialog}>
				Delete
			</DropdownMenuItem>
		</>
	)
}

const RolesTable = ({
	roles,
	total,
	totalPages,
}: GetRolesResult & { totalPages: number }) => {
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
			data={roles}
			total={total}
			page={parseInt(page as string) || 1}
			pageSize={FetchLimit.ROLES}
			onPageChange={handlePageChange}
			// actions={<RolesActions />}
			rowActions={(row) => <ActionsMenu row={row} />}
		/>
	)
}

export default RolesTable
