"use client";

import { Row } from "@tanstack/react-table";
import { GetDeletedUsersResult } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { userRole, userStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface RecoveryDetailModalProps {
  row: Row<GetDeletedUsersResult["users"][0]>;
}

// Calculate expiry date function
const calculateExpiryDate = (deletedAt: string | Date) => {
  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiryDate;
};

// Calculate days remaining function
const calculateDaysRemaining = (deletedAt: string | Date) => {
  const deletedDate = new Date(deletedAt);
  const now = new Date();
  const thirtyDaysFromDeletion = new Date(
    deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const diffTime = thirtyDaysFromDeletion.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const RecoveryDetailModal = ({ row }: RecoveryDetailModalProps) => {
  const user = row.original;
  const metadata = (user.metadata as Record<string, string>) || {};
  const expiryDate = calculateExpiryDate(user.deletedAt!);
  const daysRemaining = calculateDaysRemaining(user.deletedAt!);
  const isExpired = daysRemaining === 0;

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
            Trạng thái trước khi xóa
          </h3>
          <p className="mt-1">
            <Badge
              variant={user.status === "active" ? "default" : "destructive"}
              className={
                user.status === "active" ? "bg-green-600 text-white" : ""
              }
            >
              {userStatus[user.status]}
            </Badge>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Vai trò</h3>
          <p className="mt-1">
            {user.roles.map((role: any) => (
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
          <p className="mt-1">{metadata.phone || "-"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Địa chỉ</h3>
          <p className="mt-1">{metadata.address || "-"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Ngày tạo
          </h3>
          <p className="mt-1">{formatDate(new Date(user.createdAt))}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Ngày xóa
          </h3>
          <p className="mt-1">{formatDate(new Date(user.deletedAt!))}</p>
        </div>
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Ngày hết hạn khôi phục
          </h3>
          <div className="mt-1 space-y-2">
            <div className="text-sm font-medium">{formatDate(expiryDate)}</div>
            <Badge
              variant={
                isExpired
                  ? "destructive"
                  : daysRemaining <= 7
                  ? "destructive"
                  : daysRemaining <= 15
                  ? "secondary"
                  : "default"
              }
              className={
                isExpired
                  ? "bg-red-600 text-white"
                  : daysRemaining <= 7
                  ? "bg-red-600 text-white"
                  : daysRemaining <= 15
                  ? "bg-yellow-600 text-white"
                  : "bg-green-600 text-white"
              }
            >
              {isExpired ? "Đã hết hạn" : `Còn ${daysRemaining} ngày`}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryDetailModal;
