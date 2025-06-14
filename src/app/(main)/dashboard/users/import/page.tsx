"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { ImportDataTable } from "../_components/import-data-table";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/actions/users";
import { getRoles } from "@/lib/actions/roles";

export default function ImportUsersPage() {
  const router = useRouter();
  const downloadTemplateModal = () => {
    const link = document.createElement("a");
    link.href = "/templates/account_creation_template.xlsx";
    link.download = "account_creation_template.xlsx";
    link.click();
  };

  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers({
        page: 1,
        search: "",
        limit: 1000
    }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getRoles(),
  });


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
     <div className="flex items-center gap-4">
     <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
   
        
        <h1 className="text-2xl font-bold">Import Excel</h1>

     </div>

        <Button variant="outline" onClick={downloadTemplateModal}>
        <FileDown className="h-4 w-4 mr-2" />
        Download Template
      </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create users from file excel</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportDataTable users={usersData?.users || []} roles={rolesData?.roles || []} />
        </CardContent>
      </Card>
    </div>
  );
} 