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
import { createUsers, GetUsersResult } from "@/lib/actions/users";
import { GetRolesResult } from "@/lib/actions/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Plus, Trash2, Upload, Check } from "lucide-react";
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
  validateDuplicatePhone,
  validatePhoneNotExistInSystem,
  validateRoleExcel,
} from "@/lib/utils/validate-data-excel";
import { useQueryClient } from "@tanstack/react-query";
import { userRole } from "@/lib/constants";
import { phoneError } from "@/lib/utils/messageErrors";

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

interface PreviewTableProps {
  users: GetUsersResult["users"];
  roles?: GetRolesResult["roles"];
}

export function PreviewTable({ roles, users }: PreviewTableProps) {
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const processExcelFile = async (file: File) => {
    try {
      setIsUploading(true);
      setValidationError([]);
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Validate worksheet exists
      const worksheetValidation = validateWorksheetExists(workbook, "table");
      if (!worksheetValidation.isValid) {
        setValidationError((prev) => [...prev, worksheetValidation.error!]);
        return;
      }

      const worksheet = workbook.Sheets["table"];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      console.log("jsonData", jsonData);
      // Validate data is not empty
      const dataValidation = validateDataNotEmpty(jsonData);
      if (!dataValidation.isValid) {
        setValidationError((prev) => [...prev, dataValidation.error!]);
        return;
      }

      // Validate columns
      const columnValidation = validateColumns(worksheet);
      if (!columnValidation.isValid) {
        setValidationError((prev) => [...prev, columnValidation.error!]);
      }

      // Validate role
      const roleValidation = validateRoleExcel(jsonData);
      if (!roleValidation.isValid) {
        setValidationError((prev) => [...prev, roleValidation.error!]);
      }

      // Process and validate data
      const { processedData } = processExcelData(jsonData);

      console.log("processedData", processedData);
      // Validate account limit
      const accountLimitValidation = validateAccountLimit(processedData);
      if (!accountLimitValidation.isValid) {
        setValidationError((prev) => [...prev, accountLimitValidation.error!]);
      }

      // Validate duplicate emails
      const duplicateEmailValidation = validateDuplicateEmail(processedData);
      if (!duplicateEmailValidation.isValid) {
        setValidationError((prev) => [
          ...prev,
          duplicateEmailValidation.error!,
        ]);
      }

      // Validate duplicate phones
      const duplicatePhoneValidation = validateDuplicatePhone(processedData);
      if (!duplicatePhoneValidation.isValid) {
        setValidationError((prev) => [
          ...prev,
          duplicatePhoneValidation.error!,
        ]);
      }

      // Validate emails don't exist in system
      const emailExistsValidation = validateEmailNotExistInSystem(
        processedData,
        users
      );
      if (!emailExistsValidation.isValid) {
        setValidationError((prev) => [...prev, emailExistsValidation.error!]);
      }

      // Validate phones don't exist in system
      const phoneExistsValidation = validatePhoneNotExistInSystem(
        processedData,
        users
      );
      if (!phoneExistsValidation.isValid) {
        setValidationError((prev) => [...prev, phoneExistsValidation.error!]);
      }

      // Convert to ImportedUser format for table display
      const convertedUsers: ImportedUser[] = processedData.map(
        (row: any, index: number) => ({
          id: `temp-${index}`,
          name: row.Name || "",
          email: row.Email || "",
          phone: row.Phone || "",
          address: row.Address || "",
          roleId: parseInt(row.Role) || 0,
          errors: validateRow(row, index + 1),
        })
      );

      console.log("convertedUsers", convertedUsers);
      setImportedUsers(convertedUsers);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      setValidationError((prev) => [
        ...prev,
        "Failed to process Excel file. Please check the file format.",
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      processExcelFile(file);
    },
    [users]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const validateRow = (row: any, rowIndex: number) => {
    const errors: { [key: string]: string } = {};
    const hasAnyData = Object.values(row).some(
      (value) => value && String(value).trim() !== ""
    );

    // Only validate if there's any data in the row
    if (!hasAnyData) {
      return undefined;
    }

    // Name validation
    const nameStr = row.Name ? String(row.Name) : "";
    if (!nameStr.trim()) {
      errors.name = "Tên là bắt buộc";
    } else {
      const trimmedName = nameStr.trim();
      if (trimmedName.length < 3 || trimmedName.length > 50) {
        errors.name = "Tên phải có từ 3-50 ký tự";
      }
      // Check for multiple consecutive spaces
      if (/\s{2,}/.test(trimmedName)) {
        errors.name = "Tên không được chứa nhiều khoảng trắng liên tiếp";
      }
      // Allow only letters (including Vietnamese) and single spaces
      if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/.test(trimmedName)) {
        errors.name =
          "Tên chỉ được chứa chữ cái (bao gồm tiếng Việt) và khoảng trắng đơn giữa các từ";
      }
    }

    // Email validation
    const emailStr = row.Email ? String(row.Email) : "";
    if (!emailStr.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/^\S+@\S+$/.test(emailStr.trim())) {
      errors.email = "Định dạng email không hợp lệ";
    }

    // Phone validation (optional)
    if (row.Phone) {
      const phone = String(row.Phone).trim();

      if (!phoneError.pattern.test(phone)) {
        errors.phone = phoneError.message;
      }
    }

    // Address validation (optional)
    if (row.Address) {
      const address = String(row.Address).trim();
      if (address.length > 200) {
        errors.address = "Địa chỉ phải có 200 ký tự hoặc ít hơn";
      }
      // Check for multiple consecutive spaces
      if (/\s{2,}/.test(address)) {
        errors.address = "Địa chỉ không được chứa nhiều khoảng trắng liên tiếp";
      }
      // Check for allowed characters
      if (!/^[a-zA-ZÀ-ỹ0-9\s,\.\/]+$/.test(address)) {
        errors.address =
          "Địa chỉ chỉ được chứa chữ cái (bao gồm tiếng Việt), số, khoảng trắng và các ký tự đặc biệt: , . /";
      }
    }

    // Role validation
    if (!row.Role) {
      errors.roleId = "Vai trò là bắt buộc";
    } else {
      const roleNum = Number(row.Role);
      if (isNaN(roleNum) || !Number.isInteger(roleNum)) {
        errors.roleId = "Vai trò là bắt buộc";
      } else if (roleNum < 1 || roleNum > 5) {
        errors.roleId = "Vai trò là bắt buộc";
      }
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  };

  const handleCellChange = (
    userId: string,
    field: string,
    value: string | number
  ) => {
    setImportedUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          // Create a row object with the correct capitalized field names
          const row = {
            Name: field === "name" ? value : user.name,
            Email: field === "email" ? value : user.email,
            Phone: field === "phone" ? value : user.phone,
            Address: field === "address" ? value : user.address,
            Role: field === "roleId" ? value : user.roleId,
          };

          // Validate the entire row
          const errors = validateRow(row, 0);

          return {
            ...user,
            [field]: value,
            errors: errors,
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
    };
    setImportedUsers((prev) => [...prev, newUser]);
  };

  const removeRow = (userId: string) => {
    setImportedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleSave = async () => {
    if (!handleCheck()) {
      return;
    }
    try {
      setIsLoading(true);
      // Convert ImportedUser to RawUserData format
      const rawUsers = importedUsers.map((user) => ({
        Name: user.name,
        Email: user.email,
        Role: user.roleId,
        Phone: user.phone,
        Address: user.address,
      }));

      // Convert to CreateUserInput format
      const convertedUsers = convertRawUsersToCreateUserInput(
        rawUsers,
        roles || []
      );

      await createUsers(convertedUsers);
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Không thể tạo người dùng");
    } finally {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/dashboard/users");
      toast.success("Tạo người dùng thành công");
      setIsLoading(false);
    }
  };

  const handleCheck = () => {
    setValidationError([]); // Clear previous validation errors
    const errors: string[] = [];

    // Check for empty required fields
    const emptyRowsRequired = importedUsers.filter(
      (user) => !user.name.trim() || !user.email.trim() || !user.roleId
    );
    if (emptyRowsRequired.length > 0) {
      errors.push(
        "Vui lòng điền tất cả các trường bắt buộc (Tên, Email, Vai trò) trước khi kiểm tra"
      );
    }

    // Check account limit
    if (importedUsers.length > 50) {
      errors.push("Không thể nhập quá 50 tài khoản cùng lúc");
    }

    // Check for row-level validation errors
    const rowsWithErrors: number[] = [];
    importedUsers.forEach((user, index) => {
      const row = {
        Name: user.name,
        Email: user.email,
        Phone: user.phone,
        Address: user.address,
        Role: user.roleId,
      };
      const rowErrors = validateRow(row, index + 1);
      if (rowErrors && Object.keys(rowErrors).length > 0) {
        rowsWithErrors.push(index + 1);
      }
    });
    if (rowsWithErrors.length > 0) {
      errors.push(`Có lỗi trong các hàng: ${rowsWithErrors.join(", ")}`);
    }

    // Check for duplicate emails within the import
    const emailMap = new Map<string, number[]>();
    importedUsers.forEach((user, index) => {
      const email = user.email.trim();
      if (!email) return; // Skip empty emails
      const existingRows = emailMap.get(email) || [];
      emailMap.set(email, [...existingRows, index + 1]);
    });

    // Find all rows with duplicate emails
    emailMap.forEach((rows, email) => {
      if (rows.length > 1) {
        errors.push(
          `Email trùng lặp trong các dòng: ${rows
            .sort((a, b) => a - b)
            .join(", ")}`
        );
      }
    });

    // Check if emails already exist in the system
    const existingEmailRows: number[] = [];
    importedUsers.forEach((user, index) => {
      const email = user.email.trim();
      if (!email) return; // Skip empty emails
      if (users.some((existingUser) => existingUser.email === email)) {
        existingEmailRows.push(index + 1);
      }
    });
    if (existingEmailRows.length > 0) {
      errors.push(
        `Email đã tồn tại ở các dòng: ${existingEmailRows
          .sort((a, b) => a - b)
          .join(", ")}`
      );
    }

    // Check for duplicate phone numbers
    const phoneMap = new Map<string, number[]>();
    importedUsers.forEach((user, index) => {
      const phone = user.phone ? String(user.phone).trim() : "";
      if (!phone) return; // Skip empty phones
      const existingRows = phoneMap.get(phone) || [];
      phoneMap.set(phone, [...existingRows, index + 1]);
    });

    // Find all rows with duplicate phones
    phoneMap.forEach((rows, phone) => {
      if (rows.length > 1) {
        errors.push(`: ${rows.sort((a, b) => a - b).join(", ")}`);
      }
    });

    // Check if phone numbers already exist in the system
    const existingPhoneRows: number[] = [];
    importedUsers.forEach((user, index) => {
      const phone = user.phone ? String(user.phone).trim() : "";
      if (!phone) return; // Skip empty phones
      if (
        users.some((existingUser) => {
          const metadata = existingUser.metadata as Record<string, any>;
          return metadata?.phone === phone;
        })
      ) {
        existingPhoneRows.push(index + 1);
      }
    });
    if (existingPhoneRows.length > 0) {
      errors.push(
        `Số điện thoại đã tồn tại ở các dòng: ${existingPhoneRows
          .sort((a, b) => a - b)
          .join(", ")}`
      );
    }

    setValidationError(errors);
    if (errors.length > 0) {
      return false;
    }
    setValidationError([]);
    toast.success("Tất cả dữ liệu đều hợp lệ");
    return true;
  };

  const handleClearTable = () => {
    setImportedUsers([]);
    setValidationError([]);
    toast.success("Bảng đã được xóa");
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">
              Đang xử lý file excel ...
            </p>
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

      {validationError.length > 0 && (
        <div className="p-4 rounded-lg space-y-2 bg-red-50 border border-red-200">
          {validationError.length > 0 && (
            <>
              {validationError.map((error, index) => (
                <p key={`validation-${index}`} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </>
          )}
        </div>
      )}

      {importedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Dữ liệu đã nhập</h3>
            <div className="space-x-2 items-start">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewRow}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm hàng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (handleCheck()) {
                    toast.success("Tất cả dữ liệu đều hợp lệ");
                  }
                }}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Kiểm tra
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearTable}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa bảng
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isLoading || importedUsers.some((user) => user.errors)
                }
                className="bg-primary text-white hover:bg-primary/90"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo người dùng"
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead>
                    Tên <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead>
                    Email <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="w-[300px]">Địa chỉ</TableHead>
                  <TableHead>
                    Vai trò <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
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
                            <p className="whitespace-normal break-words">
                              {user.errors.name}
                            </p>
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
                          <div className="text-sm text-red-500 max-w-[300px]">
                            <p className="whitespace-normal break-words">
                              {user.errors.phone}
                            </p>
                          </div>
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
                          className={
                            user.errors?.address
                              ? "border-red-500 resize-none"
                              : "resize-none"
                          }
                          disabled={isLoading}
                          rows={2}
                        />
                        {user.errors?.address && (
                          <div className="text-sm text-red-500 max-w-[300px]">
                            <p className="whitespace-normal break-words">
                              {user.errors.address}
                            </p>
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
                            className={
                              user.errors?.roleId ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id?.toString() || ""}
                              >
                                {userRole[role.name]}
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
