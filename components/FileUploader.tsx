"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { UploadCloud, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t } = useTranslation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".htm") || name.endsWith(".html") || name.endsWith(".csv")) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert(t('uploader.invalidFile'));
      }
    }
  }, [onFileSelect, t]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".htm") || name.endsWith(".html") || name.endsWith(".csv")) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert(t('uploader.invalidFile'));
      }
    }
  }, [onFileSelect, t]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    onFileSelect(null);
  }, [onFileSelect]);

  return (
    <div className="w-full">
      {!selectedFile ? (
        <label
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive ? "border-primary bg-primary/10" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500 font-medium">
              <span className="font-semibold text-primary">{t('uploader.clickToSelect')}</span> {t('uploader.orDrag')}
            </p>
            <p className="text-xs text-slate-400">{t('uploader.formatHint')}</p>
            <Link
              href="/AboutMT5"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
            >
              <Info className="h-3 w-3" />
              {t('uploader.aboutMt5')}
            </Link>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".htm,.html,.csv"
            onChange={handleChange}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <UploadCloud className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 break-all">{selectedFile.name}</p>
              <p className="text-xs text-green-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile} className="text-slate-500 hover:text-red-500">
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
