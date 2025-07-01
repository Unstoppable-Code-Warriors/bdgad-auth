// utils/validate-data-excel.ts

import * as XLSX from "xlsx";
import { columnNames } from "../constants";
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
      error: `Không tìm thấy sheet có tên "${sheetName}". Vui lòng sử dụng template đúng.`,
    };
  }
  return { isValid: true };
};

export const validateDataNotEmpty = (jsonData: any[]): ValidationResult => {
  if (!jsonData || jsonData.length === 0) {
    return {
      isValid: false,
      error: "File Excel trống hoặc không có dữ liệu.",
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
    const missingColumns = missingRequiredColumns.map((col) => columnNames[col as keyof typeof columnNames]);
    return {
      isValid: false,
      error: `Thiếu cột bắt buộc: ${missingColumns.join(", ")}. Giá trị trong cột thiếu sẽ hiển thị là trống trong bảng dữ liệu đã nhập.`,
    };
  }

  // Check for extra columns
  const extraColumns = actualColumns.filter(
    (col) => !EXPECTED_COLUMNS.includes(col)
  );

  if (extraColumns.length > 0) {
    return{
      isValid: false,
      error: `Cột thừa: ${extraColumns.join(", ")}. Các cột này sẽ bị bỏ qua.`,
    }
  }

  // Check for duplicate columns
  const duplicateColumns = actualColumns.filter(
    (col, index) => actualColumns.indexOf(col) !== index
  );
  if (duplicateColumns.length > 0) {
    const duplicateColumnsNames = duplicateColumns.map((col) => columnNames[col as keyof typeof columnNames]);
    return {
      isValid: false,
      error: `Cột trùng lặp: ${duplicateColumnsNames.join(", ")}. Hệ thống sẽ lấy giá trị của cột xuất hiện đầu tiên.`,
    };
  }


  return { isValid: true };
};

// Field validation functions
export const validateName = (name: string): ValidationResult => {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Tên là bắt buộc và phải là văn bản" };
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 3 || trimmedName.length > 50) {
    return {
      isValid: false,
      error: "Tên phải có từ 3-50 ký tự",
    };
  }
  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    return { isValid: false, error: "Tên không được chứa nhiều khoảng trắng liên tiếp" };
  }
  // Allow only letters (including Vietnamese) and single spaces
  if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/.test(trimmedName)) {
    return {
      isValid: false,
      error: "Tên chỉ được chứa chữ cái (bao gồm tiếng Việt) và khoảng trắng giữa các từ",
    };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email là bắt buộc" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "Định dạng email không hợp lệ" };
  }
  return { isValid: true };
};

export const validateRole = (role: any): ValidationResult => {
  if (role === null || role === undefined || role === "") {
    return { isValid: false, error: "Vai trò là bắt buộc" };
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
      error: "Vai trò phải là một số từ 1 đến 5",
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
      error: "Số điện thoại phải có đúng 10 chữ số",
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
      error: "Địa chỉ không được vượt quá 200 ký tự",
    };
  }
  
  // Allow letters, numbers, spaces, and specific special characters
  if (!/^[a-zA-ZÀ-ỹ0-9\s\(\)\|\/\-\,\.]+$/.test(addressStr)) {
    return {
      isValid: false,
      error: "Địa chỉ chỉ được chứa chữ cái (bao gồm tiếng Việt), số, khoảng trắng và các ký tự đặc biệt sau: ( ) | / - , .",
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

    // Skip rows where all fields are empty strings and Role is 0
    const isAllFieldsEmpty = !cleanedRow.Name && !cleanedRow.Email && !cleanedRow.Phone && !cleanedRow.Address;
    const isRoleZero = cleanedRow.Role === 0;
    
    if (isAllFieldsEmpty && isRoleZero) {
      continue;
    }

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
      error: `Quá nhiều tài khoản: ${processedData.length}. Số tài khoản tối đa cho phép là ${MAX_ACCOUNTS_LIMIT}.`,
    };
  }
  return { isValid: true };
};

