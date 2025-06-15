"use client"

import { Button } from "@/components/ui/button"
import { createHeader, DataTable } from "@/components/ui/datatable"
import { GetRolesResult } from "@/lib/actions/roles"
import { FetchLimit } from "@/lib/constants"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useDialog } from "@/hooks/use-dialog"
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import RoleForm from "./role-form"
import { Label } from "@/components/ui/label"

const columns: ColumnDef<GetRolesResult["roles"][0]>[] = [
	{
		accessorKey: "name",
		header: createHeader("Name"),
	},
	{
		accessorKey: "description",
		header: createHeader("Description"),
		cell: ({ row }) => (
			<div className="max-w-[600px] truncate" title={row.original.description}>
				{row.original.description}
			</div>
		),
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

	const openViewDetailModal = () => {
		dialog.open({
			title: "Role Details",
			children: (
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label>Name</Label>
						<div className="text-sm">{row.original.name}</div>
					</div>
					<div className="grid gap-2">
						<Label>Description</Label>
						<div className="text-sm max-h-[300px] overflow-y-auto">
							{row.original.description}
						</div>
					</div>
				</div>
			),
		})
	}

	return (
		<DropdownMenu>
				<DropdownMenuItem onClick={openViewDetailModal}>
					View Detail
				</DropdownMenuItem>
				<DropdownMenuItem onClick={openEditRoleModal}>
					Edit Description
				</DropdownMenuItem>
		</DropdownMenu>
	)
}

const RolesTable = ({
	roles,
	total,
}: GetRolesResult & { totalPages: number }) => {

	return (
		<DataTable
			columns={columns}
			data={roles}
			total={total}
			pageSize={FetchLimit.ROLES}
			requiredColumns={["name"]}
			// actions={<RolesActions />}
			rowActions={(row) => <ActionsMenu row={row} />}
		/>
	)
}

export default RolesTable
