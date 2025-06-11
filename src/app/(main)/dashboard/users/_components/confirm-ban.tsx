import { Button } from "@/components/ui/button";
import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { updateUser } from "@/lib/actions/users";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConfirmBanProps {
  row: Row<GetUsersResult["users"][0]>;
  onClose: () => void;
}

export default function ConfirmBan({ row, onClose }: ConfirmBanProps) {
  const queryClient = useQueryClient();
  const user = row.original;
  const isActive = user.status === "active";

  const handleAction = async () => {
    try {
      await updateUser({
        id: user.id,
        status: isActive ? "inactive" : "active",
      });

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`User has been ${isActive ? "banned" : "unbanned"} successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to ${isActive ? "ban" : "unban"} user`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to {isActive ? "ban" : "unban"} {user.name}? 
        {isActive 
          ? " This will prevent them from accessing the system."
          : " This will restore their access to the system."}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleAction}>
          {isActive ? "Ban User" : "Unban User"}
        </Button>
      </div>
    </div>
  );
} 