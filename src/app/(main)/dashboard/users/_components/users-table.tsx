"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import { GetUsersResult } from "@/lib/actions/users";
import { userRole, userStatus } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
  Plus,
  Ban,
  Trash2,
  Eye,
  Pencil,
  Lock,
  FileUp,
  LockOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import ConfirmDeleteUser from "./confirm-delete";
import { getRoles, GetRolesResult } from "@/lib/actions/roles";
import UserForm from "./user-form";
import { Badge } from "@/components/ui/badge";
import ConfirmResetPassword from "./confirm-reset-password";
import UserDetailModal from "./user-detail-modal";
import ConfirmBan from "./confirm-ban";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/actions/users";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const columns: ColumnDef<GetUsersResult["users"][0]>[] = [
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => (
      <div className="max-w-[100px] truncate" title={row.original.name}>
        {row.original.name}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="max-w-[160px] truncate" title={row.original.email}>
        {row.original.email}
      </div>
    ),
  },

  {
    accessorKey: "roles",
    header: "Vai trò",
    cell: ({ row }) => (
      <div className="flex gap-1 max-w-[100px]">
        {row.original.roles.map((role) => (
          <Badge key={role.id}>{userRole[role.name]}</Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => (
      <div
        className="max-w-[100px] truncate"
        title={
          (row.original?.metadata as Record<string, string>)?.["phone"] || "-"
        }
      >
        {(row.original?.metadata as Record<string, string>)?.["phone"] || "-"}
      </div>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => (
      <div
        className="max-w-[100px] truncate"
        title={
          (row.original?.metadata as Record<string, string>)?.["address"] || "-"
        }
      >
        {(row.original?.metadata as Record<string, string>)?.["address"] || "-"}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return (
        <div>
          <div className="max-w-[10px]">
            {formatDate(new Date(row.original.createdAt))}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "default" : "destructive"}
        className={
          row.original.status === "active" ? "bg-green-600 text-white" : ""
        }
      >
        {userStatus[row.original.status]}
      </Badge>
    ),
  },
];

const UsersActions = ({
  roles,
  users,
}: {
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}) => {
  const dialog = useDialog();
  const router = useRouter();

  const openAddUserModal = () => {
    dialog.open({
      title: "Thêm tài khoản mới",
      children: <UserForm users={users} action="create" roles={roles} />,
      size: "md",
    });
  };

  const handleImportUsers = () => {
    router.push("/dashboard/users/import");
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={handleImportUsers}>
        <FileUp className="h-4 w-4 mr-2" />
        Nhập Excel
      </Button>
      <Button variant="outline" onClick={openAddUserModal}>
        <Plus className="h-4 w-4 mr-2" />
        Tạo tài khoản
      </Button>
    </div>
  );
};

const ActionsMenu = ({
  row,
  roles,
  users,
}: {
  row: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}) => {
  const dialog = useDialog();

  const openEditUserModal = () => {
    dialog.open({
      title: "Cập nhật tài khoản",
      children: (
        <UserForm action="update" row={row} roles={roles} users={users} />
      ),
    });
  };

  const openConfirmDeleteDialog = () => {
    dialog.open({
      title: "Xóa tài khoản",
      children: <ConfirmDeleteUser row={row} />,
    });
  };

  const openConfirmResetPasswordDialog = () => {
    dialog.open({
      title: "Đặt lại mật khẩu",
      children: (
        <ConfirmResetPassword row={row} closeModal={() => dialog.closeAll()} />
      ),
    });
  };

  const openUserDetailModal = () => {
    dialog.open({
      title: "Chi tiết tài khoản",
      children: <UserDetailModal row={row} />,
    });
  };

  const openBanUserDialog = () => {
    dialog.open({
      title:
        row.original.status === "active"
          ? "Tạm ngừng tài khoản"
          : "Bỏ tạm ngừng tài khoản",
      children: <ConfirmBan onClose={() => dialog.closeAll()} row={row} />,
      onClose: () => dialog.closeAll(),
    });
  };

  return (
    <>
      <DropdownMenuItem onClick={openUserDetailModal}>
        <div className="flex items-center gap-1">
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={row.original.status === "inactive"}
        onClick={openEditUserModal}
      >
        <div className="flex items-center gap-1">
          <Pencil className="mr-2 h-4 w-4" />
          Cập nhật
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={row.original.status === "inactive"}
        onClick={openConfirmResetPasswordDialog}
      >
        <div className="flex items-center gap-1">
          <Lock className="mr-2 h-4 w-4" />
          Đặt lại mật khẩu
        </div>
      </DropdownMenuItem>
      {row.original.status === "active" ? (
        <DropdownMenuItem onClick={openBanUserDialog}>
          <Ban className="mr-2 h-4 w-4" />
          Tạm ngừng tài khoản
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={openBanUserDialog}>
          <LockOpen className="mr-2 h-4 w-4" />
          Bỏ tạm ngừng tài khoản
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={openConfirmDeleteDialog}
        disabled={row.original.status === "active"}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Xóa tài khoản
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

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Add debounced search
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  // Query for paginated users (for table display)
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users", page, debouncedSearch, pageSize],
    queryFn: () =>
      getUsers({
        page,
        search: debouncedSearch,
        limit: pageSize,
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Query for all users (for actions)
  const { data: allUsersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () =>
      getUsers({
        page: 1,
        search: "",
        limit: 1000, // Large enough to get all users
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getRoles(),
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

  const error = usersError || rolesError;
  const isLoading = isLoadingUsers || isLoadingRoles;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi tải dữ liệu"}
        </AlertDescription>
      </Alert>
    );
  }

  const users = usersData?.users || [];
  const allUsers = allUsersData?.users || [];
  const total = usersData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
        onSearch={handleSearch}
        searchValue={search}
        actions={
          <UsersActions roles={rolesData?.roles || []} users={allUsers} />
        }
        rowActions={(row) => (
          <ActionsMenu
            row={row}
            roles={rolesData?.roles || []}
            users={allUsers}
          />
        )}
        requiredColumns={["name", "email", "roles"]}
        actionsColumnWidth={40}
      />
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
}

export default UsersTable;
