import { Button } from "@/components/ui/button";
import { GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import { Plus } from "lucide-react";
import { useState } from "react";
import UserForm from "./user-form";

interface UsersActionsProps {
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}

export function UsersActions({ roles, users }: UsersActionsProps) {
  const [showUserForm, setShowUserForm] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => setShowUserForm(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add User
      </Button>
      {showUserForm && (
        <UserForm
          action="create"
          roles={roles}
        />
      )}
    </div>
  );
} 