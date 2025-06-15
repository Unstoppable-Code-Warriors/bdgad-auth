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
      
        if (trimmedValue.length === 0) return "Name is required";
      
        const validPattern = /^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/u;
      
        if (!validPattern.test(trimmedValue)) {
          return "Name can only contain letters (including Vietnamese) and single spaces between words";
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
        if (!trimmedValue) return null; // Phone is optional
        
        // Check if phone contains only digits
        if (!/^\d+$/.test(trimmedValue)) {
          return "Phone number must contain only digits (0-9)";
        }
        
        // Check if phone has exactly 10 digits
        if (trimmedValue.length !== 10) {
          return "Phone number must be exactly 10 digits";
        }
        
        return null;
      },
      address: (value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null; // Address is optional
        
        // Check for multiple spaces
        if (/\s{2,}/.test(trimmedValue)) {
          return "Address cannot contain multiple spaces between words";
        }
        
        // Check for allowed characters: letters (including Vietnamese), numbers, spaces, commas, and slashes
        const validPattern = /^[a-zA-ZÀ-ỹ0-9\s,./-]+$/u;
        if (!validPattern.test(trimmedValue)) {
          return "Address can only contain letters (including Vietnamese), numbers, single spaces, commas (,), hyphens (-), and slashes (/)";
        }
        
        if (trimmedValue.length > 200) {
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
          toast.success("User updated successfully. Email notification has been sent.");
        } else {
          toast.success("User updated successfully");
        }
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

      router.refresh();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      dialog.closeAll();
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("Phone number already exists")) {
        toast.error("Phone number already exists in the system");
      } else {
        toast.error(
          `Failed to ${isUpdateMode ? "update" : "create"} user${
            !isUpdateMode ? ", please check if the email address has been used before." : "."
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <div>Name<span className="text-red-500">*</span></div>
          <Input
            id="name"
            {...form.getInputProps("name")}
            placeholder="John Doe"
            maxLength={50}
            disabled={isUpdateMode}
          />
          {form.errors.name && (
            <div className="text-sm text-red-600">{form.errors.name}</div>
          )}
        </div>

        <div className="grid gap-2">
          <div>Email<span className="text-red-500">*</span></div>
          <Input
            id="email"
            {...form.getInputProps("email")}
            placeholder="example@gmail.com"
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
            placeholder="0393270112"
          />
          {form.errors.phone && (
            <div className="text-sm text-red-600">{form.errors.phone}</div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...form.getInputProps("address")}
            placeholder="Enter address"
            className="resize-none"
          />
          {form.errors.address && (
            <div className="text-sm text-red-600">{form.errors.address}</div>
          )}
        </div>

        <div className="grid gap-2">
          <div>Role<span className="text-red-500">*</span></div>
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
