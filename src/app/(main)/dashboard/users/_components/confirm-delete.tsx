import { deleteUser, GetUsersResult } from "@/lib/actions/users";
import { Row } from "@tanstack/react-table";
import { useDialog } from "@/hooks/use-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";

const ConfirmDeleteUser = ({
  row,
}: {
  row: Row<GetUsersResult["users"][0]>;
}) => {
  const dialog = useDialog();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteUser({ id: row.original.id });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      dialog.closeAll();
      toast.success("Người dùng đã được xóa!");
    } catch (error) {
      toast.error("Lỗi khi xóa người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p>Bạn có chắc chắn muốn xóa người dùng này?</p>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div>
          <p className="text-sm text-yellow-800 mb-2">
            <TriangleAlertIcon className="inline-block mr-2  h-4 w-4" />
            Cảnh báo
          </p>
          <p className="text-sm text-yellow-800">
            Trước khi tiến hành xóa, vui lòng kiểm tra liệu tài khoản này có
            đang có các lượt khám chưa hoàn tất trong hệ thống hay không
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={dialog.closeAll}
          disabled={isLoading}
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? "Đang xóa..." : "Xóa"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmDeleteUser;
