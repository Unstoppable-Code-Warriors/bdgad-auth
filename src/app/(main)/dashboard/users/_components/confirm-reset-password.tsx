"use client";

import { Button } from "@/components/ui/button";
import { Row } from "@tanstack/react-table";
import { GetUsersResult } from "@/lib/actions/users";
import { useState } from "react";
import { toast } from "sonner";

interface ConfirmResetPasswordProps {
  row: Row<GetUsersResult["users"][0]>;
  closeModal: () => void;
}

const ConfirmResetPassword = ({ row, closeModal }: ConfirmResetPasswordProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: row.original.email,
          redirectUrl: `https://bdgad.bio/auth`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      closeModal();
      toast.success("Email khôi phục mật khẩu đã được gửi đến người dùng.");
    } catch (error) {
      toast.error("Lỗi khi khôi phục mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p>
        Bạn có chắc chắn muốn khôi phục mật khẩu cho{" "}
        <span className="font-semibold">{row.original.name}</span>? Liên kết khôi phục mật khẩu sẽ được gửi đến địa chỉ email của họ.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => closeModal()}
          disabled={isLoading}
        >
          Hủy bỏ
        </Button>
        <Button onClick={handleResetPassword} disabled={isLoading}>
          {isLoading ? "Đang gửi..." : "Khôi phục mật khẩu"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmResetPassword; 