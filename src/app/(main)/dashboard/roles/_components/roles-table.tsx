"use client";

import { createHeader, DataTable } from "@/components/ui/datatable";
import { GetRolesResult } from "@/lib/actions/roles";
import { FetchLimit, userRole } from "@/lib/constants";
import { ColumnDef, Row } from "@tanstack/react-table";
import { useDialog } from "@/hooks/use-dialog";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import RoleForm from "./role-form";
import { Label } from "@/components/ui/label";

const columns: ColumnDef<GetRolesResult["roles"][0]>[] = [
  {
    id: "stt",
    header: createHeader("STT"),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.index + 1}
      </div>
    ),
    size: 60,
  },
  {
    accessorKey: "name",
    header: createHeader("Vai trò"),
    cell: ({ row }) => (
      <div title={userRole[row.original.name] || row.original.name}>
        {userRole[row.original.name] || row.original.name}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: createHeader("Mô tả"),
    cell: ({ row }) => (
      <div className="max-w-[550px] truncate" title={row.original.description}>
        {row.original.description}
      </div>
    ),
    size: 200,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionsMenu row={row} />,
    size: 50,
    enableSorting: false,
    enableHiding: false,
  },
];


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
            <Label>Vai trò</Label>
            <div className="text-sm">{userRole[row.original.name]}</div>
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
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Mở menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={openViewDetailModal}>
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openEditRoleModal}>
          Cập nhật mô tả
        </DropdownMenuItem>
      </DropdownMenuContent>
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
    />
  );
};

export default RolesTable;
