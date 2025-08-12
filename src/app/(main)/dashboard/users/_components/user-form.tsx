"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createUser, updateUser, GetUsersResult } from "@/lib/actions/users";
import { useForm } from "@mantine/form";
import { useDialog } from "@/hooks/use-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { GetRolesResult } from "@/lib/actions/roles";
import { Row } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { userRole } from "@/lib/constants";
import { phoneError } from "@/lib/utils/messageErrors";

interface UserFormProps {
  action: "create" | "update";
  row?: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}

interface UserMetadata {
  phones?: string[];
  address?: string;
}

export function UserForm({ action, row, roles, users }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();
  const isUpdateMode = action === "update";
  const userData = row?.original;
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm({
    initialValues: {
      name: userData?.name || "",
      email: userData?.email || "",
      roleId: userData?.roles?.[0]?.id?.toString() || "",
      phone1: (userData?.metadata as UserMetadata)?.phones?.[0] || "",
      phone2: (userData?.metadata as UserMetadata)?.phones?.[1] || "",
      address: (userData?.metadata as UserMetadata)?.address || "",
    },
    validate: {
      name: (value: string) => {
        const trimmedValue = value.trim();

        if (trimmedValue.length === 0) return "Tên là bắt buộc";

        const validPattern = /^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/u;

        if (!validPattern.test(trimmedValue)) {
          return "Tên chỉ được chứa chữ cái (bao gồm tiếng Việt) và khoảng trắng giữa các từ";
        }

        if (trimmedValue.length > 50 || trimmedValue.length < 3)
          return "Tên không được vượt quá 50 ký tự và phải có ít nhất 3 ký tự";

        return null;
      },
      email: (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length === 0) return "Email là bắt buộc";
        if (!/^\S+@\S+$/.test(trimmedValue))
          return "Định dạng email không hợp lệ";

        // Check if email already exists in the system (skip check in update mode)
        if (!isUpdateMode) {
          const emailExists = users.some((user) => user.email === trimmedValue);
          if (emailExists) return "Email đã tồn tại trong hệ thống";
        }

        return null;
      },
      roleId: (value: string) => (value ? null : "Vui lòng chọn vai trò"),
      phone1: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null; // Phone is optional

        if (!phoneError.pattern.test(trimmedValue)) {
          return phoneError.message;
        }

        // Check if phone1 is the same as phone2
        if (trimmedValue === form.values.phone2.trim() && trimmedValue !== "") {
          return "Số điện thoại 1 không được trùng với số điện thoại 2";
        }

        // Check if phone already exists in the system
        const phoneExists = users.some((user) => {
          if (isUpdateMode && user.id === userData?.id) return false;
          const metadata = user.metadata as UserMetadata;
          return metadata?.phones?.includes(trimmedValue);
        });
        if (phoneExists) return "Số điện thoại đã tồn tại trong hệ thống";

        return null;
      },
      phone2: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null; // Phone is optional

        if (!phoneError.pattern.test(trimmedValue)) {
          return phoneError.message;
        }

        // Check if phone2 is the same as phone1
        if (trimmedValue === form.values.phone1.trim() && trimmedValue !== "") {
          return "Số điện thoại 2 không được trùng với số điện thoại 1";
        }

        // Check if phone already exists in the system
        const phoneExists = users.some((user) => {
          if (isUpdateMode && user.id === userData?.id) return false;
          const metadata = user.metadata as UserMetadata;
          return metadata?.phones?.includes(trimmedValue);
        });
        if (phoneExists) return "Số điện thoại đã tồn tại trong hệ thống";

        return null;
      },
      address: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null; // Address is optional

        // Check for multiple spaces
        if (/\s{2,}/.test(trimmedValue)) {
          return "Địa chỉ không được chứa nhiều khoảng trắng liên tiếp";
        }

        // Check for allowed characters: letters (including Vietnamese), numbers, spaces, commas, and slashes
        const validPattern = /^[a-zA-ZÀ-ỹ0-9\s,./-]+$/u;
        if (!validPattern.test(trimmedValue)) {
          return "Địa chỉ chỉ được chứa chữ cái (bao gồm tiếng Việt), số, khoảng trắng, dấu phẩy (,) và dấu gạch chéo (/)";
        }

        if (trimmedValue.length > 200 || trimmedValue.length < 3) {
          return "Địa chỉ không được vượt quá 200 ký tự và phải có ít nhất 3 ký tự";
        }

        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Create phones array, filtering out empty values
      const phones = [values.phone1.trim(), values.phone2.trim()].filter(
        (phone) => phone !== ""
      );

      const metadata: UserMetadata = {
        phones: phones.length > 0 ? phones : undefined,
        address: values.address.trim() || undefined,
      };

      if (isUpdateMode && userData) {
        // Check if role has changed
        const currentRoleId = userData.roles?.[0]?.id?.toString();
        const newRoleId = values.roleId;
        const roleChanged = currentRoleId !== newRoleId;

        await updateUser({
          id: userData.id,
          name: values.name,
          email: values.email,
          roleIds: values.roleId ? [parseInt(values.roleId)] : [],
          metadata,
        });

        if (roleChanged) {
          toast.success(
            "Cập nhật người dùng thành công. Email thông báo đã được gửi."
          );
        } else {
          toast.success("Cập nhật người dùng thành công");
        }
      } else {
        await createUser({
          email: values.email,
          name: values.name,
          metadata,
          roleIds: values.roleId ? [parseInt(values.roleId)] : [],
        });
        toast.success(
          "Tạo người dùng thành công! Thông tin đăng nhập đã được gửi đến địa chỉ email của họ."
        );
      }

      router.refresh();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      dialog.closeAll();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <div>
            Tên <span className="text-red-500">*</span>
          </div>
          <Input
            id="name"
            {...form.getInputProps("name")}
            placeholder="Nguyễn Văn A"
            maxLength={50}
            disabled={isUpdateMode}
          />
          {form.errors.name && (
            <div className="text-sm text-red-600">{form.errors.name}</div>
          )}
        </div>

        <div className="grid gap-2">
          <div>
            Email <span className="text-red-500">*</span>
          </div>
          <Input
            id="email"
            {...form.getInputProps("email")}
            placeholder="example@gmail.com"
            type="email"
            disabled={isUpdateMode}
          />
          {form.errors.email && (
            <div className="text-sm text-red-600">{form.errors.email}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone1">Số điện thoại 1</Label>
          <Input
            id="phone1"
            placeholder="0393271123"
            onChange={(e) => form.setFieldValue("phone1", e.target.value)}
            value={form.values.phone1}
          />
          {form.errors.phone1 && (
            <div className="text-sm text-red-600">{form.errors.phone1}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone2">Số điện thoại 2</Label>
          <Input
            id="phone2"
            placeholder="0393271124"
            onChange={(e) => form.setFieldValue("phone2", e.target.value)}
            value={form.values.phone2}
          />
          {form.errors.phone2 && (
            <div className="text-sm text-red-600">{form.errors.phone2}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Địa chỉ</Label>
          <Textarea
            id="address"
            {...form.getInputProps("address")}
            placeholder="Nhập địa chỉ"
            className="resize-none"
          />
          {form.errors.address && (
            <div className="text-sm text-red-600">{form.errors.address}</div>
          )}
        </div>

        <div className="grid gap-2">
          <div>
            Vai trò <span className="text-red-500">*</span>
          </div>
          <Select
            value={form.values.roleId}
            onValueChange={(value: string) =>
              form.setFieldValue("roleId", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {userRole[role.name]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.errors.roleId && (
            <div className="text-sm text-red-600">{form.errors.roleId}</div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading
            ? isUpdateMode
              ? "Đang cập nhật..."
              : "Đang tạo..."
            : isUpdateMode
            ? "Cập nhật"
            : "Tạo người dùng"}
        </Button>
      </div>
    </form>
  );
}

export default UserForm;
