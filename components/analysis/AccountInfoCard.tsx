"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { Shield, User, Hash } from "lucide-react";

interface AccountInfoCardProps {
  broker?: string;
  accountNumber?: string;
  accountName?: string;
}

export function AccountInfoCard({
  broker,
  accountNumber,
  accountName,
}: AccountInfoCardProps) {
  const { t } = useTranslation();

  if (!broker && !accountNumber && !accountName) return null;

  return (
    <Card className="border border-border/50 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden mb-4">
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {broker && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield size={14} className="text-primary/70 shrink-0" />
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                {t("dashboard.accountInfo.broker")}:
              </span>
              <span className="font-semibold truncate">{broker}</span>
            </div>
          )}
          {accountNumber && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Hash size={14} className="text-primary/70 shrink-0" />
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                {t("dashboard.accountInfo.account")}:
              </span>
              <span className="font-bold tracking-tight">
                {accountNumber}
                {accountName && (
                  <span className="ml-1.5 text-muted-foreground font-medium opacity-80">
                    ({accountName})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
