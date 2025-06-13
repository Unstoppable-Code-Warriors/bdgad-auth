"use client";

import { Button } from "@/components/ui/button";
import { createHeader, DataTable } from "@/components/ui/datatable";
import { GetUsersResult } from "@/lib/actions/users";
import { FetchLimit } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Download, FileDown, Plus, Ban, Trash2, Eye, Pencil, Lock, FileUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import ConfirmDeleteUser from "./confirm-delete";
import { getRoles, GetRolesResult } from "@/lib/actions/roles";
import UserForm from "./user-form";
import { Badge } from "@/components/ui/badge";
import ImportExcelForm from "./import-excel-form";
import ConfirmResetPassword from "./confirm-reset-password";
import UserDetailModal from "./user-detail-modal";
import ConfirmBan from "./confirm-ban";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/actions/users";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

const columns: ColumnDef<GetUsersResult["users"][0]>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="max-w-[130px] " title={row.original.email}>
        {row.original.email}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "default" : "secondary"}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "roles",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex gap-1 max-w-[80px]">
        {row.original.roles.map((role) => (
          <Badge key={role.id}>{role.name}</Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="max-w-[100px] truncate" title={(row.original?.metadata as Record<string, string>)?.["phone"] || "-"}>
        {(row.original?.metadata as Record<string, string>)?.["phone"] || "-"}
      </div>
    )
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <div className="max-w-[100px] truncate" title={(row.original?.metadata as Record<string, string>)?.["address"] || "-"}>
        {(row.original?.metadata as Record<string, string>)?.["address"] || "-"}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div>
        <div className="max-w-[90px]">
          {format(new Date(row.original.createdAt), "PPP")}
        </div>
      </div>
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

  const openAddUserModal = () => {
    dialog.open({
      title: "Add New User",
      children: <UserForm action="create" roles={roles} />,
      size: "md",
    });
  };

  const downloadTemplateModal = () => {
    const link = document.createElement("a");
    link.href = "/templates/account_creation_template.xlsx";
    link.download = "account_creation_template.xlsx";
    link.click();
  };

  const hanldeImportExcel = (
    users: GetUsersResult["users"],
    roles: GetRolesResult["roles"]
  ) => {
    dialog.open({
      title: "Import Excel",
      children: (
        <ImportExcelForm
          users={users}
          roles={roles}
          closeModal={() => dialog.closeAll()}
        />
      ),
      size: "xl",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={downloadTemplateModal}>
        <FileDown className="h-4 w-4 mr-2" />
        Download Template
      </Button>
      <Button variant="outline" onClick={() => hanldeImportExcel(users, roles)}>
        <FileUp className="h-4 w-4 mr-2" />
        Import excel
      </Button>
      <Button variant="outline" onClick={openAddUserModal}>
        <Plus className="h-4 w-4 mr-2" />
        Add New
      </Button>
    </div>
  );
};

const ActionsMenu = ({
  row,
  roles,
}: {
  row: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
}) => {
  const dialog = useDialog();

  const openEditUserModal = () => {
    dialog.open({
      title: "Edit User",
      children: <UserForm action="update" row={row} roles={roles} />,
    });
  };

  const openConfirmDeleteDialog = () => {
    dialog.open({
      title: "Delete User",
      children: <ConfirmDeleteUser row={row} />,
    });
  };

  const openConfirmResetPasswordDialog = () => {
    dialog.open({
      title: "Reset Password",
      children: (
        <ConfirmResetPassword row={row} closeModal={() => dialog.closeAll()} />
      ),
    });
  };

  const openUserDetailModal = () => {
    dialog.open({
      title: "User Details",
      children: <UserDetailModal row={row} />,
    });
  };

  const openBanUserDialog = () => {
    dialog.open({
      title: "Ban User",
      children: <ConfirmBan onClose={() => dialog.closeAll()} row={row} />,
      onClose: () => dialog.closeAll(),
    });
  };

  return (
    <>
      <DropdownMenuItem onClick={openUserDetailModal}>
       <div className="flex items-center gap-1">
       <Eye className="mr-2 h-4 w-4" />
       View Detail
       </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openEditUserModal}>
        <div className="flex items-center gap-1">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openConfirmResetPasswordDialog}>
        <div className="flex items-center gap-1">
          <Lock className="mr-2 h-4 w-4" />
          Reset Password
        </div>
      </DropdownMenuItem>
      {row.original.status === "active" ? (
        <DropdownMenuItem onClick={openBanUserDialog}>
          <Ban className="mr-2 h-4 w-4" />
          Ban User
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={openBanUserDialog}>
          <Ban className="mr-2 h-4 w-4" />
          Unban User
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={openConfirmDeleteDialog}
        disabled={row.original.status === "active"}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  );
};

export function UsersTable() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  
  // Query for paginated users (for table display)
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["users", page, search, pageSize],
    queryFn: () => getUsers({ 
      page, 
      search,
      limit: pageSize
    }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Query for all users (for actions)
  const { data: allUsersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => getUsers({ 
      page: 1,
      search: "",
      limit: 1000 // Large enough to get all users
    }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError } = useQuery({
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
            : "An error occurred while loading data"}
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
          Total: {total} {total === 1 ? 'user' : 'users'}
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
        searchKey="name"
        searchPlaceholder="Search by name or email..."
        enableFiltering={true}
        onSearch={handleSearch}
        searchValue={search}
        actions={<UsersActions roles={rolesData?.roles || []} users={allUsers} />}
        rowActions={(row) => <ActionsMenu row={row} roles={rolesData?.roles || []} />}
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
