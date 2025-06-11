"use client"

import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	Row,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { ReactNode, useMemo, useState } from "react"

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	searchKey?: string
	searchPlaceholder?: string
	enableSorting?: boolean
	enableFiltering?: boolean
	enableColumnVisibility?: boolean
	enablePagination?: boolean
	enableRowSelection?: boolean
	pageSize?: number
	className?: string
	onRowClick?: (row: Row<TData>) => void
	rowActions?: (row: Row<TData>) => ReactNode
	actions?: ReactNode
	total?: number
	page?: number
	onPageChange?: (page: number) => void
	actionsColumnWidth?: number
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "Search...",
	enableSorting = true,
	enableFiltering = true,
	enableColumnVisibility = true,
	enablePagination = true,
	enableRowSelection = false,
	pageSize = 10,
	className,
	onRowClick,
	rowActions,
	actions,
	total,
	page,
	onPageChange,
	actionsColumnWidth,
}: DataTableProps<TData, TValue>) {
	// Determine if pagination is externally controlled
	const isExternalPagination =
		total !== undefined && page !== undefined && onPageChange !== undefined

	// Calculate pagination values
	const externalCurrentPage = isExternalPagination ? page : 1
	const totalPages = isExternalPagination
		? Math.ceil(total / pageSize)
		: Math.ceil((data?.length || 0) / pageSize)

	// Validate required props
	if (!columns || columns.length === 0) {
		console.error(
			"DataTable: columns prop is required and must not be empty"
		)
		return (
			<div className="p-4 text-center text-red-500">
				Error: No columns defined
			</div>
		)
	}

	if (!Array.isArray(data)) {
		console.error("DataTable: data prop must be an array")
		return (
			<div className="p-4 text-center text-red-500">
				Error: Invalid data format
			</div>
		)
	}

	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		{}
	)
	const [rowSelection, setRowSelection] = useState({})

	// Add row actions column if provided
	const enhancedColumns = useMemo(() => {
		if (!rowActions) return columns

		const actionsColumn: ColumnDef<TData, TValue> = {
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => (
				<div className="w-1">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{rowActions(row)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
			size: actionsColumnWidth || 50,
		}

		return [...columns, actionsColumn]
	}, [columns, rowActions, actionsColumnWidth])

	const table = useReactTable({
		data: data || [],
		columns: enhancedColumns,
		onSortingChange: enableSorting ? setSorting : undefined,
		onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel:
			enablePagination && !isExternalPagination
				? getPaginationRowModel()
				: undefined,
		getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
		getFilteredRowModel: enableFiltering
			? getFilteredRowModel()
			: undefined,
		onColumnVisibilityChange: enableColumnVisibility
			? setColumnVisibility
			: undefined,
		onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
		state: {
			sorting: enableSorting ? sorting : undefined,
			columnFilters: enableFiltering ? columnFilters : undefined,
			columnVisibility: enableColumnVisibility
				? columnVisibility
				: undefined,
			rowSelection: enableRowSelection ? rowSelection : undefined,
			pagination:
				enablePagination && !isExternalPagination
					? {
							pageIndex: 0,
							pageSize: pageSize,
					  }
					: undefined,
		},
		manualPagination: isExternalPagination,
		pageCount: isExternalPagination ? totalPages : -1,
		initialState:
			enablePagination && !isExternalPagination
				? {
						pagination: {
							pageSize: Math.max(1, pageSize || 10),
							pageIndex: 0,
						},
				  }
				: undefined,
	})

	// Safety check for table initialization
	if (!table) {
		return <div className="p-4 text-center">Loading table...</div>
	}

	// Helper function to safely get row selection state
	const getRowSelectionState = (row: Row<TData>) => {
		try {
			return enableRowSelection && row.getIsSelected?.()
				? "selected"
				: undefined
		} catch {
			return undefined
		}
	}

	// Helper function to safely get selection count
	const getSelectionInfo = () => {
		if (!enableRowSelection) return null

		try {
			const selectedCount =
				table.getFilteredSelectedRowModel().rows.length
			const totalCount = table.getFilteredRowModel().rows.length
			return { selectedCount, totalCount }
		} catch {
			return null
		}
	}

	const selectionInfo = getSelectionInfo()

	// Pagination handlers
	const handlePageChange = (newPage: number) => {
		if (isExternalPagination && onPageChange) {
			onPageChange(newPage)
		} else if (!isExternalPagination) {
			table.setPageIndex(newPage - 1)
		}
	}

	// Get current page for display
	const displayPage = isExternalPagination
		? externalCurrentPage
		: (table.getState().pagination?.pageIndex ?? 0) + 1

	// Get total pages for display
	const displayTotalPages = isExternalPagination
		? totalPages
		: table.getPageCount() || 1

	return (
		<div className={cn("w-full", className)}>
			{/* Toolbar */}
			<div className="flex items-center justify-between py-4">
				<div className="flex items-center space-x-2">
					{/* Search Input */}
					{enableFiltering && searchKey && (
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={
									(table
										.getColumn(searchKey)
										?.getFilterValue() as string) ?? ""
								}
								onChange={(event) => {
									const column = table.getColumn(searchKey)
									if (column) {
										column.setFilterValue(
											event.target.value
										)
									}
								}}
								className="pl-8 max-w-sm"
							/>
						</div>
					)}
				</div>

				<div className="flex items-center space-x-2">
					{/* Custom Actions */}
					{actions && (
						<div className="flex items-center space-x-2">
							{actions}
						</div>
					)}

					{/* Column Visibility Toggle */}
					{enableColumnVisibility && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="ml-auto">
									Columns{" "}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => {
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) =>
													column.toggleVisibility(
														!!value
													)
												}
											>
												{column.id}
											</DropdownMenuCheckboxItem>
										)
									})}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<div
													className={cn(
														"flex items-center space-x-2",
														header.column.getCanSort() &&
															"cursor-pointer select-none"
													)}
													onClick={
														// Only add click handler if header doesn't have custom sorting
														typeof header.column
															.columnDef
															.header === "string"
															? header.column.getToggleSortingHandler()
															: undefined
													}
												>
													{flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
													{/* Only show sort icon for string headers, custom headers handle their own sorting */}
													{enableSorting &&
														header.column.getCanSort() &&
														typeof header.column
															.columnDef
															.header ===
															"string" && (
															<ArrowUpDown className="ml-2 h-4 w-4" />
														)}
												</div>
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={getRowSelectionState(row)}
									className={cn(
										onRowClick &&
											"cursor-pointer hover:bg-muted/50"
									)}
									onClick={() => onRowClick?.(row)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={enhancedColumns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{enablePagination && displayTotalPages > 0 && (
				<div className="flex items-center justify-end space-x-2 py-4">
					{/* <div className="flex-1 text-sm text-muted-foreground">
						{selectionInfo && (
							<>
								{selectionInfo.selectedCount} of{" "}
								{selectionInfo.totalCount} row(s) selected.
							</>
						)}
					</div> */}
					<div className="flex items-center space-x-2">
						<Pagination
							total={displayTotalPages}
							value={displayPage}
							onChange={handlePageChange}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

// Helper function to create sortable column header
export function createSortableHeader(title: string) {
	return ({ column }: { column: any }) => {
		if (!column) {
			return <span>{title}</span>
		}

		const sortDirection = column.getIsSorted()

		return (
			<Button
				variant="ghost"
				onClick={() => {
					if (column.toggleSorting) {
						column.toggleSorting(sortDirection === "asc")
					}
				}}
				className="h-auto p-0 font-semibold hover:bg-transparent"
			>
				{title}
				{sortDirection === "asc" ? (
					<ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
				) : sortDirection === "desc" ? (
					<ArrowUpDown className="ml-2 h-4 w-4" />
				) : (
					<ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
				)}
			</Button>
		)
	}
}

// Helper function to create simple column header
export function createHeader(title: string) {
	return () => <span className="font-semibold">{title}</span>
}

// Export the SSR-safe wrapper as the main component
export { Datatable } from "./datatable-wrapper"
