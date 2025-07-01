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

interface UserFormProps {
  action: "create" | "update";
  row?: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
  users: GetUsersResult["users"];
}

interface UserMetadata {
  phone?: string;
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
      phone: (userData?.metadata as UserMetadata)?.phone || "",
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
      
        if (trimmedValue.length > 50) return "Tên không được vượt quá 50 ký tự";
      
        return null;
      },
      email: (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length === 0) return "Email là bắt buộc";
        if (!/^\S+@\S+$/.test(trimmedValue)) return "Định dạng email không hợp lệ";
        
        // Check if email already exists in the system (skip check in update mode)
        if (!isUpdateMode) {
          const emailExists = users.some(user => user.email === trimmedValue);
          if (emailExists) return "Email đã tồn tại trong hệ thống";
        }
        
        return null;
      },
      roleId: (value: string) => (value ? null : "Vui lòng chọn vai trò"),
      phone: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null; // Phone is optional
      
        // Require country code prefix (starting with +)
        if (!trimmedValue.startsWith('+')) {
          return "Vui lòng nhập mã quốc gia bắt đầu bằng +";
        }

        // Basic phone number validation
        if (trimmedValue.length < 12 || trimmedValue.length > 13) {
          return "Số điện thoại phải có từ 12-13 ký tự bao gồm mã quốc gia";
        }

        if (!/^\+\d+$/.test(trimmedValue)) {
          return "Số điện thoại chỉ được chứa + và các chữ số";
        }

        if (/\s/.test(trimmedValue)) {
          return "Số điện thoại không được chứa khoảng trắng";
        }
      
        // Check if phone already exists in the system
        const phoneExists = users.some(user => {
          if (isUpdateMode && user.id === userData?.id) return false;
          const metadata = user.metadata as UserMetadata;
          return metadata?.phone === trimmedValue;
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
        
        if (trimmedValue.length > 200) {
          return "Địa chỉ không được vượt quá 200 ký tự";
        }
        
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    console.log("values.phone",values.phone);
    try {
      const metadata: UserMetadata = {
        phone: values.phone.trim(),
        address: values.address.trim(),
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
          toast.success("Cập nhật người dùng thành công. Email thông báo đã được gửi.");
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
        toast.error("Failed to create user");
      } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Tên</Label>
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
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="phone">Số điện thoại (tùy chọn)</Label>
          <Input
            id="phone"
            placeholder="+84987654321"
            onChange={(e) => form.setFieldValue("phone", e.target.value)}
            value={form.values.phone}
          />
          {form.errors.phone && (
            <div className="text-sm text-red-600">{form.errors.phone}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Địa chỉ (tùy chọn)</Label>
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
          <Label htmlFor="roleId">Vai trò</Label>
          <Select
            value={form.values.roleId}
            onValueChange={(value: string) => form.setFieldValue("roleId", value)}
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
