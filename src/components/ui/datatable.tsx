"use client";

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
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { ReactNode, useMemo, useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
  rowActions?: (row: Row<TData>) => ReactNode;
  actions?: ReactNode;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  actionsColumnWidth?: number;
  onSearch?: (value: string) => void;
  searchValue?: string;
  requiredColumns?: string[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
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
  onPageSizeChange,
  actionsColumnWidth,
  onSearch,
  searchValue,
  requiredColumns = [],
}: DataTableProps<TData, TValue>) {
  // Determine if pagination is externally controlled
  const isExternalPagination =
    total !== undefined && page !== undefined && onPageChange !== undefined;

  // Calculate pagination values
  const externalCurrentPage = isExternalPagination ? page : 1;
  const totalPages = isExternalPagination
    ? Math.ceil(total / pageSize)
    : Math.ceil((data?.length || 0) / pageSize);

  // Validate required props
  if (!columns || columns.length === 0) {
    console.error("DataTable: columns prop is required and must not be empty");
    return (
      <div className="p-4 text-center text-red-500">
        Error: No columns defined
      </div>
    );
  }

  if (!Array.isArray(data)) {
    console.error("DataTable: data prop must be an array");
    return (
      <div className="p-4 text-center text-red-500">
        Error: Invalid data format
      </div>
    );
  }

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Add row actions column if provided
  const enhancedColumns = useMemo(() => {
    if (!rowActions) return columns;

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
              <DropdownMenuSeparator />
              {rowActions(row)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: actionsColumnWidth || 50,
    };

    return [...columns, actionsColumn];
  }, [columns, rowActions, actionsColumnWidth]);

  const table = useReactTable({
    data: data || [],
    columns: enhancedColumns,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel:
      enablePagination && !isExternalPagination
        ? getPaginationRowModel()
        : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: enableColumnVisibility
      ? setColumnVisibility
      : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters: enableFiltering ? columnFilters : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      rowSelection: enableRowSelection ? rowSelection : undefined,
      sorting,
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
    initialState: {
      columnVisibility: Object.fromEntries(
        columns.map((col) => {
          const columnId = (col as any).id || (col as any).accessorKey;
          return [
            columnId,
            requiredColumns.includes(columnId) ? true : undefined,
          ];
        })
      ),
    },
  });

  // Safety check for table initialization
  if (!table) {
    return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
  }

  // Helper function to safely get row selection state
  const getRowSelectionState = (row: Row<TData>) => {
    try {
      return enableRowSelection && row.getIsSelected?.()
        ? "selected"
        : undefined;
    } catch {
      return undefined;
    }
  };

  // Helper function to safely get selection count
  const getSelectionInfo = () => {
    if (!enableRowSelection) return null;

    try {
      const selectedCount = table.getFilteredSelectedRowModel().rows.length;
      const totalCount = table.getFilteredRowModel().rows.length;
      return { selectedCount, totalCount };
    } catch {
      return null;
    }
  };

  const selectionInfo = getSelectionInfo();

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (isExternalPagination && onPageChange) {
      onPageChange(newPage);
    } else if (!isExternalPagination) {
      table.setPageIndex(newPage - 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else if (!isExternalPagination) {
      table.setPageSize(newSize);
    }
  };

  // Get current page for display
  const displayPage = isExternalPagination
    ? externalCurrentPage
    : (table.getState().pagination?.pageIndex ?? 0) + 1;

  // Get total pages for display
  const displayTotalPages = isExternalPagination
    ? totalPages
    : table.getPageCount() || 1;

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          {searchKey && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  searchValue ??
                  (table.getColumn(searchKey)?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) => {
                  if (onSearch) {
                    onSearch(event.target.value);
                  } else {
                    const column = table.getColumn(searchKey);
                    if (column) {
                      column.setFilterValue(event.target.value);
                    }
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
            <div className="flex items-center space-x-2">{actions}</div>
          )}

          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Cột <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.getCanHide() &&
                      !requiredColumns.includes(column.id)
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
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
                        <div className="flex items-center space-x-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
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
                    onRowClick && "cursor-pointer hover:bg-muted/50"
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
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && displayTotalPages > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-8 rounded border border-input bg-background px-2 text-sm"
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
          </div>
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
  );
}

// Helper function to create simple column header
export function createHeader(title: string) {
  return () => <span className="font-semibold">{title}</span>;
}

// Export the SSR-safe wrapper as the main component
export { Datatable } from "./datatable-wrapper";
