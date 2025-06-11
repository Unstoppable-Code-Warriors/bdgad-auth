import { Button } from "@/components/ui/button";
import { GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import { Plus } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import UserForm from "./user-form";

interface UsersActionsProps {
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}

export function UsersActions({ roles, users }: UsersActionsProps) {
  const dialog = useDialog();

  const openAddUserModal = () => {
    dialog.open({
      title: "Add New User",
      children: <UserForm action="create" roles={roles} />,
      size: "md",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={openAddUserModal}>
        <Plus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
} 