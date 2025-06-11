import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Pencil, KeyRound, Trash2 } from "lucide-react";
import UserForm from "./user-form";
import UserDetailModal from "./user-detail-modal";
import ConfirmResetPassword from "./confirm-reset-password";
import ConfirmDelete from "./confirm-delete";
import { useDialog } from "@/hooks/use-dialog";

interface ActionsMenuProps {
  row: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
}

export function ActionsMenu({ row, roles }: ActionsMenuProps) {
  const dialog = useDialog();
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <DropdownMenuItem onClick={() => setShowUserDetail(true)}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setShowUserForm(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit User
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setShowResetPassword(true)}>
        <KeyRound className="mr-2 h-4 w-4" />
        Reset Password
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setShowDelete(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete User
      </DropdownMenuItem>

      {showUserForm && (
        <UserForm
          action="update"
          row={row}
          roles={roles}
        />
      )}

      {showUserDetail && (
        <UserDetailModal
          row={row}
        />
      )}

      {showResetPassword && (
        <ConfirmResetPassword
          row={row}
          closeModal={() => setShowResetPassword(false)}
        />
      )}

      {showDelete && (
        <ConfirmDelete
          row={row}
        />
      )}
    </>
  );
} 