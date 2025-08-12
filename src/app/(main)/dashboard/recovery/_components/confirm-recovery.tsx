"use client";

import { Button } from "@/components/ui/button";
import { Row } from "@tanstack/react-table";
import { GetDeletedUsersResult, recoverUser } from "@/lib/actions/users";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConfirmRecoveryProps {
  row: Row<GetDeletedUsersResult["users"][0]>;
  closeModal: () => void;
}

const ConfirmRecovery = ({ row, closeModal }: ConfirmRecoveryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const recoverUserMutation = useMutation({
    mutationFn: recoverUser,
    onSuccess: () => {
      toast.success("Tài khoản đã được khôi phục thành công");
      queryClient.invalidateQueries({ queryKey: ["deletedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi khôi phục tài khoản");
    },
  });

  const handleRecover = async () => {
    try {
      setIsLoading(true);
      await recoverUserMutation.mutateAsync({ id: row.original.id });
    } catch (error) {
      console.error("Recovery error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Bạn có chắc chắn muốn khôi phục tài khoản sau đây không?
        </p>
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p>
            <strong>Tên:</strong> {row.original.name}
          </p>
          <p>
            <strong>Email:</strong> {row.original.email}
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Sau khi khôi phục:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Tài khoản sẽ được kích hoạt lại (trạng thái: Hoạt động)</li>
            <li>• Người dùng sẽ nhận được email thông báo khôi phục</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={closeModal} disabled={isLoading}>
          Hủy
        </Button>
        <Button
          onClick={handleRecover}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Đang khôi phục..." : "Khôi phục tài khoản"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmRecovery;
