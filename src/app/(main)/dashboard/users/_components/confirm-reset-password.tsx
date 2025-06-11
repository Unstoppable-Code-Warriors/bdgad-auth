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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: row.original.email,
          redirectUrl: `${window.location.origin}/reset-password`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset email has been sent to the user.");
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p>
        Are you sure you want to reset the password for{" "}
        <span className="font-semibold">{row.original.name}</span>? A password
        reset link will be sent to their email address.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => closeModal()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={handleResetPassword} disabled={isLoading}>
          {isLoading ? "Sending..." : "Reset Password"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmResetPassword; 