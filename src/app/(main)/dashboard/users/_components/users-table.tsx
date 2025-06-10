"use client";

import { Button } from "@/components/ui/button";
import { createHeader, DataTable } from "@/components/ui/datatable";
import { GetUsersResult } from "@/lib/actions/users";
import { FetchLimit } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Download, FileDown, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import ConfirmDeleteUser from "./confirm-delete";
import { GetRolesResult } from "@/lib/actions/roles";
import UserForm from "./user-form";
import { Badge } from "@/components/ui/badge";
import ImportExcelForm from "./import-excel-form";

const columns: ColumnDef<GetUsersResult["users"][0]>[] = [
  {
    accessorKey: "name",
    header: createHeader("Name"),
  },
  {
    accessorKey: "email",
    header: createHeader("Email"),
  },
  {
    accessorKey: "roles",
    header: createHeader("Role"),
    cell: ({ row }) => {
      const role = row.original.roles[0];
      return role ? (
        <Badge>{role.name}</Badge>
      ) : (
        <span className="text-sm text-muted-foreground">No role</span>
      );
    },
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

  const hanldeImportExcel = (users: GetUsersResult["users"]) => {
    dialog.open({
      title: "Import Excel",
      children: (
        <ImportExcelForm users={users} closeModal={() => dialog.closeAll()} />
      ),
      size: "md",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={downloadTemplateModal}>
        <FileDown className="h-4 w-4 mr-2" />
        Download Template
      </Button>
      <Button variant="outline" onClick={() => hanldeImportExcel(users)}>
        <Download className="h-4 w-4 mr-2" />
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
  return (
    <>
      <DropdownMenuItem onClick={openEditUserModal}>Edit</DropdownMenuItem>
      <DropdownMenuItem onClick={openConfirmDeleteDialog}>
        Delete
      </DropdownMenuItem>
    </>
  );
};

const UsersTable = ({
  users,
  total,
  roles,
}: GetUsersResult & { roles: GetRolesResult["roles"] }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams.get("page");

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={users}
      total={total}
      page={parseInt(page as string) || 1}
      pageSize={FetchLimit.USERS}
      onPageChange={handlePageChange}
      actions={<UsersActions roles={roles} users={users} />}
      rowActions={(row) => <ActionsMenu row={row} roles={roles} />}
    />
  );
};

export default UsersTable;
