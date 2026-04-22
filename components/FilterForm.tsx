"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const createSchema = (t: any) => z.object({
  commentPattern: z.string().min(1, t('filter.errors.patternRequired')),
  threshold: z.number().min(0).max(100),
  startDate: z.string().min(1, t('filter.errors.startDateRequired')),
  endDate: z.string().min(1, t('filter.errors.endDateRequired')),
  filterMode: z.enum(['id', 'comment', 'both']),
}).refine(d => new Date(d.startDate) <= new Date(d.endDate), {
  message: t('filter.errors.dateOrder'),
  path: ["endDate"],
});

export type FilterFormData = {
  commentPattern: string;
  threshold: number;
  startDate: string;
  endDate: string;
  filterMode: 'id' | 'comment' | 'both';
};

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
import { useTranslation } from "@/lib/i18n";
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
    errorMsg
  } = useAnalysisStore();
  const { t } = useTranslation();
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const canUndo = (activeSession?.historyIndex ?? 0) > 0;
  const canRedo = (activeSession?.historyIndex ?? 0) < (activeSession?.history.length ?? 0) - 1;

  const schema = React.useMemo(() => createSchema(t), [t]);

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
      filterMode: activeSession?.filter.filterMode || 'id',
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
        filterMode: activeSession.filter.filterMode,
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
      filterMode: currentValues.filterMode,
    });
    setPresetName("");
    setIsSaveOpen(false);
  };

  const loadPreset = (preset: any) => {
    setValue("commentPattern", preset.commentPattern);
    setValue("threshold", preset.threshold);
    setValue("startDate", preset.startDate);
    setValue("endDate", preset.endDate);
    if (preset.filterMode) setValue("filterMode", preset.filterMode);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-semibold text-rose-500 text-center">{errorMsg}</p>
        </div>
      )}
      {/* Preset & History Section */}
      <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('filter.shortcuts')}</span>
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
              <TooltipContent>{t('common.undo')} (Ctrl+Z)</TooltipContent>
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
              <TooltipContent>{t('common.redo')} (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex-1 gap-2 rounded-lg text-xs font-semibold" disabled={presets.length === 0}>
                <Bookmark size={14} />
                {presets.length > 0 ? `${t('filter.presets')} (${presets.length})` : t('filter.noPresets')}
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
                {presets.length} {t('filter.presets').toLowerCase()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isSaveOpen} onOpenChange={setIsSaveOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 gap-2 rounded-lg text-xs font-semibold px-4">
                <Save size={14} />
                {t('common.save')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">{t('filter.savePreset')}</h4>
                  <p className="text-[10px] text-muted-foreground">{t('filter.storeCurrent')}</p>
                </div>
                <Input 
                  placeholder={t('filter.presetName')} 
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
                  {t('common.confirm')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commentPattern" className="text-sm font-semibold">{t('filter.pattern')}</Label>
        <Input
          id="commentPattern"
          placeholder={t('filter.patternPlaceholder')}
          {...register("commentPattern")}
          disabled={disabled || isLoading}
          className="rounded-lg h-10"
        />
        {errors.commentPattern && (
          <p className="text-xs text-rose-500 font-medium">{errors.commentPattern.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t('filter.mode')}</Label>
        <RadioGroup 
          value={watch("filterMode")} 
          onValueChange={(v) => setValue("filterMode", v as any)}
          className="flex flex-col gap-2.5 p-1"
        >
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setValue("filterMode", "id")}>
            <RadioGroupItem value="id" id="mode-id" />
            <div className="grid gap-0.5 cursor-pointer">
              <Label htmlFor="mode-id" className="text-sm font-bold cursor-pointer">{t('filter.modeId')}</Label>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setValue("filterMode", "comment")}>
            <RadioGroupItem value="comment" id="mode-comment" />
            <div className="grid gap-0.5 cursor-pointer">
              <Label htmlFor="mode-comment" className="text-sm font-bold cursor-pointer">{t('filter.modeComment')}</Label>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setValue("filterMode", "both")}>
            <RadioGroupItem value="both" id="mode-both" />
            <div className="grid gap-0.5 cursor-pointer">
              <Label htmlFor="mode-both" className="text-sm font-bold cursor-pointer">{t('filter.modeBoth')}</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">{t('filter.threshold')}</Label>
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
          <Label htmlFor="startDate" className="text-sm font-semibold">{t('filter.startDate')}</Label>
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
          <Label htmlFor="endDate" className="text-sm font-semibold">{t('filter.endDate')}</Label>
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
        {isLoading ? t('filter.analyzing') : t('filter.analyze')}
      </Button>
    </form>
  );
}
