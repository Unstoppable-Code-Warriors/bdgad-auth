"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import { GetDeletedUsersResult } from "@/lib/actions/users";
import { userRole, userStatus } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Eye, RotateCcw, Trash2 } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDeletedUsers } from "@/lib/actions/users";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import RecoveryDetailModal from "./recovery-detail-modal";
import ConfirmRecovery from "./confirm-recovery";
import ConfirmPermanentDelete from "./confirm-permanent-delete";

// Calculate expiry date function
const calculateExpiryDate = (deletedAt: string | Date) => {
  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiryDate;
};

const columns: ColumnDef<GetDeletedUsersResult["users"][0]>[] = [
  {
    accessorKey: "index",
    header: "STT",
    cell: ({ row, table }) => {
      const pagination = table.getState().pagination;
      const pageIndex = pagination?.pageIndex ?? 0;
      const pageSize = pagination?.pageSize ?? 10;
      return pageIndex * pageSize + row.index + 1;
    },
    size: 60,
  },
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => (
      <div className="max-w-[120px] truncate" title={row.original.name}>
        {row.original.name}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="w-[160px] truncate" title={row.original.email}>
        {row.original.email}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => {
      const metadata = row.original?.metadata as Record<string, any>;
      const phone = metadata?.phone || "-";

      return <div>{phone}</div>;
    },
  },
  {
    accessorKey: "roles",
    header: "Vai trò",
    cell: ({ row }) => {
      const roles = row.original.roles || [];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge key={role.id} variant="default">
              {userRole[role.name]}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "deletedAt",
    header: "Ngày xóa",
    cell: ({ row }) => {
      return (
        <div>{new Date(row.original.deletedAt!).toLocaleDateString()}</div>
      );
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Ngày hết hạn khôi phục",
    cell: ({ row }) => {
      const expiryDate = calculateExpiryDate(row.original.deletedAt!);

      return <div>{expiryDate.toLocaleDateString()}</div>;
    },
  },
];

const ActionsMenu = ({
  row,
}: {
  row: Row<GetDeletedUsersResult["users"][0]>;
}) => {
  const dialog = useDialog();

  const openRecoveryDetailModal = () => {
    dialog.open({
      title: "Chi tiết tài khoản đã xóa",
      children: <RecoveryDetailModal row={row} />,
    });
  };

  const openConfirmRecoveryDialog = () => {
    dialog.open({
      title: "Khôi phục tài khoản",
      children: (
        <ConfirmRecovery row={row} closeModal={() => dialog.closeAll()} />
      ),
    });
  };

  const openConfirmPermanentDeleteDialog = () => {
    dialog.open({
      title: "Xóa vĩnh viễn tài khoản",
      children: (
        <ConfirmPermanentDelete
          row={row}
          closeModal={() => dialog.closeAll()}
        />
      ),
    });
  };

  return (
    <>
      <DropdownMenuItem onClick={openRecoveryDetailModal}>
        <div className="flex items-center gap-1">
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openConfirmRecoveryDialog}>
        <div className="flex items-center gap-1">
          <RotateCcw className="mr-2 h-4 w-4" />
          Khôi phục tài khoản
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openConfirmPermanentDeleteDialog}>
        <div className="flex items-center gap-1">
          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
          <span className="text-red-500">Xóa vĩnh viễn</span>
        </div>
      </DropdownMenuItem>
    </>
  );
};

// Add debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function RecoveryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Add debounced search
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  // Query for paginated deleted users
  const {
    data: deletedUsersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["deletedUsers", page, debouncedSearch, pageSize],
    queryFn: () =>
      getDeletedUsers({
        page,
        search: debouncedSearch,
        limit: pageSize,
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  if (usersError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {usersError instanceof Error
            ? usersError.message
            : "Đã xảy ra lỗi khi tải dữ liệu"}
        </AlertDescription>
      </Alert>
    );
  }

  const users =
    deletedUsersData?.users.filter(
      (user) =>
        user.deletedAt &&
        !user.permanentlyDeletedAt &&
        user.status === "inactive"
    ) || [];
  const total = deletedUsersData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý tài khoản bị xóa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các tài khoản đã bị xóa và có thể khôi phục trong vòng 30
            ngày
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Tổng: {total} {total === 1 ? "tài khoản" : "tài khoản"}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchKey="email"
        searchPlaceholder="Tìm kiếm theo email..."
        enableFiltering={true}
        enableColumnVisibility={false}
        onSearch={handleSearch}
        searchValue={search}
        rowActions={(row) => <ActionsMenu row={row} />}
        requiredColumns={["name", "email", "deletedAt"]}
      />
      {isLoadingUsers && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
}

export default RecoveryTable;
