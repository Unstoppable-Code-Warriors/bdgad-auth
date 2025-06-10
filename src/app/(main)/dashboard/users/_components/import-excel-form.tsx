"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessDataExcel = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an Excel file before submitting.");
      return;
    }

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Validate worksheet exists
      const worksheetValidation = validateWorksheetExists(workbook, "table");
      if (!worksheetValidation.isValid) {
        toast.error(worksheetValidation.error!);
        return;
      }

      const worksheet = workbook.Sheets["table"];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Validate data is not empty
      const dataValidation = validateDataNotEmpty(jsonData);
      if (!dataValidation.isValid) {
        toast.error(dataValidation.error!);
        return;
      }

      // Validate columns
      const columnValidation = validateColumns(worksheet);
      if (!columnValidation.isValid) {
        toast.error(columnValidation.error!);
        return;
      }

      // Process and validate data
      const { processedData, validationErrors } = processExcelData(jsonData);

      // Show validation errors if any
      if (validationErrors.hasErrors) {
        const errorMessage = formatValidationErrors(validationErrors.errors);
        toast.error(errorMessage);
        return;
      }

      // Validate no data after processing
      const noDataValidation = validateNoDataAfterProcessing(processedData);
      if (!noDataValidation.isValid) {
        toast.error(noDataValidation.error!);
        return;
      }

      // Validate account limit
      const accountLimitValidation = validateAccountLimit(processedData);
      if (!accountLimitValidation.isValid) {
        toast.error(accountLimitValidation.error!);
        return;
      }

      // Validate emails don't exist in system
      const emailExistsValidation = validateEmailNotExistInSystem(
        processedData,
        users
      );
      if (!emailExistsValidation.isValid) {
        toast.error(emailExistsValidation.error!);
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
      await createUsers(processedData!);
      toast.success(
        `Excel file parsed successfully. ${
          processedData!.length
        } valid account(s) found.`
      );
      closeModal();
    } catch (err) {
      console.error("Error reading Excel file:", err);
      toast.error(
        "Failed to read Excel file. Please check if the file is corrupted or in correct format."
      );
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="excelFile">
          Upload Excel File
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="excelFile"
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
          <Button
            className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 cursor-pointer"
            type="button"
            variant="ghost"
            onClick={handleClear}
          >
            <X />
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {file && !error && (
          <p className="text-sm text-green-600">File selected: {file.name}</p>
        )}
      </div>
      <Button className="w-full cursor-pointer" type="submit" disabled={!file}>
        Submit
      </Button>
    </form>
  );
};

export default ImportExcelForm;
