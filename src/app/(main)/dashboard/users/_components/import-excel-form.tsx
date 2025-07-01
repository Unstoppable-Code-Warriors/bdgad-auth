"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner"; // Bạn có thể thay bằng 'react-hot-toast'
import { createUsers, GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import convertRawUsersToCreateUserInput from "@/lib/utils/convert-data";
import {
  validateWorksheetExists,
  validateDataNotEmpty,
  validateColumns,
  processExcelData,
  validateAccountLimit,
  validateNoDataAfterProcessing,
  validateEmailNotExistInSystem,
  formatValidationErrors,
} from "@/lib/utils/validate-data-excel";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface ImportExcelFormProps {
  closeModal: () => void;
  users: GetUsersResult["users"];
  roles: GetRolesResult["roles"];
}

const ImportExcelForm = ({
  closeModal,
  users,
  roles,
}: ImportExcelFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError(
        "Invalid file format. Please upload an Excel file (.xlsx or .xls)."
      );
      setFile(null);
    } else {
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setErrorText(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessDataExcel = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrorText(null);

    if (!file) {
      setErrorText("Please select an Excel file before submitting.");
      return;
    }

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Validate worksheet exists
      const worksheetValidation = validateWorksheetExists(workbook, "table");
      if (!worksheetValidation.isValid) {
        setErrorText(worksheetValidation.error!);
        return;
      }

      const worksheet = workbook.Sheets["table"];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Validate data is not empty
      const dataValidation = validateDataNotEmpty(jsonData);
      if (!dataValidation.isValid) {
        setErrorText(dataValidation.error!);
        return;
      }

      // Validate columns
      const columnValidation = validateColumns(worksheet);
      if (!columnValidation.isValid) {
        setErrorText(columnValidation.error!);
        return;
      }

      // Process and validate data
      const { processedData, validationErrors } = processExcelData(jsonData);

      // Show validation errors if any
      if (validationErrors.hasErrors) {
        const errorMessage = formatValidationErrors(validationErrors.errors);
        setErrorText(errorMessage);
        return;
      }

      // Validate no data after processing
      const noDataValidation = validateNoDataAfterProcessing(processedData);
      if (!noDataValidation.isValid) {
        setErrorText(noDataValidation.error!);
        return;
      }

      // Validate account limit
      const accountLimitValidation = validateAccountLimit(processedData);
      if (!accountLimitValidation.isValid) {
        setErrorText(accountLimitValidation.error!);
        return;
      }

      // Validate emails don't exist in system
      const emailExistsValidation = validateEmailNotExistInSystem(
        processedData,
        users
      );
      if (!emailExistsValidation.isValid) {
        setErrorText(emailExistsValidation.error!);
        return;
      }

      // Convert to CreateUserInput format
      const convertedUsers = convertRawUsersToCreateUserInput(
        processedData,
        roles
      );

      return convertedUsers;
    } catch (err) {
      console.error("Error reading Excel file:", err);
      setErrorText("Không thể đọc file Excel. Vui lòng kiểm tra xem file có bị sai hoặc không đúng định dạng không.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      const processedData = await handleProcessDataExcel(e);
      if (
        !processedData ||
        !Array.isArray(processedData) ||
        processedData.length === 0
      ) {
        return;
      }
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      closeModal();
      console.log("processedData from call apiii", processedData);
     
      await toast.promise(createUsers(processedData), {
        loading: "Đang tạo người dùng...",
        success: `Phân tích file Excel thành công. Tìm thấy ${processedData.length} tài khoản hợp lệ.`,
        error: (err) => {
          // Check if it's a duplicate email error
          if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint "users_email_unique"')) {
            return "Một hoặc nhiều địa chỉ email đã tồn tại trong hệ thống. Vui lòng kiểm tra dữ liệu của bạn và thử lại.";
          }
          return "Không thể tạo người dùng. Vui lòng thử lại.";
        },
      });
      // Invalidate and refetch users data
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      router.refresh();
    } catch (err) {
      setLoading(false);
      console.error("Error reading Excel file:", err);
      // Check if it's a duplicate email error
      if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint "users_email_unique"')) {
        toast.error("Một hoặc nhiều địa chỉ email đã tồn tại trong hệ thống. Vui lòng kiểm tra dữ liệu của bạn và thử lại.");
      } else {
        toast.error(
          "Không thể đọc file Excel. Vui lòng kiểm tra xem file có bị hỏng hoặc không đúng định dạng không."
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="excelFile">
          Tải lên file Excel
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="excelFile"
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={loading}
          />
          <Button
            className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 cursor-pointer"
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={loading}
          >
            <X />
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {errorText && <p className="text-sm text-red-500">{errorText}</p>}
        {file && !error && !errorText && (
          <p className="text-sm text-green-600">Đã chọn file: {file.name}</p>
        )}
      </div>
      <Button
        className="w-full cursor-pointer"
        type="submit"
        disabled={!file || loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gửi"}
      </Button>
    </form>
  );
};

export default ImportExcelForm;
