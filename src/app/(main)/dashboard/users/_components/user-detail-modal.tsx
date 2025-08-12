"use client";

import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { userRole, userStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface UserDetailModalProps {
  row: Row<GetUsersResult["users"][0]>;
}

const UserDetailModal = ({ row }: UserDetailModalProps) => {
  const user = row.original;
  const metadata = (user.metadata as Record<string, any>) || {};
  const phone = metadata.phone || "-";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Tên</h3>
          <p className="mt-1">{user.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
          <p className="mt-1">{user.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Trạng thái
          </h3>
          <p className="mt-1">
            <Badge
              variant={
                row.original.status === "active" ? "default" : "destructive"
              }
              className={
                row.original.status === "active"
                  ? "bg-green-600 text-white"
                  : ""
              }
            >
              {userStatus[user.status]}
            </Badge>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Vai trò</h3>
          <p className="mt-1">
            {user.roles.map((role) => (
              <Badge key={role.id} className="mr-1">
                {userRole[role.name]}
              </Badge>
            ))}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Số điện thoại
          </h3>
          <p className="mt-1">{phone}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Địa chỉ</h3>
          <p className="mt-1">{metadata.address || "-"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Ngày tạo
          </h3>
          <p className="mt-1">{formatDate(new Date(user.createdAt), true)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Ngày cập nhật
          </h3>
          <p className="mt-1">{formatDate(new Date(user.updatedAt), true)}</p>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
