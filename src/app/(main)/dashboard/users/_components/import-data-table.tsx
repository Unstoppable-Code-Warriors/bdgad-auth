"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createUsers, GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Plus, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import convertRawUsersToCreateUserInput from "@/lib/utils/convert-data";
import {
  validateWorksheetExists,
  validateDataNotEmpty,
  validateColumns,
  processExcelData,
  validateAccountLimit,
  validateEmailNotExistInSystem,
  validateDuplicateEmail,
  validatePhoneNotExistInSystem,
} from "@/lib/utils/validate-data-excel";

interface ImportedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  roleId: number;
  errors?: {
    [key: string]: string;
  };
}

interface ImportDataTableProps {
  users: GetUsersResult["users"];
  roles?: GetRolesResult["roles"];
}

export function ImportDataTable({ roles, users }: ImportDataTableProps) {
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveValidationErrors, setSaveValidationErrors] = useState<string[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const processExcelFile = async (file: File) => {
    try {
      setIsUploading(true);
      setValidationError(null);
      setSaveValidationErrors([]); // Reset save validation errors
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Validate worksheet exists
      const worksheetValidation = validateWorksheetExists(workbook, "table");
      if (!worksheetValidation.isValid) {
        setValidationError(worksheetValidation.error!);
        return;
      }

      const worksheet = workbook.Sheets["table"];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      console.log("jsonData", jsonData);
      // Validate data is not empty
      const dataValidation = validateDataNotEmpty(jsonData);
      if (!dataValidation.isValid) {
        setValidationError(dataValidation.error!);
        return;
      }

 // Validate columns
 const columnValidation = validateColumns(worksheet);
 if (!columnValidation.isValid) {
  setValidationError(columnValidation.error!);
   return;
 }
      // Process and validate data
      const { processedData } = processExcelData(jsonData);

// Validate account limit
const accountLimitValidation = validateAccountLimit(processedData);
if (!accountLimitValidation.isValid) {
  setValidationError(accountLimitValidation.error!);
}

// Validate duplicate emails
const duplicateEmailValidation = validateDuplicateEmail(processedData);
if (!duplicateEmailValidation.isValid) {
  setValidationError(duplicateEmailValidation.error!);
}

// Validate emails don't exist in system
const emailExistsValidation = validateEmailNotExistInSystem(
  processedData,
  users
);
if (!emailExistsValidation.isValid) {
  setValidationError(emailExistsValidation.error!);
}

// Validate phones don't exist in system
const phoneExistsValidation = validatePhoneNotExistInSystem(
  processedData,
  users
);
if (!phoneExistsValidation.isValid) {
  setValidationError(phoneExistsValidation.error!);
}

      console.log("processedData", processedData);  
      // Convert to ImportedUser format for table display
      const convertedUsers: ImportedUser[] = processedData.map((row: any, index: number) => ({
        id: `temp-${index}`,
        name: row.Name || "",
        email: row.Email || "",
        phone: row.Phone || "",
        address: row.Address || "",
        roleId: parseInt(row.Role) || 0,
        errors: validateRow(row, index + 1),
      }));

      setImportedUsers(convertedUsers);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      setValidationError("Failed to process Excel file. Please check the file format.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    processExcelFile(file);
  }, [users]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const validateRow = (row: any, rowIndex: number) => {
    const errors: { [key: string]: string } = {};
    const hasAnyData = Object.values(row).some(value => value && value.toString().trim() !== "");

    // Only validate if there's any data in the row
    if (!hasAnyData) {
      return undefined;
    }

    // Name validation
    if (!row.Name?.trim()) {
      errors.name = "Name is required";
    } else {
      const trimmedName = row.Name.trim();
      if (trimmedName.length < 3 || trimmedName.length > 50) {
        errors.name = "Name must be between 3-50 characters";
      }
      // Check for multiple consecutive spaces
      if (/\s{2,}/.test(trimmedName)) {
        errors.name = "Name cannot contain multiple consecutive spaces";
      }
      // Allow only letters (including Vietnamese) and single spaces
      if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/.test(trimmedName)) {
        errors.name = "Name can only contain letters (including Vietnamese) and single spaces between words";
      }
    }

    // Email validation
    if (!row.Email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+$/.test(row.Email.trim())) {
      errors.email = "Invalid email format";
    }

    // Phone validation (optional)
    if (row.Phone) {
      const phone = String(row.Phone).trim();
      if (!/^\d+$/.test(phone)) {
        errors.phone = "Phone must contain only digits";
      } else if (phone.length !== 10) {
        errors.phone = "Phone must be exactly 10 digits";
      }
    }

    // Address validation (optional)
    if (row.Address?.trim()) {
      const address = row.Address.trim();
      if (address.length > 200) {
        errors.address = "Address must be 200 characters or less";
      }
      // Check for multiple consecutive spaces
      if (/\s{2,}/.test(address)) {
        errors.address = "Address cannot contain multiple consecutive spaces";
      }
      // Check for allowed characters
      if (!/^[a-zA-ZÀ-ỹ0-9\s,\.\/]+$/.test(address)) {
        errors.address = "Address can only contain letters (including Vietnamese), numbers, spaces, and the following special characters: , . /";
      }
    }

    // Role validation
    if (!row.Role) {
      errors.roleId = "Role is required";
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  };

  const handleCellChange = (userId: string, field: string, value: string | number) => {
    setImportedUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          // Create a row object with the correct capitalized field names
          const row = {
            Name: field === 'name' ? value : user.name,
            Email: field === 'email' ? value : user.email,
            Phone: field === 'phone' ? value : user.phone,
            Address: field === 'address' ? value : user.address,
            Role: field === 'roleId' ? value : user.roleId,
          };
          
          // Only validate the changed field
          const errors = user.errors ? { ...user.errors } : {};
          const fieldErrors = validateRow(row, 0);
          
          // Clear error for the changed field
          if (field === 'name') delete errors.name;
          if (field === 'email') delete errors.email;
          if (field === 'phone') delete errors.phone;
          if (field === 'address') delete errors.address;
          if (field === 'roleId') delete errors.roleId;

          // Add new errors if validation fails
          if (fieldErrors) {
            if (field === 'name' && fieldErrors.name) errors.name = fieldErrors.name;
            if (field === 'email' && fieldErrors.email) errors.email = fieldErrors.email;
            if (field === 'phone' && fieldErrors.phone) errors.phone = fieldErrors.phone;
            if (field === 'address' && fieldErrors.address) errors.address = fieldErrors.address;
            if (field === 'roleId' && fieldErrors.roleId) errors.roleId = fieldErrors.roleId;
          }

          return { 
            ...user, 
            [field]: value, 
            errors: Object.keys(errors).length > 0 ? errors : undefined 
          };
        }
        return user;
      })
    );
  };

  const addNewRow = () => {
    const newUser: ImportedUser = {
      id: `temp-${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      address: "",
      roleId: 0,
      errors: undefined, // Don't show validation errors for an empty row
    };
    setImportedUsers((prev) => [...prev, newUser]);
  };

  const removeRow = (userId: string) => {
    setImportedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleSave = async () => {
    setSaveValidationErrors([]); // Clear previous errors
    const errors: string[] = [];

    // Filter out rows that have any validation errors
    const validUsers = importedUsers.filter((user) => !user.errors);
    
    // Check if there are any valid users to import
    if (validUsers.length === 0) {
      errors.push("No valid users to import");
    }

    // Check for empty rows (rows with no data)
    const emptyRows = validUsers.filter(user => 
      !user.name.trim() && 
      !user.email.trim() && 
      !user.phone.trim() && 
      !user.address.trim() && 
      !user.roleId
    );
    if (emptyRows.length > 0) {
      errors.push("Please remove empty rows before importing");
    }

    // Check account limit
    if (validUsers.length > 50) {
      errors.push("Cannot import more than 50 accounts at once");
    }

    // Check for duplicate emails within the import
    const emailSet = new Set<string>();
    const duplicateEmails = validUsers.filter(user => {
      if (emailSet.has(user.email)) {
        return true;
      }
      emailSet.add(user.email);
      return false;
    });
    if (duplicateEmails.length > 0) {
      errors.push(`Duplicate emails found: ${duplicateEmails.map(u => u.email).join(", ")}`);
    }

    // Check if emails already exist in the system
    const existingEmailSet = new Set<string>();
    const existingEmails = validUsers.filter(user => {
      const exists = users.some(existingUser => existingUser.email === user.email);
      if (exists && !existingEmailSet.has(user.email)) {
        existingEmailSet.add(user.email);
        return true;
      }
      return false;
    });
    if (existingEmails.length > 0) {
      errors.push(`The following emails already exist in the system: ${Array.from(existingEmailSet).join(", ")}`);
    }

    // If there are any validation errors, display them and return
    if (errors.length > 0) {
      setSaveValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      // Convert ImportedUser to RawUserData format
      const rawUsers = validUsers.map(user => ({
        Name: user.name,
        Email: user.email,
        Role: user.roleId,
        Phone: user.phone,
        Address: user.address,
      }));

      // Convert to CreateUserInput format
      const convertedUsers = convertRawUsersToCreateUserInput(rawUsers, roles || []);

      await toast.promise(createUsers(convertedUsers), {
        loading: "Creating users...",
        success: `Successfully imported ${validUsers.length} user(s)`,
        error: (err) => {
          if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint "users_email_unique"')) {
            return "One or more email addresses already exist in the system. Please check your data and try again.";
          }
          return "Failed to create users. Please try again.";
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      router.refresh();
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Failed to import users");
    } finally {
      setIsLoading(false);
    }
  };


  const handleClearTable = () => {
    setImportedUsers([]);
    setValidationError(null);
    setSaveValidationErrors([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Processing Excel file...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragActive
                ? "Drop the Excel file here"
                : "Drag and drop an Excel file here, or click to select"}
            </p>
          </>
        )}
      </div>

      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      {importedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Preview Data</h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewRow}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearTable}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Table
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || importedUsers.some((user) => user.errors)}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create users"
                )}
              </Button>
            </div>
          </div>

          {saveValidationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
              {saveValidationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[300px]">Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={user.name}
                          onChange={(e) =>
                            handleCellChange(user.id, "name", e.target.value)
                          }
                          className={user.errors?.name ? "border-red-500" : ""}
                          disabled={isLoading}
                        />
                        {user.errors?.name && (
                          <div className="text-sm text-red-500 max-w-[300px]">
                          <p className="whitespace-normal break-words">{user.errors.name}</p>
                        </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={user.email}
                          onChange={(e) =>
                            handleCellChange(user.id, "email", e.target.value)
                          }
                          className={user.errors?.email ? "border-red-500" : ""}
                          disabled={isLoading}
                        />
                        {user.errors?.email && (
                          <p className="text-sm text-red-500 break-words">
                            {user.errors.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={user.phone}
                          onChange={(e) =>
                            handleCellChange(user.id, "phone", e.target.value)
                          }
                          className={user.errors?.phone ? "border-red-500" : ""}
                          disabled={isLoading}
                        />
                        {user.errors?.phone && (
                          <p className="text-sm text-red-500 break-words">
                            {user.errors.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Textarea
                          value={user.address}
                          onChange={(e) =>
                            handleCellChange(user.id, "address", e.target.value)
                          }
                          className={user.errors?.address ? "border-red-500 resize-none" : "resize-none"}
                          disabled={isLoading}
                          rows={2}
                        />
                        {user.errors?.address && (
                          <div className="text-sm text-red-500 max-w-[300px]">
                            <p className="whitespace-normal break-words">{user.errors.address}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Select
                          value={user.roleId.toString()}
                          onValueChange={(value) =>
                            handleCellChange(user.id, "roleId", parseInt(value))
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            className={user.errors?.roleId ? "border-red-500" : ""}
                          >
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id?.toString() || ""}
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {user.errors?.roleId && (
                          <p className="text-sm text-red-500 break-words">
                            {user.errors.roleId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(user.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
} 