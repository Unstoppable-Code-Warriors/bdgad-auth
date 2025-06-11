import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import UserForm from "./user-form";
import UserDetailModal from "./user-detail-modal";
import ConfirmResetPassword from "./confirm-reset-password";
import ConfirmDelete from "./confirm-delete";
import ConfirmBan from "./confirm-ban";

interface ActionsMenuProps {
  row: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
}

export function ActionsMenu({ row, roles }: ActionsMenuProps) {

  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showBan, setShowBan] = useState(false);


  return (
    <>
      <DropdownMenuItem onClick={() => setShowUserDetail(true)}>
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setShowUserForm(true)}>
        Edit User
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setShowResetPassword(true)}>
        Reset Password
      </DropdownMenuItem>
      {row.original.status === "active" ? (
        <DropdownMenuItem className="text-red-500" onClick={() => setShowBan(true)}>
          Ban User   
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => setShowBan(true)}>
          Unban User
        </DropdownMenuItem>
      )}
        <DropdownMenuItem onClick={() => setShowDelete(true)} disabled={row.original.status === "active"}>
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

      {showBan && (
        <ConfirmBan
          row={row}
          onClose={() => setShowBan(false)}
        />
      )}
    </>
  );
} 