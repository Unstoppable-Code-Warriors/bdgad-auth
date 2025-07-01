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
      reason: (value) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return "Lý do là bắt buộc";
        
        // Check for multiple spaces
        if (/\s{2,}/.test(trimmedValue)) {
          return "Lý do không được chứa nhiều khoảng trắng giữa các từ";  
        }
        
        // Check for allowed characters
        const validPattern = /^[a-zA-ZÀ-ỹ0-9\s.,]+$/u;
        if (!validPattern.test(trimmedValue)) {
          return "Lý do chỉ được chứa các chữ cái (bao gồm tiếng Việt), số, khoảng trắng, dấu chấm (.) và dấu phẩy (,)";
        }
        
        if (trimmedValue.length > 200 || trimmedValue.length < 50) {
          return "Lý do phải có từ 50 ký tự trở lên và không quá 200 ký tự";
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
          toast.success(`Tài khoản đã bị tạm ngừng và email thông báo đã được gửi.`);
        } else {
          toast.success(`Tài khoản đã bị tạm ngừng, nhưng không thể gửi email thông báo.`);
        }
      } else {
        const result = await sendUnbanNotification(user.email, user.name, values.reason.trim());
        if (result.success) {
          toast.success(`Tài khoản đã được khôi phục và email thông báo đã được gửi.`);
        } else {
          toast.success(`Tài khoản đã được khôi phục.`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    } catch (error) {
      toast.error(`Không thể ${isActive ? "tạm ngừng" : "khôi phục"} tài khoản`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleAction)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Bạn có chắc chắn muốn {isActive ? "tạm ngừng" : "khôi phục"} tài khoản {user.name}? 
        {isActive 
          ? " Người dùng sẽ không thể truy cập hệ thống và sẽ nhận được email thông báo."
          : " Người dùng sẽ được khôi phục quyền truy cập hệ thống và sẽ nhận được email thông báo."}
      </p>

      <div className="grid gap-2">
        <Label htmlFor="reason">Lý do<span className="text-red-500">*</span></Label>
        <Textarea
          id="reason"
          {...form.getInputProps("reason")}
          placeholder={`Nhập lý do ${isActive ? "tạm ngừng" : "khôi phục"} tài khoản này`}
          className="resize-none"
          disabled={isLoading}
        />
        {form.errors.reason && (
          <div className="text-sm text-red-600">{form.errors.reason}</div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Hủy bỏ
        </Button>
        <Button variant={isActive ? "destructive" : "default"} type="submit" disabled={isLoading}>
          {isActive ? "Tạm ngừng tài khoản" : "Khôi phục tài khoản"}
          {isLoading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  );
} 