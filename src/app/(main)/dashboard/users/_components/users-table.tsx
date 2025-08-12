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
  Search,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const columns: ColumnDef<GetUsersResult["users"][0]>[] = [
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
      <div className="max-w-[180px] truncate" title={row.original.email}>
        {row.original.email}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => {
      const metadata = row.original?.metadata as Record<string, any>;
      const phones = metadata?.phones as string[];
      const phone1 = phones?.[0] || "-";

      return (
        <div className="max-w-[120px] truncate" title={phone1}>
          {phone1}
        </div>
      );
    },
  },
  {
    accessorKey: "roles",
    header: "Vai trò",
    cell: ({ row }) => (
      <div className="flex gap-1 max-w-[120px]">
        {row.original.roles.map((role) => (
          <Badge key={role.id}>{userRole[role.name]}</Badge>
        ))}
      </div>
    ),
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

// Define role tabs
const roleTabs = [
  { key: "all", label: "Tất cả", roleCode: null },
  { key: "doctor", label: "Bác sĩ", roleCode: "Doctor" },
  { key: "staff", label: "Nhân viên", roleCode: "Staff" },
  {
    key: "lab-tech",
    label: "KTV Xét nghiệm",
    roleCode: "Lab Testing Technician",
  },
  {
    key: "analysis-tech",
    label: "KTV Phân tích",
    roleCode: "Analysis Technician",
  },
  {
    key: "validation-tech",
    label: "KTV Thẩm định",
    roleCode: "Validation Technician",
  },
];

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
  const [activeTab, setActiveTab] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalPage, setGlobalPage] = useState(1);
  const [globalPageSize, setGlobalPageSize] = useState(10);

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

  // Get current tab's role code
  const currentRoleCode =
    roleTabs.find((tab) => tab.key === activeTab)?.roleCode || null;

  // Query for users with current filter
  const debouncedGlobalSearch = useDebounce(globalSearch, 500);
  const {
    data: currentUsersData,
    isLoading: isLoadingCurrentUsers,
    error: currentUsersError,
  } = useQuery({
    queryKey: [
      "users",
      currentRoleCode,
      globalPage,
      debouncedGlobalSearch,
      globalPageSize,
    ],
    queryFn: async () => {
      const result = await getUsers({
        page: globalPage,
        search: debouncedGlobalSearch,
        limit: globalPageSize,
        roleCode: currentRoleCode || undefined,
      });
      return result;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const handleGlobalSearch = (value: string) => {
    setGlobalSearch(value);
    setGlobalPage(1);
  };

  const handleGlobalPageChange = (newPage: number) => {
    setGlobalPage(newPage);
  };

  const handleGlobalPageSizeChange = (newSize: number) => {
    setGlobalPageSize(newSize);
    setGlobalPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setGlobalPage(1); // Reset to first page when changing tabs
  };

  if (rolesError || currentUsersError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {rolesError instanceof Error
            ? rolesError.message
            : currentUsersError instanceof Error
            ? currentUsersError.message
            : "Đã xảy ra lỗi khi tải dữ liệu"}
        </AlertDescription>
      </Alert>
    );
  }

  const allUsers = allUsersData?.users || [];
  const currentUsers = currentUsersData?.users || [];
  const totalUsers = currentUsersData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Action buttons and total count */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {currentRoleCode
              ? `${
                  roleTabs.find((tab) => tab.roleCode === currentRoleCode)
                    ?.label
                }: `
              : "Tổng: "}
            {totalUsers} {totalUsers === 1 ? "tài khoản" : "tài khoản"}
          </div>
        </div>
      </div>

      {/* Search bar above tabs */}
      <div className="flex justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo email..."
            value={globalSearch}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            className="w-full px-3 pl-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent "
          />
        </div>
        <UsersActions roles={rolesData?.roles || []} users={allUsers} />
      </div>

      {/* Role-based tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          {roleTabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {roleTabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <div className="space-y-4">
              <DataTable
                columns={columns}
                data={currentUsers}
                total={totalUsers}
                page={globalPage}
                pageSize={globalPageSize}
                onPageChange={handleGlobalPageChange}
                onPageSizeChange={handleGlobalPageSizeChange}
                enableFiltering={false}
                enableColumnVisibility={false} // Disable DataTable's internal search since we're using global search
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
              {isLoadingCurrentUsers && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {isLoadingRoles && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
}

export default UsersTable;