export const validateDuplicateEmail = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  const emailMap = new Map<string, number[]>();
  const duplicatedRows: number[] = [];

  // Track row numbers for each email
  processedData.forEach((item, index) => {
    const rowNumber = index + 1; // +1 because first row is header
    const existingRows = emailMap.get(item.Email) || [];
    emailMap.set(item.Email, [...existingRows, rowNumber]);
  });

  // Find all rows with duplicates
  emailMap.forEach((rows, email) => {
    if (rows.length > 1) {
      duplicatedRows.push(...rows);
    }
  });

  if (duplicatedRows.length > 0) {
    return {
      isValid: false,
      error: `Email trùng lặp trong các dòng: ${duplicatedRows.sort((a, b) => a - b).join(", ")}`,
    };
  }
  return { isValid: true };
};

export const validateDuplicatePhone = (
  processedData: ProcessedRowData[]
): ValidationResult => {
  const phoneMap = new Map<string, number[]>();
  const duplicatedRows: number[] = [];

  processedData.forEach((item, index) => {
    // Skip empty phone numbers
    const phoneStr = item.Phone ? String(item.Phone) : "";
    if (!phoneStr || phoneStr.trim() === "") return;
    
    const rowNumber = index + 1; // +1 because first row is header
    const existingRows = phoneMap.get(phoneStr) || [];
    phoneMap.set(phoneStr, [...existingRows, rowNumber]);
  });

  // Find all rows with duplicates
  phoneMap.forEach((rows, phone) => {
    if (rows.length > 1) {
      duplicatedRows.push(...rows);
    }
  });

  if (duplicatedRows.length > 0) {
    return {
      isValid: false,
      error: `Số điện thoại trùng lặp trong các dòng: ${duplicatedRows.sort((a, b) => a - b).join(", ")}`,
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
        "Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra định dạng và nội dung của file Excel.",
    };
  }
  return { isValid: true };
};

export const validateEmailNotExistInSystem = (
  processedData: ProcessedRowData[],
  existingUsers: Array<{ email: string }>
): ValidationResult => {
  const duplicatedRows: number[] = [];
  
  processedData.forEach((item, index) => {
    const rowNumber = index + 1; // +1 because first row is header
    if (existingUsers.some((user) => user.email === item.Email)) {
      duplicatedRows.push(rowNumber);
    }
  });

  if (duplicatedRows.length > 0) {
    return {
      isValid: false,
      error: `Các email sau đã tồn tại trong hệ thống (dòng: ${duplicatedRows.sort((a, b) => a - b).join(", ")})`,
    };
  }
  return { isValid: true };
};

export const validatePhoneNotExistInSystem = (
  processedData: ProcessedRowData[],
  existingUsers: Array<{ metadata: unknown }>
): ValidationResult => {
  const duplicatedRows: number[] = [];

  processedData.forEach((item, index) => {
    if (!item.Phone) return; // Skip if no phone number
    
    const rowNumber = index + 1; // +1 because first row is header
    if (existingUsers.some((user) => {
      const metadata = user.metadata as Record<string, any>;
      return metadata?.phone === item.Phone;
    })) {
      duplicatedRows.push(rowNumber);
    }
  });

  if (duplicatedRows.length > 0) {
    return {
      isValid: false,
      error: `Các số điện thoại sau đã tồn tại trong hệ thống (dòng: ${duplicatedRows.sort((a, b) => a - b).join(", ")})`,
    };
  }
  return { isValid: true };
};

// Utility functions
export const formatValidationErrors = (errors: string[]): string => {
  const errorMessage = errors.slice(0, 5).join("\n"); // Show first 5 errors
  const remainingErrors =
    errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : "";
  return `Lỗi kiểm tra dữ liệu:\n${errorMessage}${remainingErrors}`;
};

export const validateRoleExcel = (jsonData: any[]): ValidationResult => {
  const invalidRoles: { row: number; value: any }[] = [];

  jsonData.forEach((row, index) => {
    const roleValue = row.Role;
    const roleNum = Number(roleValue);

    // Skip empty rows
    if (!roleValue && !row.Name && !row.Email && !row.Phone && !row.Address) {
      return;
    }

    if (
      roleValue === null ||
      roleValue === undefined ||
      roleValue === "" ||
      isNaN(roleNum) ||
      !Number.isInteger(roleNum) ||
      roleNum < 1 ||
      roleNum > 5
    ) {
      invalidRoles.push({ row: index + 2, value: roleValue }); // +2 because Excel rows start at 1 and first row is header
    }
  });

  if (invalidRoles.length > 0) {
    return {
      isValid: false,
      error: `Vai trò phải là một số từ 1 đến 5.`,
    };
  }

  return { isValid: true };
};