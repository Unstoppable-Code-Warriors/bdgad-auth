"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState, useRef } from "react";
interface ImportExcelFormProps {
  closeModal: () => void;
}
const ImportExcelForm = ({ closeModal }: ImportExcelFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel file before submitting.");
      return;
    }

    setError(null);
    console.log("Submitting file:", file);
    closeModal();
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
