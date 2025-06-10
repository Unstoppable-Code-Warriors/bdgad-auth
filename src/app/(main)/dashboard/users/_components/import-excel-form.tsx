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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel file before submitting.");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const worksheet = workbook.Sheets["table"];

      if (!worksheet) {
        toast.error('Cannot find sheet named "table".');
        return;
      }

      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Kiểm tra file rỗng
      if (!jsonData || jsonData.length === 0) {
        toast.error("Excel file is empty or has no data rows.");
        return;
      }

      const expectedColumns = ["Email", "Name", "Role", "Phone", "Address"];
      const headerRow = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      })[0] as string[];
      const actualColumns = headerRow || [];

      // Kiểm tra thiếu cột bắt buộc
      const requiredColumns = ["Email", "Name", "Role"];
      const missingRequiredColumns = requiredColumns.filter(
        (col) => !actualColumns.includes(col)
      );

      if (missingRequiredColumns.length > 0) {
        toast.error(
          `Missing required column(s): ${missingRequiredColumns.join(", ")}`
        );
        return;
      }

      // Kiểm tra thiếu cột optional
      const missingOptionalColumns = expectedColumns.filter(
        (col) => !actualColumns.includes(col) && !requiredColumns.includes(col)
      );

      if (missingOptionalColumns.length > 0) {
        toast.error(`Missing column(s): ${missingOptionalColumns.join(", ")}`);
        return;
      }

      // Kiểm tra thừa cột
      const extraColumns = actualColumns.filter(
        (col) => !expectedColumns.includes(col)
      );

      if (extraColumns.length > 0) {
        toast.error(
          `Unexpected column(s) found: ${extraColumns.join(
            ", "
          )}. Only allowed columns: ${expectedColumns.join(", ")}`
        );
        return;
      }

      // Validation functions
      const validateName = (
        name: string
      ): { isValid: boolean; error?: string } => {
        if (!name || typeof name !== "string") {
          return { isValid: false, error: "Name is required and must be text" };
        }

        const trimmedName = name.trim();
        if (trimmedName.length < 3 || trimmedName.length > 50) {
          return {
            isValid: false,
            error: "Name must be between 3-50 characters",
          };
        }

        if (trimmedName.includes(" ")) {
          return { isValid: false, error: "Name cannot contain spaces" };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
          return {
            isValid: false,
            error: "Name can only contain letters, numbers, and underscores",
          };
        }

        return { isValid: true };
      };

      const validateEmail = (
        email: string
      ): { isValid: boolean; error?: string } => {
        if (!email || typeof email !== "string") {
          return { isValid: false, error: "Email is required" };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return { isValid: false, error: "Invalid email format" };
        }

        return { isValid: true };
      };

      const validateRole = (
        role: any
      ): { isValid: boolean; error?: string } => {
        if (role === null || role === undefined || role === "") {
          return { isValid: false, error: "Role is required" };
        }

        const roleNum = Number(role);
        if (
          isNaN(roleNum) ||
          !Number.isInteger(roleNum) ||
          roleNum < 1 ||
          roleNum > 5
        ) {
          return {
            isValid: false,
            error: "Role must be a number between 1 and 5",
          };
        }

        return { isValid: true };
      };

      // Process and validate data
      const processedData: any[] = [];
      const emails = new Set<string>();
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowIndex = i + 2; // +2 because Excel rows start at 1 and first row is header

        // Check for completely empty row
        const hasAnyData = Object.values(row).some(
          (value) => value !== null && value !== undefined && value !== ""
        );

        if (!hasAnyData) {
          continue; // Skip completely empty rows
        }

        const cleanedRow: Record<string, any> = {};

        // Validate Name
        const nameValidation = validateName(row.Name);
        if (!nameValidation.isValid) {
          errors.push(`Row ${rowIndex}: ${nameValidation.error}`);
          continue;
        }
        cleanedRow.Name = row.Name.trim();

        // Validate Email
        const emailValidation = validateEmail(row.Email);
        if (!emailValidation.isValid) {
          errors.push(`Row ${rowIndex}: ${emailValidation.error}`);
          continue;
        }
        const cleanEmail = row.Email.trim().toLowerCase();

        // Check for duplicate email
        if (emails.has(cleanEmail)) {
          errors.push(`Row ${rowIndex}: Email "${cleanEmail}" is duplicated`);
          continue;
        }
        emails.add(cleanEmail);
        cleanedRow.Email = cleanEmail;

        // Validate Role
        const roleValidation = validateRole(row.Role);
        if (!roleValidation.isValid) {
          errors.push(`Row ${rowIndex}: ${roleValidation.error}`);
          continue;
        }
        cleanedRow.Role = Number(row.Role);

        // Handle optional fields
        cleanedRow.Phone = row.Phone ? String(row.Phone).trim() : "";
        cleanedRow.Address = row.Address ? String(row.Address).trim() : "";

        processedData.push(cleanedRow);
      }

      // Show validation errors if any
      if (errors.length > 0) {
        const errorMessage = errors.slice(0, 5).join("\n"); // Show first 5 errors
        const remainingErrors =
          errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : "";
        toast.error(
          `Validation errors found:\n${errorMessage}${remainingErrors}`
        );
        return;
      }

      // Check if we have any valid data after processing
      if (processedData.length === 0) {
        toast.error(
          "No valid data found. Please check your Excel file format and content."
        );
        return;
      }

      // Check account limit (1-50)
      if (processedData.length > 50) {
        toast.error(
          `Too many accounts: ${processedData.length}. Maximum allowed is 50 accounts.`
        );
        return;
      }

      const duplicatedEmails = processedData.filter((item) =>
        users.some((user) => user.email === item.Email)
      );

      if (duplicatedEmails.length > 0) {
        toast.error("Email already exists in the system.");
        return;
      }

      const convertedUsers = convertRawUsersToCreateUserInput(
        processedData,
        roles
      );
      await createUsers(convertedUsers);
      toast.success(
        `Excel file parsed successfully. ${processedData.length} valid account(s) found.`
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
