// utils/validate-data-excel.ts

import * as XLSX from "xlsx";

// Types
export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export type ProcessedRowData = {
  Name: string;
  Email: string;
  Role: number;
  Phone: string;
  Address: string;
};

export type ValidationErrors = {
  errors: string[];
  hasErrors: boolean;
};

// Constants
export const EXPECTED_COLUMNS = ["Email", "Name", "Role", "Phone", "Address"];
export const REQUIRED_COLUMNS = ["Email", "Name", "Role"];
export const MAX_ACCOUNTS_LIMIT = 50;

// Worksheet validation functions
export const validateWorksheetExists = (
  workbook: XLSX.WorkBook,
  sheetName: string = "table"
): ValidationResult => {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return {
      isValid: false,
      error: `Cannot find sheet named "${sheetName}".`,
    };
  }
  return { isValid: true };
};

export const validateDataNotEmpty = (jsonData: any[]): ValidationResult => {
  if (!jsonData || jsonData.length === 0) {
    return {
      isValid: false,
      error: "Excel file is empty or has no data rows.",
    };
  }
  return { isValid: true };
};

// Column validation functions
export const validateColumns = (
  worksheet: XLSX.WorkSheet
): ValidationResult => {
  const headerRow = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
  })[0] as string[];
  const actualColumns = headerRow || [];

  // Check missing required columns
  const missingRequiredColumns = REQUIRED_COLUMNS.filter(
    (col) => !actualColumns.includes(col)
  );
  if (missingRequiredColumns.length > 0) {
    return {
      isValid: false,
      error: `Missing required column(s): ${missingRequiredColumns.join(", ")}`,
    };
  }

  // Check missing optional columns
  const missingOptionalColumns = EXPECTED_COLUMNS.filter(
    (col) => !actualColumns.includes(col) && !REQUIRED_COLUMNS.includes(col)
  );
  if (missingOptionalColumns.length > 0) {
    return {
      isValid: false,
      error: `Missing column(s): ${missingOptionalColumns.join(", ")}`,
    };
  }

  // Check extra columns
  const extraColumns = actualColumns.filter(
    (col) => !EXPECTED_COLUMNS.includes(col)
  );
  if (extraColumns.length > 0) {
    return {
      isValid: false,
      error: `Unexpected column(s) found: ${extraColumns.join(
        ", "
      )}. Only allowed columns: ${EXPECTED_COLUMNS.join(", ")}`,
    };
  }

  return { isValid: true };
};

// Field validation functions
export const validateName = (name: string): ValidationResult => {
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

export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "Invalid email format" };
  }
  return { isValid: true };
};

export const validateRole = (role: any): ValidationResult => {
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

// Row validation functions
export const validateRow = (
  row: any,
  rowIndex: number
): {
  isValid: boolean;
  cleanedRow?: ProcessedRowData;
  error?: string;
} => {
  // Check for completely empty row
  const hasAnyData = Object.values(row).some(
    (value) => value !== null && value !== undefined && value !== ""
  );
  if (!hasAnyData) {
    return { isValid: false }; // Skip completely empty rows
  }

  const cleanedRow: Partial<ProcessedRowData> = {};

  // Validate Name
  const nameValidation = validateName(row.Name);
  if (!nameValidation.isValid) {
    return {
      isValid: false,
      error: `Row ${rowIndex}: ${nameValidation.error}`,
    };
  }
  cleanedRow.Name = row.Name.trim();

  // Validate Email
  const emailValidation = validateEmail(row.Email);
  if (!emailValidation.isValid) {
    return {
      isValid: false,
      error: `Row ${rowIndex}: ${emailValidation.error}`,
    };
  }
  cleanedRow.Email = row.Email.trim().toLowerCase();

  // Validate Role
  const roleValidation = validateRole(row.Role);
  if (!roleValidation.isValid) {
    return {
      isValid: false,
      error: `Row ${rowIndex}: ${roleValidation.error}`,
    };
  }
  cleanedRow.Role = Number(row.Role);

  // Handle optional fields
  cleanedRow.Phone = row.Phone ? String(row.Phone).trim() : "";
  cleanedRow.Address = row.Address ? String(row.Address).trim() : "";

  return {
    isValid: true,
    cleanedRow: cleanedRow as ProcessedRowData,
  };
};

// Data processing functions
export const processExcelData = (
  jsonData: any[]
): {
  processedData: ProcessedRowData[];
  validationErrors: ValidationErrors;
} => {
  const processedData: ProcessedRowData[] = [];
  const emails = new Set<string>();
  const errors: string[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowIndex = i + 2; // +2 because Excel rows start at 1 and first row is header

    const rowValidation = validateRow(row, rowIndex);

    if (!rowValidation.isValid) {
      if (rowValidation.error) {
        errors.push(rowValidation.error);
      }
      continue;
    }

    const cleanedRow = rowValidation.cleanedRow!;

    // Check for duplicate email within the file
    if (emails.has(cleanedRow.Email)) {
      errors.push(`Row ${rowIndex}: Email "${cleanedRow.Email}" is duplicated`);
      continue;
    }
    emails.add(cleanedRow.Email);

    processedData.push(cleanedRow);
  }

  return {
    processedData,
    validationErrors: {
      errors,
      hasErrors: errors.length > 0,
    },
  };
};

// Business logic validation functions
export const validateAccountLimit = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  if (processedData.length > MAX_ACCOUNTS_LIMIT) {
    return {
      isValid: false,
      error: `Too many accounts: ${processedData.length}. Maximum allowed is ${MAX_ACCOUNTS_LIMIT} accounts.`,
    };
  }
  return { isValid: true };
};

export const validateNoDataAfterProcessing = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  if (processedData.length === 0) {
    return {
      isValid: false,
      error:
        "No valid data found. Please check your Excel file format and content.",
    };
  }
  return { isValid: true };
};

export const validateEmailNotExistInSystem = (
  processedData: ProcessedRowData[],
  existingUsers: Array<{ email: string }>
): ValidationResult => {
  const duplicatedEmails = processedData.filter((item) =>
    existingUsers.some((user) => user.email === item.Email)
  );
  if (duplicatedEmails.length > 0) {
    return {
      isValid: false,
      error: "Email already exists in the system.",
    };
  }
  return { isValid: true };
};

// Utility functions
export const formatValidationErrors = (errors: string[]): string => {
  const errorMessage = errors.slice(0, 5).join("\n"); // Show first 5 errors
  const remainingErrors =
    errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : "";
  return `Validation errors found:\n${errorMessage}${remainingErrors}`;
};
