"use client";

import React from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAnalysisStore } from "@/lib/store/useAnalysisStore";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
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
  LayoutGrid
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

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear ALL trading data and sessions? This cannot be undone.")) {
      reset().catch(console.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('common.settings')}</h1>
          <p className="text-muted-foreground text-sm">Configure your preferences and manage application data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Localization & Appearance */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              Localization & Theme
            </CardTitle>
            <CardDescription>Visual and language preferences</CardDescription>
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
              <Label>App Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" /> Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" /> Dark
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'outline'} 
                  className="w-full gap-2"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4" /> System
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
                  All reports will be converted to this currency using live exchange rates.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('common.autoConvert')}</Label>
                <p className="text-[10px] text-muted-foreground italic">
                  Automatically convert all monetary values to base currency
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
              <LayoutGrid className="h-5 w-5 text-primary" />
              Workspace
            </CardTitle>
            <CardDescription>Manage your active tab limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="max-tabs">Maximum Active Reports</Label>
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
                Higher limits may increase browser memory consumption. Default is 5.
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
                Data Management
              </CardTitle>
              <CardDescription>Backup, restore, and session cleanup</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Stored Data</p>
                <p className="text-lg font-black text-foreground">{totalSessionsCount} Sessions</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2" disabled>
                <Download className="h-5 w-5" />
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold">Export Backup</span>
                  <span className="text-[10px] opacity-60">Save all sessions to .json</span>
                </div>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" disabled>
                <Upload className="h-5 w-5" />
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold">Import Backup</span>
                  <span className="text-[10px] opacity-60">Restore from .json file</span>
                </div>
              </Button>
              <Button 
                variant="destructive" 
                className="h-20 flex-col gap-2 bg-rose-500 hover:bg-rose-600"
                onClick={handleClearData}
              >
                <Trash2 className="h-5 w-5" />
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold">Clear All Data</span>
                  <span className="text-[10px] opacity-60">Wipe IndexedDB & Storage</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
