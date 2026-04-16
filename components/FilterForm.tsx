"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const schema = z.object({
  commentPattern: z.string().min(1, "Nhập comment pattern"),
  threshold: z.number().min(0).max(100),
  startDate: z.string().min(1, "Chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Chọn ngày kết thúc"),
}).refine(d => new Date(d.startDate) <= new Date(d.endDate), {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
});

export type FilterFormData = z.infer<typeof schema>;

interface FilterFormProps {
  onSubmit: (data: FilterFormData) => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function FilterForm({ onSubmit, isLoading, disabled }: FilterFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      commentPattern: "",
      threshold: 80,
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  });

  const thresholdValue = watch("threshold") || 80;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
      <div className="space-y-2">
        <Label htmlFor="commentPattern">Comment Pattern (phân tách bằng phẩy, v.d: BBS41, DCA)</Label>
        <Input
          id="commentPattern"
          placeholder="VD: BBS41, DCA, 111"
          {...register("commentPattern")}
          disabled={disabled || isLoading}
        />
        {errors.commentPattern && (
          <p className="text-sm text-red-500">{errors.commentPattern.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ngưỡng tương đồng (Độ chính xác text)</Label>
          <span className="text-sm font-medium">{thresholdValue}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[thresholdValue]}
          onValueChange={(val) => setValue("threshold", Array.isArray(val) ? val[0] : (val as any)[0] ?? val)}
          disabled={disabled || isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Ngày bắt đầu</Label>
          <Input
            id="startDate"
            type="date"
            {...register("startDate")}
            disabled={disabled || isLoading}
          />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Ngày kết thúc</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
            disabled={disabled || isLoading}
          />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={disabled || isLoading}
      >
        {isLoading ? "Đang phân tích..." : "Phân tích giao dịch"}
      </Button>
    </form>
  );
}
