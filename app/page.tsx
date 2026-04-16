"use client";

import React, { useState } from "react";
import FileUploader from "@/components/FileUploader";
import FilterForm, { FilterFormData } from "@/components/FilterForm";
import ResultsTable from "@/components/ResultsTable";
import { runParserWorker } from "@/lib/parser";
import { ParseResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFilter = async (data: FilterFormData) => {
    if (!file) {
      setErrorMsg("Vui lòng upload file MT4 Statement (.htm/.html) trước.");
      return;
    }

    setIsProcessing(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await runParserWorker(file, {
        commentPattern: data.commentPattern,
        threshold: data.threshold,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }, (msg) => setStatusMsg(msg));
      
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã có lỗi xảy ra trong quá trình phân tích file.");
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MT4 EA Profit Filter</h1>
          <p className="text-slate-500 mt-2">Phân tích Statement và lọc profit theo thuật toán tìm kiếm Comment thông minh</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dữ liệu đầu vào</CardTitle>
                <CardDescription>Upload file HTML xuất từ MT4 và nhập điều kiện lọc</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader onFileSelect={(f) => {
                  setFile(f);
                  setErrorMsg("");
                  setResult(null);
                }} />
                
                {errorMsg && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {errorMsg}
                  </div>
                )}
                
                {statusMsg && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-md text-sm flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    {statusMsg}
                  </div>
                )}

                <FilterForm 
                  onSubmit={handleFilter} 
                  isLoading={isProcessing}
                  disabled={!file}
                />
              </CardContent>
            </Card>
          </div>

          <div className="w-full">
            <ResultsTable result={result} />
          </div>
        </div>
      </div>
    </main>
  );
}
