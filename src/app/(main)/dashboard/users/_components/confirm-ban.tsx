import { Button } from "@/components/ui/button";
import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { updateUser } from "@/lib/actions/users";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendBanNotification, sendUnbanNotification } from "@/lib/actions/email";
import { useForm } from "@mantine/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader } from "lucide-react";

interface ConfirmBanProps {
  row: Row<GetUsersResult["users"][0]>;
  onClose: () => void;
}

export default function ConfirmBan({ row, onClose }: ConfirmBanProps) {
  const queryClient = useQueryClient();
  const user = row.original;
  const isActive = user.status === "active";
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      reason: "",
    },
    validate: {
      reason: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return "Reason is required";
        
        // Check for multiple spaces
        if (/\s{2,}/.test(trimmedValue)) {
          return "Reason cannot contain multiple spaces between words";
        }
        
        // Check for allowed characters
        const validPattern = /^[a-zA-ZÀ-ỹ0-9\s.,]+$/u;
        if (!validPattern.test(trimmedValue)) {
          return "Reason can only contain letters (including Vietnamese), numbers, single spaces, periods (.), and commas (,)";
        }
        
        if (trimmedValue.length > 200) {
          return "Reason must be 200 characters or less";
        }
        
        return null;
      },
    },
  });

  const handleAction = async (values: typeof form.values) => {
    try {
      setIsLoading(true);
      await updateUser({
        id: user.id,
        status: isActive ? "inactive" : "active",
      });

      // Send notification email
      if (isActive) {
        const result = await sendBanNotification(user.email, user.name, values.reason.trim());
        if (result.success) {
          toast.success(`User has been banned and notification email has been sent.`);
        } else {
          toast.success(`User has been banned, but failed to send notification email.`);
        }
      } else {
        const result = await sendUnbanNotification(user.email, user.name, values.reason.trim());
        if (result.success) {
          toast.success(`User has been unbanned and notification email has been sent.`);
        } else {
          toast.success(`User has been unbanned, but failed to send notification email.`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    } catch (error) {
      toast.error(`Failed to ${isActive ? "ban" : "unban"} user`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleAction)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to {isActive ? "ban" : "unban"} {user.name}? 
        {isActive 
          ? " This will prevent them from accessing the system and they will be notified via email."
          : " This will restore their access to the system and they will be notified via email."}
      </p>

      <div className="grid gap-2">
        <Label htmlFor="reason">Reason<span className="text-red-500">*</span></Label>
        <Textarea
          id="reason"
          {...form.getInputProps("reason")}
          placeholder={`Enter reason for ${isActive ? "banning" : "unbanning"} this user`}
          className="resize-none"
          disabled={isLoading}
        />
        {form.errors.reason && (
          <div className="text-sm text-red-600">{form.errors.reason}</div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="destructive" type="submit" disabled={isLoading}>
          {isActive ? "Ban User" : "Unban User"}
          {isLoading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  );
} 