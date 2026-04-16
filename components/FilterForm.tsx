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

import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { usePresets } from "@/hooks/use-presets";
import { 
  Settings2, 
  Bookmark, 
  ChevronDown, 
  Trash, 
  Save, 
  RotateCcw, 
  RotateCw 
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { translations } from "@/lib/i18n";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

export default function FilterForm({ onSubmit, isLoading, disabled }: FilterFormProps) {
  const [presetName, setPresetName] = React.useState("");
  const [isSaveOpen, setIsSaveOpen] = React.useState(false);
  const { presets, savePreset, deletePreset } = usePresets();
  const { 
    sessions, 
    activeSessionId, 
    undo, 
    redo,
    language 
  } = useAnalysisStore();
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const t = translations[language];

  const canUndo = (activeSession?.historyIndex ?? 0) > 0;
  const canRedo = (activeSession?.historyIndex ?? 0) < (activeSession?.history.length ?? 0) - 1;

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      commentPattern: activeSession?.filter.commentPattern || "",
      threshold: activeSession?.filter.threshold || 80,
      startDate: (activeSession?.filter.startDate instanceof Date ? activeSession.filter.startDate : new Date()).toISOString().split('T')[0],
      endDate: (activeSession?.filter.endDate instanceof Date ? activeSession.filter.endDate : new Date()).toISOString().split('T')[0],
    },
  });

  // Sync form when active session changes
  React.useEffect(() => {
    if (activeSession) {
      reset({
        commentPattern: activeSession.filter.commentPattern,
        threshold: activeSession.filter.threshold,
        startDate: new Date(activeSession.filter.startDate).toISOString().split('T')[0],
        endDate: new Date(activeSession.filter.endDate).toISOString().split('T')[0],
      });
    }
  }, [activeSessionId, reset, activeSession]);

  const thresholdValue = watch("threshold") || 80;
  const currentValues = watch();

  const handleSavePreset = () => {
    if (!presetName) return;
    savePreset(presetName, {
      commentPattern: currentValues.commentPattern,
      threshold: currentValues.threshold,
      startDate: currentValues.startDate,
      endDate: currentValues.endDate,
    });
    setPresetName("");
    setIsSaveOpen(false);
  };

  const loadPreset = (preset: any) => {
    setValue("commentPattern", preset.commentPattern);
    setValue("threshold", preset.threshold);
    setValue("startDate", preset.startDate);
    setValue("endDate", preset.endDate);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
      {/* Preset & History Section */}
      <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.shortcuts}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-md" 
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <RotateCcw size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.undo} (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-md" 
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <RotateCw size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.redo} (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex-1 gap-2 rounded-lg text-xs font-semibold" disabled={presets.length === 0}>
                <Bookmark size={14} />
                {presets.length > 0 ? `${t.presets} (${presets.length})` : t.noPresets}
                <ChevronDown size={12} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center justify-between group">
                  <DropdownMenuItem 
                    className="flex-1 cursor-pointer"
                    onClick={() => loadPreset(preset)}
                  >
                    {preset.name}
                  </DropdownMenuItem>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                    }}
                  >
                    <Trash size={12} />
                  </Button>
                </div>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[10px] text-muted-foreground justify-center pointer-events-none">
                {presets.length} {t.presets.toLowerCase()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isSaveOpen} onOpenChange={setIsSaveOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 gap-2 rounded-lg text-xs font-semibold px-4">
                <Save size={14} />
                {t.saveNew}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">{t.savePreset}</h4>
                  <p className="text-[10px] text-muted-foreground">{t.storeCurrent}</p>
                </div>
                <Input 
                  placeholder="Preset name..." 
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                />
                <Button 
                  size="sm" 
                  className="w-full h-8 text-xs font-bold" 
                  onClick={handleSavePreset}
                  disabled={!presetName}
                >
                  {t.confirmSave}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commentPattern" className="text-sm font-semibold">{t.commentPattern}</Label>
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
          <Label className="text-sm font-semibold">{t.threshold}</Label>
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
          <Label htmlFor="startDate" className="text-sm font-semibold">{t.startDate}</Label>
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
          <Label htmlFor="endDate" className="text-sm font-semibold">{t.endDate}</Label>
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
        {isLoading ? t.analyzing : t.analyzeTransactions}
      </Button>
    </form>
  );
}
