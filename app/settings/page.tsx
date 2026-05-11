"use client";

import React, { useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon, 
  Languages, 
  Moon, 
  Sun, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Monitor,
  LayoutGrid,
  Settings2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const SUPPORTED_CURRENCIES = ['USD', 'USC', 'EUR', 'GBP', 'AUD', 'VND', 'JPY'];

export default function SettingsPage() {
  const { 
    language, setLanguage, 
    maxTabs, setMaxTabs,
    baseCurrency, setBaseCurrency,
    autoConvertCurrency, setAutoConvertCurrency
  } = useSettingsStore();
  const { reset, sessions } = useAnalysisStore();
  const totalSessionsCount = sessions.length;
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isClearCacheOpen, setIsClearCacheOpen] = useState(false);

  const handleClearAllData = () => {
    try {
      // 1. Delete all IndexedDB databases known to the app
      indexedDB.deleteDatabase('MT4AnalyzerDB');
      
      // 2. Comprehensive localStorage cleanup
      const keysToRemove: string[] = [];
      const appKeyPattern = /^(exchange-rates-cache|settings-storage|mt4-sessions|mt4-profit-filter|trades-cache|mt4-analyzer)/i;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && appKeyPattern.test(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // 3. Clear session storage
      sessionStorage.clear();
      
      // 4. Force reload to reset state
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear all data", error);
      alert("An unexpected error occurred while clearing data. Please try clearing your browser cache manually.");
    }
  };

  const handleClearCache = () => {
    try {
      // 1. Target only cache-related keys
      const keysToRemove: string[] = [];
      const cachePattern = /^(exchange-rates-cache|trades-cache)/i;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && cachePattern.test(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // 2. Reload to refresh data
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear cache", error);
      alert("Failed to clear cache.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Localization & Appearance */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              {t('settings.localization.title')}
            </CardTitle>
            <CardDescription>{t('settings.localization.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">{t('common.language')}</Label>
              <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="vi">Tiếng Việt (VN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('settings.localization.theme')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" /> {t('common.light')}
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" /> {t('common.dark')}
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4" /> {t('common.system')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {t('common.currencySettings')}
            </CardTitle>
            <CardDescription>{t('common.currencySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {autoConvertCurrency && (
              <div className="space-y-2">
                <Label>{t('common.baseCurrency')}</Label>
                <Select value={baseCurrency} onValueChange={(val) => val && setBaseCurrency(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">
                  {t('common.autoConvertDesc')}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    {t('common.autoConvert')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('common.autoConvertDesc')}
                  </p>
                </div>
              <Switch 
                checked={autoConvertCurrency} 
                onCheckedChange={setAutoConvertCurrency}
              />
            </div>
          </CardContent>
        </Card>

        {/* Workspace Preferences */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              {t('settings.analysis.title')}
            </CardTitle>
            <CardDescription>{t('settings.analysis.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="max-tabs">{t('settings.analysis.maxTabs')}</Label>
                <span className="text-sm font-bold text-primary">{maxTabs}</span>
              </div>
              <Slider 
                id="max-tabs"
                value={[maxTabs]} 
                onValueChange={(v) => { if (Array.isArray(v)) setMaxTabs(v[0]); }} 
                min={1} 
                max={10} 
                step={1} 
              />
              <p className="text-[10px] text-muted-foreground italic">
                {t('settings.analysis.maxTabsDesc')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="md:col-span-2 border-border/50 shadow-lg border-rose-500/20">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                {t('settings.dataManagement.title')}
              </CardTitle>
              <CardDescription>{t('settings.dataManagement.clearAllDataDesc')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('settings.dataManagement.storedData')}</p>
                <p className="text-lg font-black text-foreground">{totalSessionsCount} {t('settings.dataManagement.sessions')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                <div className="space-y-1 mr-4">
                  <h4 className="text-sm font-semibold text-foreground">{t('settings.dataManagement.clearCache')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.dataManagement.clearCacheDesc')}</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsClearCacheOpen(true)}
                  className="shrink-0"
                >
                  {t('settings.dataManagement.clearCache')}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-rose-500/20 bg-rose-500/5 rounded-lg">
                <div className="space-y-1 mr-4">
                  <h4 className="text-sm font-semibold text-rose-500">{t('settings.dataManagement.clearAllData')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.dataManagement.clearAllDataDesc')}</p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={() => setIsClearAllOpen(true)}
                  className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {t('settings.dataManagement.clearAllData')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={isClearCacheOpen}
        onOpenChange={setIsClearCacheOpen}
        title={t('settings.dataManagement.confirmClearCacheTitle')}
        description={t('settings.dataManagement.confirmClearCacheDesc')}
        confirmLabel={t('settings.dataManagement.confirmClearCacheButton')}
        onConfirm={handleClearCache}
      />

      <ConfirmDialog
        open={isClearAllOpen}
        onOpenChange={setIsClearAllOpen}
        title={t('settings.dataManagement.confirmClearAllTitle')}
        description={t('settings.dataManagement.confirmClearAllDesc')}
        confirmLabel={t('settings.dataManagement.confirmClearAllButton')}
        variant="destructive"
        onConfirm={handleClearAllData}
      />
    </div>
  );
}
