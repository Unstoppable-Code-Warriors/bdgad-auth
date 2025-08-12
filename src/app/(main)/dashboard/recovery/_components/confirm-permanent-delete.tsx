"use client";

import { Button } from "@/components/ui/button";
import { Row } from "@tanstack/react-table";
import {
  GetDeletedUsersResult,
  permanentDeleteUser,
} from "@/lib/actions/users";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConfirmPermanentDeleteProps {
  row: Row<GetDeletedUsersResult["users"][0]>;
  closeModal: () => void;
}

const ConfirmPermanentDelete = ({
  row,
  closeModal,
}: ConfirmPermanentDeleteProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const permanentDeleteUserMutation = useMutation({
    mutationFn: permanentDeleteUser,
    onSuccess: () => {
      toast.success("Tài khoản đã được xóa vĩnh viễn khỏi hệ thống");
      queryClient.invalidateQueries({ queryKey: ["deletedUsers"] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi xóa vĩnh viễn tài khoản");
    },
  });

  const handlePermanentDelete = async () => {
    try {
      setIsLoading(true);
      await permanentDeleteUserMutation.mutateAsync({ id: row.original.id });
    } catch (error) {
      console.error("Permanent delete error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản sau đây khỏi hệ thống
          không?
        </p>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
          <p>
            <strong>Tên:</strong> {row.original.name}
          </p>
          <p>
            <strong>Email:</strong> {row.original.email}
          </p>
        </div>
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Lưu ý:</strong> Sau khi xóa vĩnh viễn:
          </p>
          <ul className="text-sm text-red-700 mt-2 space-y-1">
            <li>• Tài khoản sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu</li>
            <li>• Không thể khôi phục lại tài khoản này</li>
            <li>• Tất cả dữ liệu liên quan sẽ bị mất vĩnh viễn</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={closeModal} disabled={isLoading}>
          Hủy
        </Button>
        <Button
          onClick={handlePermanentDelete}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmPermanentDelete;
