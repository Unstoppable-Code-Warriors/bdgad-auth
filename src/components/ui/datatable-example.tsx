"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
	Datatable,
	createSortableHeader,
	createHeader,
} from "@/components/ui/datatable"

// Sample data type
type User = {
	id: string
	name: string
	email: string
	status: "active" | "inactive"
	role: string
}

// Sample data
const sampleData: User[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john@example.com",
		status: "active",
		role: "Admin",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane@example.com",
		status: "inactive",
		role: "User",
	},
	{
		id: "3",
		name: "Bob Johnson",
		email: "bob@example.com",
		status: "active",
		role: "Editor",
	},
]

// Column definitions
const columns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: createSortableHeader("Name"),
	},
	{
		accessorKey: "email",
		header: createSortableHeader("Email"),
	},
	{
		accessorKey: "status",
		header: createHeader("Status"),
		cell: ({ row }) => {
			const status = row.getValue("status") as string
			return (
				<div
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						status === "active"
							? "bg-green-100 text-green-800"
							: "bg-red-100 text-red-800"
					}`}
				>
					{status}
				</div>
			)
		},
	},
	{
		accessorKey: "role",
		header: createSortableHeader("Role"),
	},
]

export function DataTableExample() {
	const handleRowClick = (row: any) => {
		console.log("Row clicked:", row.original)
	}

	const rowActions = (row: any) => (
		<>
			<DropdownMenuItem onClick={() => console.log("Edit", row.original)}>
				Edit user
			</DropdownMenuItem>
			<DropdownMenuItem
				onClick={() => console.log("Delete", row.original)}
			>
				Delete user
			</DropdownMenuItem>
		</>
	)

	return (
		<>
			<Datatable
				columns={columns}
				data={sampleData}
				searchKey="name"
				searchPlaceholder="Search users..."
				enableRowSelection={true}
				onRowClick={handleRowClick}
				rowActions={rowActions}
			/>
		</>
	)
}
