"use client";

import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface UserDetailModalProps {
  row: Row<GetUsersResult["users"][0]>;
}

const UserDetailModal = ({ row }: UserDetailModalProps) => {
  const user = row.original;
  const metadata = user.metadata as Record<string, string> || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
          <p className="mt-1">{user.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
          <p className="mt-1">{user.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <p className="mt-1">
            <Badge variant={user.status === "active" ? "default" : "secondary"}>
              {user.status}
            </Badge>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
          <p className="mt-1">
            {user.roles.map((role) => (
              <Badge key={role.id} className="mr-1">
                {role.name}
              </Badge>
            ))}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
          <p className="mt-1">{metadata.phone || "-"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
          <p className="mt-1">{metadata.address || "-"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
          <p className="mt-1">
            {format(new Date(user.createdAt), "PPP p")}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
          <p className="mt-1">
            {format(new Date(user.updatedAt), "PPP p")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal; 