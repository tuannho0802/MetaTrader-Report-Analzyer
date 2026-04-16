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
  commentPattern: z.string().min(1, "Enter comment pattern"),
  threshold: z.number().min(0).max(100),
  startDate: z.string().min(1, "Select start date"),
  endDate: z.string().min(1, "Select end date"),
}).refine(d => new Date(d.startDate) <= new Date(d.endDate), {
  message: "End date must be after start date",
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
        <Label htmlFor="commentPattern" className="text-sm font-semibold">Comment Pattern (comma separated, e.g: BBS41, DCA)</Label>
        <Input
          id="commentPattern"
          placeholder="e.g. BBS41, DCA, 111"
          {...register("commentPattern")}
          disabled={disabled || isLoading}
          className="rounded-lg h-10"
        />
        {errors.commentPattern && (
          <p className="text-xs text-rose-500 font-medium">{errors.commentPattern.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Similarity Threshold (Text Accuracy)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              {thresholdValue}%
            </span>
          </div>
        </div>
        <div className="px-1">
          <Slider
            min={0}
            max={100}
            step={1}
            value={[thresholdValue]}
            onValueChange={(val) => setValue("threshold", Array.isArray(val) ? val[0] : (val as any)[0] ?? val)}
            disabled={disabled || isLoading}
            className="mb-6"
          />
          <div className="flex justify-between px-1 mt-[-12px]">
            <span className="text-[10px] text-muted-foreground font-medium">0%</span>
            <span className="text-[10px] text-muted-foreground font-medium">50%</span>
            <span className="text-[10px] text-muted-foreground font-medium">100%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-semibold">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...register("startDate")}
            disabled={disabled || isLoading}
            className="rounded-lg h-10"
          />
          {errors.startDate && (
            <p className="text-xs text-rose-500 font-medium">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-semibold">End Date</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
            disabled={disabled || isLoading}
            className="rounded-lg h-10"
          />
          {errors.endDate && (
            <p className="text-xs text-rose-500 font-medium">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
        disabled={disabled || isLoading}
      >
        {isLoading ? "Analyzing..." : "Analyze Transactions"}
      </Button>
    </form>
  );
}
