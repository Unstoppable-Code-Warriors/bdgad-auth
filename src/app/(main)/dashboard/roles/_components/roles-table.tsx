"use client";

import { Button } from "@/components/ui/button";
import { createHeader, DataTable } from "@/components/ui/datatable";
import { GetRolesResult } from "@/lib/actions/roles";
import { FetchLimit, userRole } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import RoleForm from "./role-form";
import { Label } from "@/components/ui/label";

const columns: ColumnDef<GetRolesResult["roles"][0]>[] = [
  {
    accessorKey: "name",
    header: createHeader("Tên"),
    cell: ({ row }) => (
      <div title={row.original.name}>{userRole[row.original.name]}</div>
    ),
  },
  {
    accessorKey: "description",
    header: createHeader("Mô tả"),
    cell: ({ row }) => (
      <div className="max-w-[600px] truncate" title={row.original.description}>
        {row.original.description}
      </div>
    ),
  },
];

const RolesActions = () => {
  const dialog = useDialog();

  const openAddRoleModal = () => {
    dialog.open({
      title: "Thêm vai trò mới",
      children: <RoleForm action="create" />,
      size: "md",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={openAddRoleModal}>
        <Plus className="h-4 w-4 mr-2" />
        Add New
      </Button>
    </div>
  );
};

const ActionsMenu = ({ row }: { row: Row<GetRolesResult["roles"][0]> }) => {
  const dialog = useDialog();

  const openEditRoleModal = () => {
    dialog.open({
      title: "Cập nhật vai trò",
      children: <RoleForm action="update" row={row} />,
    });
  };

  const openViewDetailModal = () => {
    dialog.open({
      title: "Chi tiết vai trò",
      children: (
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tên</Label>
            <div className="text-sm">{row.original.name}</div>
          </div>
          <div className="grid gap-2">
            <Label>Mô tả</Label>
            <div className="text-sm max-h-[300px] overflow-y-auto">
              {row.original.description}
            </div>
          </div>
        </div>
      ),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={openViewDetailModal}>
        Xem chi tiết
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openEditRoleModal}>
        Cập nhật mô tả
      </DropdownMenuItem>
    </DropdownMenu>
  );
};

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
      enableColumnVisibility={false}
      rowActions={(row) => <ActionsMenu row={row} />}
    />
  );
};

export default RolesTable;
