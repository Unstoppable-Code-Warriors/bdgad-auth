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
export const TEMPLATE_SHEET_NAME = "table";

// Worksheet validation functions
export const validateWorksheetExists = (
  workbook: XLSX.WorkBook,
  sheetName: string = TEMPLATE_SHEET_NAME
): ValidationResult => {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return {
      isValid: false,
      error: `Cannot find sheet named "${sheetName}". Please use the correct template.`,
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
    range: 0, // Only read the first row
  })[0] as string[];
  const actualColumns = headerRow || [];


  // Check missing required columns
  const missingRequiredColumns = EXPECTED_COLUMNS.filter(
    (col) => !actualColumns.includes(col)
  );
  if (missingRequiredColumns.length > 0) {
    return {
      isValid: false,
      error: `Missing required column(s): ${missingRequiredColumns.join(", ")}. The value in the missing column will appear as empty in the preview data table.`,
    };
  }

  // Check for extra columns
  const extraColumns = actualColumns.filter(
    (col) => !EXPECTED_COLUMNS.includes(col)
  );

  if (extraColumns.length > 0) {
    return{
      isValid: false,
      error: `Extra column(s) found: ${extraColumns.join(", ")}. These columns will be ignored.`,
    }
  }

  // Check if required columns are in correct order (A to E)
  const firstFiveColumns = actualColumns.slice(0, 5);
  const hasAllRequiredColumns = EXPECTED_COLUMNS.every(col => 
    firstFiveColumns.includes(col)
  );
  if (!hasAllRequiredColumns) {
    return {
      isValid: false,
      error: `Required columns must be in the first 5 columns (A to E) of the template.`,
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
  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    return { isValid: false, error: "Name cannot contain multiple consecutive spaces" };
  }
  // Allow only letters (including Vietnamese) and single spaces
  if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/.test(trimmedName)) {
    return {
      isValid: false,
      error: "Name can only contain letters (including Vietnamese) and single spaces between words",
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

export const validatePhone = (phone: string): ValidationResult => {
  // Phone is optional
  if (!phone) {
    return { isValid: true };
  }
  
  const phoneStr = String(phone).trim();
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(phoneStr)) {
    return {
      isValid: false,
      error: "Phone number must be exactly 10 digits",
    };
  }
  return { isValid: true };
};

export const validateAddress = (address: string): ValidationResult => {
  // Address is optional
  if (!address) {
    return { isValid: true };
  }
  
  const addressStr = String(address).trim();
  if (addressStr.length > 200) {
    return {
      isValid: false,
      error: "Address must not exceed 200 characters",
    };
  }
  
  // Allow letters, numbers, spaces, and specific special characters
  if (!/^[a-zA-ZÀ-ỹ0-9\s\(\)\|\/\-\,\.]+$/.test(addressStr)) {
    return {
      isValid: false,
      error: "Address can only contain letters (including Vietnamese), numbers, spaces, and the following special characters: ( ) | / - , .",
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

  // Validate Phone
  const phoneValidation = validatePhone(row.Phone);
  if (!phoneValidation.isValid) {
    return {
      isValid: false,
      error: `Row ${rowIndex}: ${phoneValidation.error}`,
    };
  }
  cleanedRow.Phone = row.Phone ? String(row.Phone).trim() : "";

  // Validate Address
  const addressValidation = validateAddress(row.Address);
  if (!addressValidation.isValid) {
    return {
      isValid: false,
      error: `Row ${rowIndex}: ${addressValidation.error}`,
    };
  }
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

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowIndex = i + 2; // +2 because Excel rows start at 1 and first row is header

    // Ensure all expected columns exist in the row, even if they're empty
    const cleanedRow: ProcessedRowData = {
      Name: row.Name || "",
      Email: row.Email || "",
      Role: Number(row.Role) || 0,
      Phone: row.Phone || "",
      Address: row.Address || "",
    };

    processedData.push(cleanedRow);
  }

  return {
    processedData,
    validationErrors: {
      errors: [],
      hasErrors: false,
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

export const validateDuplicateEmail = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  const emailCount = new Map<string, number>();
  const duplicatedEmails = new Set<string>();

  // Count occurrences of each email
  processedData.forEach((item) => {
    const count = emailCount.get(item.Email) || 0;
    emailCount.set(item.Email, count + 1);
    if (count > 0) {
      duplicatedEmails.add(item.Email);
    }
  });

  if (duplicatedEmails.size > 0) {
    return {
      isValid: false,
      error: `The duplicate email(s) are: ${Array.from(duplicatedEmails).join(", ")}`,
    };
  }
  return { isValid: true };
};


export const validateDuplicatePhone = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  const phoneCount = new Map<string, number>();
  const duplicatedPhones = new Set<string>();

  processedData.forEach((item) => {
    const count = phoneCount.get(item.Phone) || 0;
    phoneCount.set(item.Phone, count + 1);
    if (count > 0) {
      duplicatedPhones.add(item.Phone);
    }
  });

  if (duplicatedPhones.size > 0) {
    return {
      isValid: false,
      error: `The duplicate phone number(s) are: ${Array.from(duplicatedPhones).join(", ")}`,
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
    const duplicateEmailList = duplicatedEmails.map(item => item.Email).join(", ");
    return {
      isValid: false,
      error: `The following email(s) already exist in the system: ${duplicateEmailList}`,
    };
  }
  return { isValid: true };
};

export const validatePhoneNotExistInSystem = (
  processedData: ProcessedRowData[],
  existingUsers: Array<{ metadata: unknown }>
): ValidationResult => {
  const duplicatedPhones = processedData.filter((item) => {
    if (!item.Phone) return false; // Skip if no phone number
    return existingUsers.some((user) => {
      const metadata = user.metadata as Record<string, any>;
      return metadata?.phone === item.Phone;
    });
  });

  if (duplicatedPhones.length > 0) {
    const duplicatePhoneList = duplicatedPhones.map(item => item.Phone).join(", ");
    return {
      isValid: false,
      error: `The following phone number(s) already exist in the system: ${duplicatePhoneList}`,
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
