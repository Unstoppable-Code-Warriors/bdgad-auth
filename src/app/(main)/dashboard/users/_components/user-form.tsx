"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, updateUser, GetUsersResult } from "@/lib/actions/users";
import { useForm } from "@mantine/form";
import { useDialog } from "@/hooks/use-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GetRolesResult } from "@/lib/actions/roles";
import { Row } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormProps {
  action: "create" | "update";
  row?: Row<GetUsersResult["users"][0]>;
  roles: GetRolesResult["roles"];
}

interface UserMetadata {
  phone?: string;
  address?: string;
}

export function UserForm({ action, row, roles }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const isUpdateMode = action === "update";
  const userData = row?.original;
  console.log("roles from data", roles);
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
        if (trimmedValue.length === 0) return "Name is required";
        if (!/^[a-zA-Z0-9\s]+$/.test(trimmedValue)) {
          return "Name can only contain letters, numbers and spaces";
        }
        if (trimmedValue.length > 50) return "Name must be 50 characters or less";
        return null;
      },
      email: (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length === 0) return "Email is required";
        if (!/^\S+@\S+$/.test(trimmedValue)) return "Invalid email format";
        return null;
      },
      roleId: (value: string) => (value ? null : "Please select a role"),
      phone: (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue && !/^\+?[\d\s-]{10,}$/.test(trimmedValue)) {
          return "Invalid phone number format";
        }
        return null;
      },
      address: (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue && trimmedValue.length > 200) {
          return "Address must be 200 characters or less";
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const metadata: UserMetadata = {
        phone: values.phone.trim(),
        address: values.address.trim(),
      };

      if (isUpdateMode && userData) {
        await updateUser({
          id: userData.id,
          name: values.name,
          email: values.email,
          roleIds: values.roleId ? [parseInt(values.roleId)] : [],
          metadata,
        });
        toast.success("User updated successfully");
      } else {
        await createUser({
          email: values.email,
          name: values.name,
          metadata,
          roleIds: values.roleId ? [parseInt(values.roleId)] : [],
        });
        toast.success(
          "User created successfully! Login credentials have been sent to their email address."
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      dialog.closeAll();
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to ${isUpdateMode ? "update" : "create"} user${
          !isUpdateMode ? ", please check if the email address has been used before." : "."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            {...form.getInputProps("name")}
            maxLength={50}
          />
          {form.errors.name && (
            <div className="text-sm text-red-600">{form.errors.name}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email*</Label>
          <Input
            id="email"
            {...form.getInputProps("email")}
            disabled={isUpdateMode}
          />
          {form.errors.email && (
            <div className="text-sm text-red-600">{form.errors.email}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...form.getInputProps("phone")}
            placeholder="+1234567890"
          />
          {form.errors.phone && (
            <div className="text-sm text-red-600">{form.errors.phone}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...form.getInputProps("address")}
            maxLength={200}
          />
          {form.errors.address && (
            <div className="text-sm text-red-600">{form.errors.address}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="role">Role*</Label>
          <Select
            value={form.values.roleId}
            onValueChange={(value: string) => form.setFieldValue("roleId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
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
              ? "Updating..."
              : "Creating..."
            : isUpdateMode
            ? "Update User"
            : "Create User"}
        </Button>
      </div>
    </form>
  );
}

export default UserForm;
