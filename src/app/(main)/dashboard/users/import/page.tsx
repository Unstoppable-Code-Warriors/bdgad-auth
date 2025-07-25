"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/actions/users";
import { getRoles } from "@/lib/actions/roles";
import { PreviewTable } from "../_components/preview-table";

export default function ImportUsersPage() {
  const router = useRouter();
  const downloadTemplateModal = () => {
    const link = document.createElement("a");
    link.href = "/templates/account_creation_template.xlsx";
    link.download = "account_creation_template.xlsx";
    link.click();
  };

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      getUsers({
        page: 1,
        search: "",
        limit: 1000,
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getRoles(),
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/users")}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách tài khoản
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Nhập Excel</h1>
        </div>

        <Button variant="outline" onClick={downloadTemplateModal}>
          <FileDown className="h-4 w-4 mr-2" />
          Tải xuống mẫu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản từ file excel</CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewTable
            users={usersData?.users || []}
            roles={rolesData?.roles || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
